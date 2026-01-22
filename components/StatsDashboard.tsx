import React, { useMemo } from "react";
import { useHunterStore } from "../store";
import { readSessionHistory } from "../src/utils/sessionHistory";

/* ---------------- helpers ---------------- */

function pretty(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
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

type SessionLike = {
  totalKills?: number;
  durationMs?: number;
  speciesBreakdown?: { species: string; kills: number }[];
};

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
      const kills = s.totalKills || 0;
      const ms = s.durationMs || 0;
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
          const species = String(b.species || "");
          if (!species) continue;

          const entry = bySpecies.get(species) || {};

          if (!entry.bestKills || (b.kills || 0) > entry.bestKills.kills) {
            entry.bestKills = { kills: b.kills || 0 };
          }

          const sp = pace(b.kills || 0, ms);
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

    return {
      bestKillsSession,
      longestSession,
      bestPaceSession,
      speciesRows,
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
    </div>
  );
}
