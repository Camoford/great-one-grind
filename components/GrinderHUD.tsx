// components/GrinderHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { GREAT_ONE_SPECIES, useHunterStore, type GreatOneSpecies } from "../store";

/**
 * GrinderHUD (visual + session controls)
 * - Keeps existing HUD-style layout
 * - Adds Start/End Session that ALWAYS works
 * - On End: dispatches Session Summary event + protected storage key
 * - READ-ONLY for insights (no extra persistence)
 *
 * Phase 17B (UI-only):
 * - Stronger hierarchy for pace / ETA
 * - Cleaner spacing + mobile readability
 * - Removes encoding artifacts
 */

const SUMMARY_KEY = "greatonegrind_session_summary_v1";
const SUMMARY_EVENT = "greatonegrind:session_summary";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function safeNow() {
  return Date.now();
}

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function nextMilestone(kills: number) {
  const targets = [50, 100, 250, 500, 1000, 2000, 5000, 10000];
  const k = Math.max(0, Math.floor(kills || 0));
  for (const t of targets) {
    if (k < t) return t;
  }
  return 10000;
}

export default function GrinderHUD() {
  const grinds = useHunterStore((s) => s.grinds);
  const activeSession = useHunterStore((s) => s.activeSession);
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);

  const startSession = useHunterStore((s) => s.startSession);
  const endSession = useHunterStore((s) => s.endSession);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    const t = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, [activeSession]);

  const isActive = !!activeSession;

  const species = useMemo<GreatOneSpecies>(() => {
    const s = activeSession?.species as GreatOneSpecies | undefined;
    if (s && GREAT_ONE_SPECIES.includes(s)) return s;
    // default for display if no active session
    return "Whitetail Deer";
  }, [activeSession]);

  const grind = useMemo(() => {
    return grinds.find((g) => g.species === species) || null;
  }, [grinds, species]);

  const totalKills = grind?.kills ?? 0;
  const killsSession = activeSession?.kills ?? 0;

  const elapsed = useMemo(() => {
    if (!activeSession) return "—";
    return formatElapsed(safeNow() - (activeSession.startedAt || safeNow()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, tick]);

  const target = nextMilestone(totalKills);
  const remaining = Math.max(0, target - totalKills);
  const progress = clamp01(totalKills / target);

  // basic pace (kills/hr) from session
  const pace = useMemo(() => {
    if (!activeSession) return 0;
    const ms = Math.max(1, safeNow() - (activeSession.startedAt || safeNow()));
    const hours = ms / 3_600_000;
    return hours > 0 ? killsSession / hours : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, tick, killsSession]);

  const eta = useMemo(() => {
    if (!activeSession) return "—";
    if (pace <= 0.01) return "—";
    const hrs = remaining / pace;
    if (!Number.isFinite(hrs) || hrs < 0) return "—";
    const totalMin = Math.round(hrs * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h <= 0) return `${m}m`;
    return `${h}h ${m}m`;
  }, [activeSession, pace, remaining]);

  function dispatchSummary(beforeEnding: { killsSession: number; startedAt: number; species: GreatOneSpecies }) {
    try {
      const sp = beforeEnding.species;
      const g = grinds.find((x) => x.species === sp);
      const total = g?.kills ?? 0;
      const fur = (g?.fur || "").trim();

      const summary = {
        kind: "session_summary_v1",
        createdAt: safeNow(),
        species: sp,
        durationMs: safeNow() - (beforeEnding.startedAt || safeNow()),
        killsThisSession: beforeEnding.killsSession,
        totalKillsForSpecies: total,
        fur,
      };

      localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
      window.dispatchEvent(new CustomEvent(SUMMARY_EVENT, { detail: summary }));
    } catch {
      // ignore
    }
  }

  function onStart() {
    if (isActive) return;
    // GrinderHUD start: start with current tracking species
    startSession(species);
  }

  function onEnd() {
    if (!activeSession) return;

    // Fire summary BEFORE ending
    dispatchSummary({
      killsSession: activeSession.kills ?? 0,
      startedAt: activeSession.startedAt ?? safeNow(),
      species: (activeSession.species as GreatOneSpecies) || species,
    });

    endSession();
  }

  const paceText = isActive ? pace.toFixed(1) : "—";
  const etaText = isActive ? eta : "—";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold">Grinder HUD</div>

            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
              PRO
            </span>

            {hardcoreMode ? (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-200">
                Hardcore
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 text-xs opacity-70">
            Tracking: <span className="font-semibold opacity-100">{species}</span>
          </div>
        </div>

        {!isActive ? (
          <button
            onClick={onStart}
            className="shrink-0 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold hover:bg-emerald-500/30"
          >
            Start Session
          </button>
        ) : (
          <button
            onClick={onEnd}
            className="shrink-0 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold hover:bg-red-500/30"
          >
            End Session
          </button>
        )}
      </div>

      {/* Primary emphasis row */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <BigStat
          label="Pace"
          value={paceText}
          unit="kills/hr"
          hint={isActive ? "Live" : "Start a session"}
        />
        <BigStat
          label="ETA"
          value={etaText}
          unit="to next"
          hint={isActive ? `${pretty(remaining)} remaining` : `${pretty(remaining)} to next milestone`}
        />
      </div>

      {/* Secondary row */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Session Time" value={elapsed} />
        <StatCard label="Kills (Session)" value={isActive ? pretty(killsSession) : "—"} />
        <StatCard label="Total Kills" value={pretty(totalKills)} />
        <MilestoneCard
          target={target}
          remaining={remaining}
          progress={progress}
          sub={isActive ? `Target ${pretty(target)} • Push time` : `Target ${pretty(target)} • Total progress`}
        />
      </div>

      <div className="mt-3 text-xs opacity-60">
        Session kills update when you press the + buttons. Ending a session saves it to history and shows the summary.
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold opacity-80">{label}</div>
        <div className="text-[10px] opacity-60">{unit}</div>
      </div>

      <div className="mt-1 text-2xl font-extrabold tracking-tight">{value}</div>

      {hint ? <div className="mt-1 text-[11px] opacity-70">{hint}</div> : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-[11px] opacity-70">{sub}</div> : null}
    </div>
  );
}

function MilestoneCard({
  target,
  remaining,
  progress,
  sub,
}: {
  target: number;
  remaining: number;
  progress: number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs opacity-70">Next Milestone</div>
      <div className="mt-1 text-lg font-semibold">{pretty(target)}</div>
      <div className="mt-1 text-[11px] opacity-70">{sub}</div>

      <div className="mt-2 h-2 w-full rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-white/30"
          style={{ width: `${Math.round(clamp01(progress) * 100)}%` }}
        />
      </div>

      <div className="mt-1 text-[11px] opacity-60">{pretty(remaining)} to go</div>
    </div>
  );
}
