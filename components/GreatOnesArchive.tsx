// components/GreatOnesArchive.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";
import { readSessionHistory } from "../utils/sessionHistory";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDateTime(ts: number) {
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    const min = pad2(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${h}:${min} ${ampm}`;
  } catch {
    return "—";
  }
}

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function safeNumber(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function calcKph(kills: number, durationMs: number) {
  const hours = durationMs > 0 ? durationMs / 3600000 : 0;
  if (hours <= 0) return 0;
  return kills / hours;
}

type Trend = "up" | "down" | "flat";

function trendFromDiff(diff: number, deadband: number) {
  if (Math.abs(diff) < deadband) return "flat" as Trend;
  return diff > 0 ? ("up" as Trend) : ("down" as Trend);
}

function pillForTrend(t: Trend) {
  if (t === "up") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
  if (t === "down") return "border-rose-400/25 bg-rose-500/10 text-rose-100";
  return "border-white/10 bg-white/5 text-white/70";
}

function labelForTrend(t: Trend) {
  if (t === "up") return "↑";
  if (t === "down") return "↓";
  return "•";
}

type SortKey = "newest" | "oldest" | "bestPace" | "mostKills";

function normalize(s: string) {
  return (s || "").toLowerCase().trim();
}

export default function GreatOnesArchive() {
  // PRO gating (defensive read; test key name can vary)
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;
  const proEnabled = isPro || isProTest;

  // UI-only controls
  const [query, setQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [showProChips, setShowProChips] = useState<boolean>(true);

  const rawSessions = useMemo(() => {
    try {
      const data = readSessionHistory();
      if (!Array.isArray(data)) return [];
      return data.slice();
    } catch {
      return [];
    }
  }, []);

  const allSpecies = useMemo(() => {
    const set = new Set<string>();
    rawSessions.forEach((s: any) => {
      const sp = String(s?.species ?? s?.grindSpecies ?? s?.targetSpecies ?? "").trim();
      if (sp) set.add(sp);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rawSessions]);

  const sessions = useMemo(() => {
    const q = normalize(query);

    // 1) map to normalized rows with derived fields (UI-only)
    const mapped = rawSessions.map((s: any) => {
      const kills = safeNumber(s.kills ?? s.sessionKills ?? s.killsThisSession ?? 0);
      const startedAt = safeNumber(s.startedAt ?? s.start ?? s.startTs ?? 0);
      const endedAt = safeNumber(s.endedAt ?? s.end ?? s.endTs ?? 0);
      const durationMs = Math.max(0, endedAt - startedAt);
      const kph = calcKph(kills, durationMs);

      const species = String(s?.species ?? s?.grindSpecies ?? s?.targetSpecies ?? "—");

      return {
        raw: s,
        species,
        kills,
        startedAt,
        endedAt,
        durationMs,
        kph,
      };
    });

    // 2) filter by species
    let filtered = mapped;
    if (speciesFilter !== "All") {
      filtered = filtered.filter((r) => r.species === speciesFilter);
    }

    // 3) search query
    if (q) {
      filtered = filtered.filter((r) => {
        const hay = normalize(`${r.species} ${formatDateTime(r.endedAt || r.startedAt)}`);
        return hay.includes(q);
      });
    }

    // 4) sort
    const sorted = filtered.slice().sort((a, b) => {
      if (sortKey === "oldest") return a.endedAt - b.endedAt;
      if (sortKey === "bestPace") return b.kph - a.kph;
      if (sortKey === "mostKills") return b.kills - a.kills;
      // default newest
      return b.endedAt - a.endedAt;
    });

    return sorted;
  }, [rawSessions, query, speciesFilter, sortKey]);

  const summary = useMemo(() => {
    if (!sessions.length) {
      return {
        totalSessions: 0,
        totalKills: 0,
        totalMs: 0,
        bestPaceKph: 0,
        bestKills: 0,
        bestPaceIdx: -1,
        bestKillsIdx: -1,
      };
    }

    let totalKills = 0;
    let totalMs = 0;

    let bestPaceKph = 0;
    let bestKills = 0;

    let bestPaceIdx = -1;
    let bestKillsIdx = -1;

    sessions.forEach((r, idx) => {
      totalKills += r.kills;
      totalMs += r.durationMs;

      if (r.kph > bestPaceKph) {
        bestPaceKph = r.kph;
        bestPaceIdx = idx;
      }
      if (r.kills > bestKills) {
        bestKills = r.kills;
        bestKillsIdx = idx;
      }
    });

    return {
      totalSessions: sessions.length,
      totalKills,
      totalMs,
      bestPaceKph,
      bestKills,
      bestPaceIdx,
      bestKillsIdx,
    };
  }, [sessions]);

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Session History</h2>

            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
              Great Ones Archive
            </span>

            {proEnabled ? (
              <span
                className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100"
                title="PRO features enabled (UI-only)"
              >
                PRO {isProTest ? "TEST" : ""}
              </span>
            ) : null}
          </div>

          <p className="text-slate-400 text-sm mt-1">
            Read-only history of ended sessions. Filters below are UI-only and do not change your data.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[11px] text-white/50">Showing</div>
            <div className="text-sm font-semibold tabular-nums">{pretty(summary.totalSessions)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[11px] text-white/50">Kills</div>
            <div className="text-sm font-semibold tabular-nums">{pretty(summary.totalKills)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[11px] text-white/50">Time</div>
            <div className="text-sm font-semibold tabular-nums">{formatDuration(summary.totalMs)}</div>
          </div>
        </div>
      </div>

      {/* Filters / Search (UI-only) */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-xs text-white/60">Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search (species/date)…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
            />
          </div>

          <div>
            <div className="text-xs text-white/60">Species</div>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
            >
              {allSpecies.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-white/60">Sort</div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="bestPace">Best pace</option>
              <option value="mostKills">Most kills</option>
            </select>
          </div>
        </div>

        {/* PRO-only toggle to reduce clutter */}
        {proEnabled ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-white/50">
              PRO chips are UI-only. Turn them off if you want a cleaner archive.
            </div>

            <button
              type="button"
              onClick={() => setShowProChips((v) => !v)}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm hover:bg-black/30"
              title="Toggle PRO trend chips"
            >
              {showProChips ? "Hide PRO chips" : "Show PRO chips"}
            </button>
          </div>
        ) : null}
      </div>

      {/* PRO quick highlights */}
      {proEnabled ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-white/80">PRO Highlights</div>
            <div className="text-[11px] text-white/50">derived • UI-only</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-white/60">Best pace</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {summary.bestPaceKph > 0 ? pretty(Math.round(summary.bestPaceKph)) : "—"}
              </div>
              <div className="mt-1 text-[11px] text-white/50">kills/hr</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-white/60">Most kills</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {summary.bestKills > 0 ? pretty(summary.bestKills) : "—"}
              </div>
              <div className="mt-1 text-[11px] text-white/50">single session</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-white/60">Average pace</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {summary.totalMs > 0 ? pretty(Math.round(calcKph(summary.totalKills, summary.totalMs))) : "—"}
              </div>
              <div className="mt-1 text-[11px] text-white/50">kills/hr</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-white/60">Filters</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {speciesFilter === "All" ? "All" : "1"}
              </div>
              <div className="mt-1 text-[11px] text-white/50">active</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        {!sessions.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">No sessions found</div>
            <div className="mt-1 text-sm text-white/60">
              Start a session in Grinder HUD, then end it — it will appear here.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((r, idx) => {
              const s: any = r.raw;

              const species = r.species || "—";
              const kills = r.kills;
              const durationMs = r.durationMs;
              const kph = r.kph;

              // For trend comparisons we use the list order on screen (post-sort).
              // Only compute trends for "newest/oldest" sorts where "previous session" makes sense.
              const canTrend = sortKey === "newest" || sortKey === "oldest";
              const prev = canTrend ? sessions[idx + 1] : null;

              const prevKills = prev ? prev.kills : 0;
              const prevKph = prev ? prev.kph : 0;
              const prevDurMs = prev ? prev.durationMs : 0;

              const killsTrend = prev ? trendFromDiff(kills - prevKills, 1) : ("flat" as Trend);
              const paceTrend = prev ? trendFromDiff(kph - prevKph, 5) : ("flat" as Trend);
              const durTrend = prev ? trendFromDiff(durationMs - prevDurMs, 60_000) : ("flat" as Trend);

              const isBestPace = proEnabled && idx === summary.bestPaceIdx && summary.bestPaceKph > 0;
              const isBestKills = proEnabled && idx === summary.bestKillsIdx && summary.bestKills > 0;

              const coachingChip = (() => {
                if (!proEnabled || !prev || !canTrend) return null;
                if (paceTrend === "up" && killsTrend !== "down") return "Improving";
                if (paceTrend === "down" && killsTrend !== "up") return "Slowing";
                return "Steady";
              })();

              return (
                <div key={`sess_${idx}_${r.endedAt}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold">{species !== "—" ? species : "Session"}</div>

                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70 tabular-nums">
                          {formatDateTime(r.endedAt || r.startedAt)}
                        </span>

                        {proEnabled && coachingChip && showProChips && canTrend ? (
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] text-white/70">
                            {coachingChip}
                          </span>
                        ) : null}

                        {proEnabled && isBestPace ? (
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-100">
                            Best Pace
                          </span>
                        ) : null}

                        {proEnabled && isBestKills ? (
                          <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">
                            Most Kills
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-xs text-white/60">
                        Duration: <span className="text-white/80 tabular-nums">{formatDuration(durationMs)}</span>
                        {"  "}•{"  "}
                        Pace:{" "}
                        <span className="text-white/80 tabular-nums">
                          {kph > 0 ? `${pretty(Math.round(kph))}/hr` : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <div className="text-[11px] text-white/50">Kills</div>
                        <div className="text-sm font-semibold tabular-nums">{pretty(kills)}</div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <div className="text-[11px] text-white/50">Pace</div>
                        <div className="text-sm font-semibold tabular-nums">{kph > 0 ? pretty(Math.round(kph)) : "—"}</div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <div className="text-[11px] text-white/50">Time</div>
                        <div className="text-sm font-semibold tabular-nums">{formatDuration(durationMs)}</div>
                      </div>
                    </div>
                  </div>

                  {/* PRO: trend pills (only when "previous session" is meaningful) */}
                  {proEnabled && showProChips && canTrend ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillForTrend(killsTrend)}`}>
                        {labelForTrend(killsTrend)} kills vs prev
                      </span>

                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillForTrend(paceTrend)}`}>
                        {labelForTrend(paceTrend)} pace vs prev
                      </span>

                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${pillForTrend(durTrend)}`}>
                        {labelForTrend(durTrend)} time vs prev
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                        UI-only
                      </span>
                    </div>
                  ) : null}

                  {proEnabled && showProChips && !canTrend ? (
                    <div className="mt-3 text-[11px] text-white/50">
                      Trend pills are only shown for Newest/Oldest sorts (so “prev session” stays meaningful).
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 text-[11px] text-white/50">
        Notes: Filters/search/sort are UI-only. When sorting by “Best pace” or “Most kills”, trend pills are hidden to
        avoid misleading “previous session” comparisons.
      </div>
    </div>
  );
}
