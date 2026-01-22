// components/SessionHistoryScreen.tsx
import React, { useMemo } from "react";
import { getSessionHistory } from "../utils/sessionHistory";
import { useHunterStore } from "../store";

/**
 * Session History — read-only UI
 * Phase 2 (Hardcore) — VISUAL ONLY:
 * - Hardcore identity + subtle elite accents
 * - Pace tier badge per session (derived from kills + duration only)
 * - No new fields, no store changes, no persistence changes
 */

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function pretty(n: number) {
  return new Intl.NumberFormat().format(Math.max(0, Math.floor(n || 0)));
}

function paceTier(pacePerHour: number) {
  const p = Number.isFinite(pacePerHour) ? pacePerHour : 0;
  if (p >= 70) return { name: "BEAST", value: 4 };
  if (p >= 45) return { name: "HOT", value: 3 };
  if (p >= 25) return { name: "WARM", value: 2 };
  if (p > 0) return { name: "COLD", value: 1 };
  return { name: "—", value: 0 };
}

function formatMinutes(ms: number) {
  const mins = Math.max(0, Math.round((ms || 0) / 60000));
  return mins;
}

function safeDateLabel(startedAt: any) {
  const t = typeof startedAt === "number" ? startedAt : 0;
  if (!t) return "Session";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return "Session";
  }
}

export default function SessionHistoryScreen() {
  const hardcoreMode = useHunterStore((s: any) => s.hardcoreMode ?? false);

  const sessions = useMemo(() => {
    try {
      return getSessionHistory();
    } catch {
      return [];
    }
  }, []);

  const list = useMemo(() => sessions.slice().reverse(), [sessions]);

  const totalSessions = list.length;

  const summary = useMemo(() => {
    if (!totalSessions) return null;

    let totalKills = 0;
    let totalMs = 0;

    for (const s of list) {
      const kills = (s?.kills ?? s?.sessionKills ?? 0) as number;
      const ms = (s?.durationMs ?? 0) as number;
      totalKills += Math.max(0, kills || 0);
      totalMs += Math.max(0, ms || 0);
    }

    const hours = totalMs / 3600000;
    const pace = hours > 0 ? totalKills / hours : 0;

    return {
      totalKills,
      totalMins: Math.max(0, Math.round(totalMs / 60000)),
      avgPace: pace,
      tier: paceTier(pace),
    };
  }, [list, totalSessions]);

  const frame = hardcoreMode
    ? "rounded-2xl border border-orange-400/15 bg-gradient-to-b from-orange-500/10 via-black/55 to-black/40"
    : "rounded-2xl border border-slate-800 bg-slate-950";

  const card = hardcoreMode
    ? "rounded-2xl border border-orange-400/10 bg-slate-950"
    : "rounded-xl border border-slate-800 bg-slate-950";

  const chip = hardcoreMode
    ? "rounded-full border border-orange-400/25 bg-orange-500/12 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-widest"
    : "rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-200 uppercase tracking-widest";

  if (!totalSessions) {
    return (
      <div className="mx-auto max-w-2xl px-2 py-6">
        <div className={frame + " p-4 text-center"}>
          <div className="flex items-center justify-center gap-2">
            <div className="text-base font-semibold">Session History</div>
            {hardcoreMode && <span className={chip}>⚔️ HARDCORE</span>}
          </div>

          <div className="mt-2 text-sm text-slate-400">No sessions recorded yet.</div>
          <div className="mt-1 text-xs text-slate-500">
            Start a session, log kills, then end the session.
          </div>

          {hardcoreMode && (
            <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-orange-100/60">
              Deep end progression begins after your first end-session.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-2 py-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Session History</h2>
          {hardcoreMode ? (
            <span className={chip}>⚔️ HARDCORE • deep end</span>
          ) : (
            <span className={chip}>read-only</span>
          )}
        </div>
        <div className="text-xs text-slate-400">{totalSessions} sessions</div>
      </div>

      {/* Hardcore summary strip (derived only) */}
      {summary && (
        <div className={"mt-3 " + frame + " p-3"}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">Totals</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {pretty(summary.totalKills)} kills
                </span>
                <span className="text-xs text-white/50">•</span>
                <span className="text-sm font-semibold text-white">
                  {pretty(summary.totalMins)} min
                </span>
                <span className="text-xs text-white/50">•</span>
                <span className="text-sm font-semibold text-white">
                  {Number.isFinite(summary.avgPace) ? summary.avgPace.toFixed(1) : "0.0"} /hr
                </span>

                {hardcoreMode && (
                  <>
                    <span className="text-xs text-white/50">•</span>
                    <span className={chip}>Tier: {summary.tier.name}</span>
                  </>
                )}
              </div>

              {hardcoreMode && (
                <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-orange-100/60">
                  Stack sessions. Build identity. Protect your pace.
                </div>
              )}
            </div>

            {hardcoreMode && (
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Intensity</div>
                <div className="mt-1 h-2 w-28 rounded-full overflow-hidden border border-orange-400/10 bg-black/50">
                  <div
                    className="h-full bg-orange-500/60"
                    style={{ width: `${Math.round(clamp01(summary.avgPace / 80) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-3 space-y-2">
        {list.map((s: any, idx: number) => {
          const startedAt = typeof s?.startedAt === "number" ? s.startedAt : 0;
          const mins = formatMinutes(s?.durationMs || 0);
          const kills = (s?.kills ?? s?.sessionKills ?? 0) as number;

          const hours = (s?.durationMs || 0) / 3600000;
          const pace = hours > 0 ? kills / hours : 0;
          const tier = paceTier(pace);

          const sessionNumber = totalSessions - idx;

          return (
            <div key={idx} className={card + " p-3"}>
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {safeDateLabel(startedAt)}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-300">
                      {pretty(mins)} min • {pretty(kills)} kills
                    </span>

                    <span className="text-white/25">•</span>

                    <span className="text-slate-400 tabular-nums">
                      {Number.isFinite(pace) ? pace.toFixed(1) : "0.0"} /hr
                    </span>

                    {hardcoreMode && tier.value > 0 && (
                      <span className={chip}>Tier: {tier.name}</span>
                    )}
                  </div>

                  {hardcoreMode && (
                    <div className="mt-2 h-2 w-full rounded-full overflow-hidden border border-orange-400/10 bg-black/50">
                      <div
                        className="h-full bg-orange-500/55"
                        style={{ width: `${Math.round(clamp01(pace / 80) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500">#{sessionNumber}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
