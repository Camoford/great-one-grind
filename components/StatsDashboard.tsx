import React, { useMemo } from "react";
import { useHunterStore } from "../store";
import { readSessionHistory } from "../src/utils/sessionHistory";

/* ---------------- helpers ---------------- */

function pretty(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function pace(kills: number, ms: number) {
  if (!ms || ms <= 0) return 0;
  return (kills / ms) * 3600000;
}

function ymdFromTs(ts: number) {
  try {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  } catch {
    return "";
  }
}

function dayKeyToTs(day: string) {
  // day = YYYY-MM-DD
  const t = new Date(`${day}T00:00:00`).getTime();
  return Number.isFinite(t) ? t : 0;
}

function addDays(ts: number, days: number) {
  return ts + days * 86400000;
}

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/* ---------------- types ---------------- */

type SessionLike = {
  totalKills?: number;
  durationMs?: number;
  startedAt?: number;
  startAt?: number;
  endedAt?: number;
  endAt?: number;
  activeSpecies?: string;
  species?: string;
  speciesBreakdown?: { species: string; kills: number }[];
};

/* ---------------- UI bits ---------------- */

function ProPill() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide opacity-80">
      PRO
    </span>
  );
}

function LockedCard(props: { title: string; bullets: string[] }) {
  return (
    <div className="rounded-2xl border bg-white/5 p-4 space-y-2 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="font-semibold">
          {props.title} <ProPill />
        </div>
        <span className="text-[11px] opacity-70">Locked</span>
      </div>

      <div className="text-sm opacity-80">
        Unlock PRO to see:
        <ul className="mt-2 list-disc pl-5 space-y-1 opacity-90">
          {props.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border bg-black/20 p-3 text-xs opacity-80">
        Go to the <span className="font-semibold">Upgrade</span> tab to enable{" "}
        <span className="font-semibold">PRO Test</span> (UI-only).
      </div>
    </div>
  );
}

/* ---------------- component ---------------- */

export default function StatsDashboard() {
  const grinds = useHunterStore((s) => s.grinds);
  const isPro = useHunterStore((s) => s.isPro);

  const sessions: SessionLike[] = useMemo(() => {
    const list = readSessionHistory();
    return Array.isArray(list) ? (list.filter(Boolean) as SessionLike[]) : [];
  }, []);

  const records = useMemo(() => {
    // ---- v2 records (session + per species) ----
    let bestKills = 0;
    let bestKillsSession: SessionLike | null = null;

    let longestMs = 0;
    let longestSession: SessionLike | null = null;

    let bestPace = 0;
    let bestPaceSession: SessionLike | null = null;

    const bySpecies = new Map<
      string,
      {
        bestKills?: { kills: number };
        bestPace?: { pace: number };
        longest?: { durationMs: number };
      }
    >();

    for (const s of sessions) {
      const kills = clampInt(s.totalKills || 0);
      const ms = clampInt(s.durationMs || 0);
      const p = pace(kills, ms);

      if (kills > bestKills) {
        bestKills = kills;
        bestKillsSession = s;
      }
      if (ms > longestMs) {
        longestMs = ms;
        longestSession = s;
      }
      if (p > bestPace) {
        bestPace = p;
        bestPaceSession = s;
      }

      if (Array.isArray(s.speciesBreakdown)) {
        for (const b of s.speciesBreakdown) {
          const species = String(b?.species || "");
          if (!species) continue;

          const entry = bySpecies.get(species) || {};

          const bk = clampInt((b as any)?.kills || 0);
          if (!entry.bestKills || bk > entry.bestKills.kills) {
            entry.bestKills = { kills: bk };
          }

          const sp = pace(bk, ms);
          if (!entry.bestPace || sp > entry.bestPace.pace) {
            entry.bestPace = { pace: sp };
          }

          if (!entry.longest || ms > entry.longest.durationMs) {
            entry.longest = { durationMs: ms };
          }

          bySpecies.set(species, entry);
        }
      }
    }

    const speciesRows = [...bySpecies.entries()]
      .map(([species, r]) => ({
        species,
        bestKills: r.bestKills?.kills ?? null,
        bestPace: r.bestPace?.pace ?? null,
        longestMs: r.longest?.durationMs ?? null,
      }))
      .sort((a, b) => a.species.localeCompare(b.species));

    // ---- v3 insights (daily + streaks + rolling) ----
    const byDay = new Map<
      string,
      { day: string; sessions: number; kills: number; ms: number }
    >();

    for (const s of sessions) {
      const ts =
        clampInt(s.endedAt || 0) ||
        clampInt(s.endAt || 0) ||
        clampInt(s.startedAt || 0) ||
        clampInt(s.startAt || 0) ||
        0;

      if (!ts) continue;

      const day = ymdFromTs(ts);
      if (!day) continue;

      const entry = byDay.get(day) || { day, sessions: 0, kills: 0, ms: 0 };
      entry.sessions += 1;
      entry.kills += clampInt(s.totalKills || 0);
      entry.ms += clampInt(s.durationMs || 0);
      byDay.set(day, entry);
    }

    const days = [...byDay.values()].sort((a, b) => dayKeyToTs(a.day) - dayKeyToTs(b.day));

    // Best day ever (by kills)
    let bestDay: (typeof days)[number] | null = null;
    for (const d of days) {
      if (!bestDay || d.kills > bestDay.kills) bestDay = d;
    }

    // Streaks based on "any session that day"
    function calcStreaks() {
      if (days.length === 0) return { current: 0, longest: 0 };

      const daySet = new Set(days.map((d) => d.day));
      const sortedDays = [...daySet].sort((a, b) => dayKeyToTs(a) - dayKeyToTs(b));

      // Longest streak
      let longest = 1;
      let run = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = dayKeyToTs(sortedDays[i - 1]);
        const cur = dayKeyToTs(sortedDays[i]);
        if (cur === addDays(prev, 1)) {
          run += 1;
          longest = Math.max(longest, run);
        } else {
          run = 1;
        }
      }

      // Current streak: walk backwards from most recent day
      const lastDay = sortedDays[sortedDays.length - 1];
      let current = 1;
      let cursor = dayKeyToTs(lastDay);

      while (true) {
        const prev = addDays(cursor, -1);
        const prevKey = ymdFromTs(prev);
        if (daySet.has(prevKey)) {
          current += 1;
          cursor = prev;
        } else {
          break;
        }
      }

      return { current, longest };
    }

    const streaks = calcStreaks();

    // Rolling 7-day pace (based on last 7 calendar days ending at the most recent day)
    let rolling7 = { kills: 0, ms: 0, pace: 0, from: "", to: "" };
    if (days.length > 0) {
      const last = days[days.length - 1];
      const endTs = dayKeyToTs(last.day);
      const startTs = addDays(endTs, -6);

      let k = 0;
      let ms = 0;
      for (const d of days) {
        const ts = dayKeyToTs(d.day);
        if (ts >= startTs && ts <= endTs) {
          k += d.kills;
          ms += d.ms;
        }
      }

      rolling7 = {
        kills: k,
        ms,
        pace: pace(k, ms),
        from: ymdFromTs(startTs),
        to: ymdFromTs(endTs),
      };
    }

    // PR timeline: top 5 days by kills (descending), with ties by recency
    const prTimeline = [...days]
      .sort((a, b) => {
        if (b.kills !== a.kills) return b.kills - a.kills;
        return dayKeyToTs(b.day) - dayKeyToTs(a.day);
      })
      .slice(0, 5)
      .map((d) => ({
        day: d.day,
        kills: d.kills,
        pace: pace(d.kills, d.ms),
        duration: d.ms,
        sessions: d.sessions,
      }));

    return {
      bestKillsSession,
      longestSession,
      bestPaceSession,
      speciesRows,
      // v3
      bestDay,
      streaks,
      rolling7,
      prTimeline,
    };
  }, [sessions]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Stats</h2>
        <div className="text-xs opacity-70">
          {isPro ? (
            <span className="inline-flex items-center gap-2">
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                PRO
              </span>
              <span>Enabled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold opacity-70">
                FREE
              </span>
              <span>Read-only</span>
            </span>
          )}
        </div>
      </div>

      {/* Always-visible tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white/5 p-3">
          <div className="text-xs opacity-70">Tracked Grinds</div>
          <div className="text-2xl font-semibold">{pretty(grinds.length)}</div>
        </div>
        <div className="rounded-2xl border bg-white/5 p-3">
          <div className="text-xs opacity-70">Sessions Logged</div>
          <div className="text-2xl font-semibold">{pretty(sessions.length)}</div>
        </div>
      </div>

      {/* PRO-gated: Personal Records */}
      {isPro ? (
        <div className="rounded-2xl border bg-white/5 p-4 space-y-2">
          <div className="font-semibold">
            🏆 Personal Records <ProPill />
          </div>

          {records.bestKillsSession ? (
            <div className="text-sm">
              <span className="opacity-70">Best Session:</span>{" "}
              <span className="font-medium">
                {pretty(records.bestKillsSession.totalKills || 0)} kills
              </span>{" "}
              <span className="opacity-70">
                ({formatDuration(records.bestKillsSession.durationMs || 0)})
              </span>
            </div>
          ) : (
            <div className="text-sm opacity-70">No sessions yet.</div>
          )}

          {records.longestSession && (
            <div className="text-sm">
              <span className="opacity-70">Longest Session:</span>{" "}
              <span className="font-medium">
                {formatDuration(records.longestSession.durationMs || 0)}
              </span>{" "}
              <span className="opacity-70">
                ({pretty(records.longestSession.totalKills || 0)} kills)
              </span>
            </div>
          )}

          {records.bestPaceSession && (
            <div className="text-sm">
              <span className="opacity-70">Best Pace:</span>{" "}
              <span className="font-medium">
                {pretty(
                  pace(
                    records.bestPaceSession.totalKills || 0,
                    records.bestPaceSession.durationMs || 0
                  )
                )}
              </span>{" "}
              <span className="opacity-70">kills/hour</span>
            </div>
          )}
        </div>
      ) : (
        <LockedCard
          title="🏆 Personal Records"
          bullets={[
            "Best session (kills)",
            "Longest session",
            "Best kills/hour pace",
          ]}
        />
      )}

      {/* PRO-gated: Species Records */}
      {isPro ? (
        <div className="rounded-2xl border bg-white/5 p-4 space-y-3">
          <div className="font-semibold">
            🎯 Species Records <ProPill />
          </div>

          {records.speciesRows.length === 0 ? (
            <div className="text-sm opacity-70">No per-species data yet.</div>
          ) : (
            <div className="space-y-3">
              {records.speciesRows.map((r) => (
                <div key={r.species} className="rounded-xl border bg-white/5 p-3">
                  <div className="font-medium">{r.species}</div>
                  <div className="mt-1 text-sm space-y-1">
                    <div>
                      <span className="opacity-70">Best Session:</span>{" "}
                      <span className="font-medium">
                        {pretty(r.bestKills ?? 0)}
                      </span>{" "}
                      <span className="opacity-70">kills</span>
                    </div>
                    <div>
                      <span className="opacity-70">Best Pace:</span>{" "}
                      <span className="font-medium">
                        {pretty(r.bestPace ?? 0)}
                      </span>{" "}
                      <span className="opacity-70">kills/hour</span>
                    </div>
                    <div>
                      <span className="opacity-70">Longest:</span>{" "}
                      <span className="font-medium">
                        {formatDuration(r.longestMs ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <LockedCard
          title="🎯 Species Records"
          bullets={[
            "Best session kills per species",
            "Best pace per species",
            "Longest grind sessions per species",
          ]}
        />
      )}

      {/* PRO-gated: Grinder Insights v3 */}
      {isPro ? (
        <div className="rounded-2xl border bg-white/5 p-4 space-y-3">
          <div className="font-semibold">
            📈 Grinder Insights v3 <ProPill />
          </div>

          {/* Top line insights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-white/5 p-3">
              <div className="text-xs opacity-70">Best Day Ever</div>
              {records.bestDay ? (
                <div className="mt-1">
                  <div className="text-lg font-semibold">
                    {pretty(records.bestDay.kills)} kills
                  </div>
                  <div className="text-xs opacity-70">{records.bestDay.day}</div>
                </div>
              ) : (
                <div className="text-sm opacity-70 mt-1">—</div>
              )}
            </div>

            <div className="rounded-xl border bg-white/5 p-3">
              <div className="text-xs opacity-70">Streaks</div>
              <div className="mt-1 text-sm space-y-1">
                <div>
                  <span className="opacity-70">Current:</span>{" "}
                  <span className="font-semibold">{pretty(records.streaks.current)}</span>{" "}
                  <span className="opacity-70">days</span>
                </div>
                <div>
                  <span className="opacity-70">Longest:</span>{" "}
                  <span className="font-semibold">{pretty(records.streaks.longest)}</span>{" "}
                  <span className="opacity-70">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rolling pace */}
          <div className="rounded-xl border bg-white/5 p-3">
            <div className="text-xs opacity-70">Rolling 7-Day Pace</div>
            {records.rolling7.to ? (
              <div className="mt-1 text-sm space-y-1">
                <div>
                  <span className="font-semibold">
                    {pretty(records.rolling7.pace)} kills/hour
                  </span>{" "}
                  <span className="opacity-70">
                    ({pretty(records.rolling7.kills)} kills • {formatDuration(records.rolling7.ms)})
                  </span>
                </div>
                <div className="text-xs opacity-70">
                  Window: {records.rolling7.from} → {records.rolling7.to}
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-70 mt-1">—</div>
            )}
          </div>

          {/* PR timeline */}
          <div className="rounded-xl border bg-black/20 p-3">
            <div className="text-xs opacity-70 mb-2">PR Timeline (Top Days)</div>

            {records.prTimeline.length === 0 ? (
              <div className="text-sm opacity-70">No daily data yet.</div>
            ) : (
              <div className="space-y-2">
                {records.prTimeline.map((d) => (
                  <div key={d.day} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <div className="font-medium">{d.day}</div>
                      <div className="text-xs opacity-70">
                        {pretty(d.sessions)} session{d.sessions === 1 ? "" : "s"} •{" "}
                        {formatDuration(d.duration)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{pretty(d.kills)} kills</div>
                      <div className="text-xs opacity-70">{pretty(d.pace)} /hr</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs opacity-60">
            Note: Streak = consecutive days with at least 1 session logged. Read-only.
          </div>
        </div>
      ) : (
        <LockedCard
          title="📈 Grinder Insights v3"
          bullets={[
            "Best day ever",
            "Current & longest streak",
            "Rolling 7-day pace",
            "PR timeline (top days)",
          ]}
        />
      )}
    </div>
  );
}
