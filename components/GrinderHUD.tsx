// components/GrinderHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore, type GreatOneSpecies } from "../store";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function nextMilestone(kills: number) {
  const targets = [50, 100, 250, 500, 1000, 2000, 5000, 10000];
  const k = Math.max(0, Math.floor(kills || 0));
  for (const t of targets) {
    if (k < t) return { target: t, remaining: t - k };
  }
  const next = Math.ceil(k / 5000) * 5000 + 5000;
  return { target: next, remaining: next - k };
}

function formatEtaFromHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return null;
  const totalMin = Math.max(1, Math.ceil(hours * 60));
  if (totalMin < 60) return `~${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 10 || m === 0) return `~${h} hr`;
  return `~${h} hr ${m} min`;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function intensityTier(pace: number) {
  const p = Number.isFinite(pace) ? pace : 0;
  if (p >= 70) return { name: "BEAST", value: 4 };
  if (p >= 45) return { name: "HOT", value: 3 };
  if (p >= 25) return { name: "WARM", value: 2 };
  if (p > 0) return { name: "COLD", value: 1 };
  return { name: "—", value: 0 };
}

export default function GrinderHUD() {
  const activeSession = useHunterStore((s) => s.activeSession);
  const startSession = useHunterStore((s) => s.startSession);
  const endSession = useHunterStore((s) => s.endSession);

  const grinds = useHunterStore((s) => s.grinds);

  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);
  const undo = useHunterStore((s) => s.undo);
  const canUndo = useHunterStore((s) => s.canUndo);
  const undoLastAction = useHunterStore((s) => s.undoLastAction);
  const clearUndo = useHunterStore((s) => s.clearUndo);

  const sessionSpecies: GreatOneSpecies | undefined = activeSession?.species;
  const currentGrind = useMemo(() => {
    if (sessionSpecies) return grinds.find((g) => g.species === sessionSpecies);
    return grinds[0];
  }, [grinds, sessionSpecies]);

  const killsTotal = currentGrind?.kills ?? 0;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activeSession) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeSession]);

  const elapsedMs = activeSession ? now - activeSession.startedAt : 0;
  const elapsedSeconds = elapsedMs / 1000;
  const elapsedHours = elapsedMs / 3600000;

  const killsThisSession = activeSession?.kills ?? 0;
  const pace =
    activeSession && elapsedHours > 0 ? killsThisSession / elapsedHours : 0;

  const milestone = nextMilestone(killsTotal);

  // Grinder Insights (guaranteed-visible line)
  const etaLabel = useMemo(() => {
    if (!activeSession) return null;
    if (elapsedSeconds < 15) return null;
    if (killsThisSession < 5) return null;
    if (!Number.isFinite(pace) || pace <= 0) return null;
    if (milestone.remaining <= 0) return null;

    return formatEtaFromHours(milestone.remaining / pace);
  }, [activeSession, elapsedSeconds, killsThisSession, pace, milestone.remaining]);

  const [undoMsLeft, setUndoMsLeft] = useState(0);
  useEffect(() => {
    const active = canUndo();
    if (!active || !undo?.expiresAt) {
      setUndoMsLeft(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, undo.expiresAt - Date.now());
      setUndoMsLeft(left);
      if (left <= 0) clearUndo();
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [undo?.expiresAt, undo?.armedAt, canUndo, clearUndo]);

  const showUndo = canUndo() && undoMsLeft > 0;

  // Hardcore-only micro stats (purely derived; no store changes)
  const { tierName, tierValue } = useMemo(() => {
    const t = intensityTier(pace);
    return { tierName: t.name, tierValue: t.value };
  }, [pace]);

  const killsPerMinute = useMemo(() => {
    if (!activeSession || elapsedSeconds <= 0) return 0;
    return (killsThisSession / elapsedSeconds) * 60;
  }, [activeSession, killsThisSession, elapsedSeconds]);

  const projected24h = useMemo(() => {
    if (!activeSession || !Number.isFinite(pace) || pace <= 0) return null;
    // cap display to something sane; this is just motivational
    const proj = Math.round(pace * 24);
    return proj <= 0 ? null : proj;
  }, [activeSession, pace]);

  const intensityPct = useMemo(() => {
    // map pace into 0..1 for progress bar (soft cap)
    const p = Number.isFinite(pace) ? pace : 0;
    // 0 -> 0, 60+ -> 1
    return clamp01(p / 60);
  }, [pace]);

  const milestoneProgressPct = useMemo(() => {
    const t = milestone.target;
    if (!Number.isFinite(t) || t <= 0) return 0;
    const done = Math.max(0, t - milestone.remaining);
    return clamp01(done / t);
  }, [milestone.target, milestone.remaining]);

  const hudFrame =
    hardcoreMode
      ? "rounded-2xl border border-orange-400/25 bg-gradient-to-b from-orange-500/10 via-black/40 to-black/30"
      : "rounded-2xl border border-white/10 bg-white/5";

  const titleGlow = hardcoreMode ? "text-white drop-shadow" : "text-white";

  const chipBase =
    "rounded-full border px-2 py-0.5 text-xs leading-none";
  const chipHardcore =
    "border-orange-400/30 bg-orange-500/15 text-white";
  const chipNeutral =
    "border-white/10 bg-white/5 text-white/70";

  const primaryBtn =
    hardcoreMode
      ? "rounded-xl border border-orange-400/30 bg-orange-500/15 px-3 py-2 text-sm font-semibold hover:bg-orange-500/20 active:scale-[0.99]"
      : "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10 active:scale-[0.99]";

  const ghostBtn =
    "rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 active:scale-[0.99]";

  const statCard =
    hardcoreMode
      ? "rounded-xl border border-orange-400/15 bg-black/40 p-3"
      : "rounded-xl border border-white/10 bg-black/30 p-3";

  const barOuter =
    hardcoreMode
      ? "h-2 w-full rounded-full bg-black/60 border border-orange-400/15 overflow-hidden"
      : "h-2 w-full rounded-full bg-black/50 border border-white/10 overflow-hidden";

  const barFill =
    hardcoreMode
      ? "h-full bg-orange-500/60"
      : "h-full bg-white/20";

  return (
    <div className={`${hudFrame} p-4`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`text-base font-semibold ${titleGlow}`}>
            Grinder HUD
          </div>

          {hardcoreMode && (
            <span className={`${chipBase} ${chipHardcore}`}>
              ⚔️ HARDCORE
            </span>
          )}

          {activeSession && hardcoreMode && tierValue > 0 && (
            <span className={`${chipBase} ${chipHardcore}`}>
              Intensity: {tierName}
            </span>
          )}

          {showUndo && (
            <span className={`${chipBase} ${chipNeutral}`}>
              Undo: {Math.max(1, Math.ceil(undoMsLeft / 1000))}s
            </span>
          )}
        </div>

        {/* Zero-tap flow buttons (no extra confirmations here; store handles safety) */}
        <div className="flex items-center gap-2">
          {!activeSession ? (
            <button
              className={primaryBtn}
              onClick={() => {
                // Start session for current species (or first grind)
                const species = (currentGrind?.species ?? "Whitetail Deer") as GreatOneSpecies;
                startSession(species);
              }}
            >
              Start
            </button>
          ) : (
            <>
              {showUndo && (
                <button
                  className={ghostBtn}
                  onClick={() => {
                    if (canUndo()) undoLastAction();
                  }}
                  title="Undo last change (within timer)"
                >
                  Undo
                </button>
              )}
              <button
                className={primaryBtn}
                onClick={() => {
                  endSession();
                }}
              >
                End
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tracking line */}
      <div className="mt-1 text-sm text-white/70">
        Tracking:{" "}
        <span className="text-white font-semibold">
          {currentGrind?.species ?? "—"}
        </span>
        {hardcoreMode && (
          <span className="ml-2 text-xs text-orange-200/80">
            (deep end active)
          </span>
        )}
      </div>

      {/* Hardcore intensity strip (visual only) */}
      {activeSession && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Session intensity</span>
            <span className="text-white/80">
              {Number.isFinite(pace) && pace > 0 ? `${pace.toFixed(1)} kills/hr` : "—"}
            </span>
          </div>
          <div className="mt-2">
            <div className={barOuter}>
              <div
                className={barFill}
                style={{ width: `${Math.round(intensityPct * 100)}%` }}
              />
            </div>
          </div>

          {/* Hardcore micro stats row */}
          {hardcoreMode && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={`${chipBase} ${chipHardcore}`}>
                {killsPerMinute > 0 ? `${killsPerMinute.toFixed(2)} / min` : "— / min"}
              </span>
              <span className={`${chipBase} ${chipHardcore}`}>
                {projected24h ? `24h pace: ${pretty(projected24h)}` : "24h pace: —"}
              </span>
              <span className={`${chipBase} ${chipHardcore}`}>
                Focus: {tierValue === 4 ? "LOCKED" : tierValue === 3 ? "ON" : tierValue === 2 ? "WARMING" : tierValue === 1 ? "STARTED" : "—"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Session Time" value={activeSession ? formatElapsed(elapsedMs) : "—"} cardClassName={statCard} />
        <Stat label="Kills (Session)" value={activeSession ? pretty(killsThisSession) : "—"} cardClassName={statCard} />
        <Stat label="Pace (kills/hr)" value={activeSession ? pace.toFixed(1) : "—"} cardClassName={statCard} />

        <div className={statCard}>
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">Next Milestone</div>
            {hardcoreMode && (
              <span className="text-[10px] rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-orange-100/80">
                grind target
              </span>
            )}
          </div>

          <div className="mt-1 text-lg font-semibold">{pretty(milestone.target)}</div>
          <div className="mt-1 text-xs text-white/60">
            {pretty(milestone.remaining)} to go
          </div>

          {/* Milestone progress bar (visual) */}
          <div className="mt-2">
            <div className={barOuter}>
              <div
                className={barFill}
                style={{ width: `${Math.round(milestoneProgressPct * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-2 text-xs text-white/70">
            At this pace, next milestone in{" "}
            <span className="text-white font-semibold">{etaLabel ?? "—"}</span>
          </div>

          {hardcoreMode && activeSession && (
            <div className="mt-2 text-[11px] text-orange-100/70">
              Stay sharp. Clean reps. No extra taps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  cardClassName,
}: {
  label: string;
  value: string;
  cardClassName: string;
}) {
  return (
    <div className={cardClassName}>
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
