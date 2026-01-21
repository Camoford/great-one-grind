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
  const elapsedHours = activeSession ? elapsedMs / 3600000 : 0;
  const elapsedSeconds = activeSession ? elapsedMs / 1000 : 0;

  const killsThisSession = activeSession?.kills ?? 0;
  const pace =
    activeSession && elapsedHours > 0 ? killsThisSession / elapsedHours : 0;

  const milestone = nextMilestone(killsTotal);

  // ---------- Grinder Insights (stable ETA) ----------
  const etaLabel = useMemo(() => {
    if (!activeSession) return null;
    if (elapsedSeconds < 60) return null;
    if (killsThisSession < 10) return null;
    if (!Number.isFinite(pace) || pace <= 0) return null;
    if (milestone.remaining <= 0) return null;

    const hoursToMilestone = milestone.remaining / pace;
    return formatEtaFromHours(hoursToMilestone);
  }, [
    activeSession,
    elapsedSeconds,
    killsThisSession,
    pace,
    milestone.remaining,
  ]);

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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold">Grinder HUD</div>

            {hardcoreMode && (
              <span className="rounded-full border border-orange-400/30 bg-orange-500/15 px-2 py-0.5 text-xs">
                🔥 HARDCORE
              </span>
            )}

            {showUndo && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                Undo: {Math.max(1, Math.ceil(undoMsLeft / 1000))}s
              </span>
            )}
          </div>

          <div className="text-sm text-white/70">
            Tracking:{" "}
            <span className="text-white font-semibold">
              {currentGrind?.species ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Session Time" value={activeSession ? formatElapsed(elapsedMs) : "—"} />
        <Stat label="Kills (Session)" value={activeSession ? pretty(killsThisSession) : "—"} />
        <Stat label="Pace (kills/hr)" value={activeSession ? pace.toFixed(1) : "—"} />

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Next Milestone</div>
          <div className="mt-1 text-lg font-semibold">{pretty(milestone.target)}</div>
          <div className="mt-1 text-xs text-white/60">
            {pretty(milestone.remaining)} to go
          </div>
          <div className="mt-1 text-xs text-white/70">
            At this pace, next milestone in{" "}
            <span className="text-white font-semibold">
              {etaLabel ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
