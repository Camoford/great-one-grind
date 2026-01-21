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

export default function GrinderHUD() {
  const activeSession = useHunterStore((s) => s.activeSession);
  const startSession = useHunterStore((s) => s.startSession);
  const endSession = useHunterStore((s) => s.endSession);

  const grinds = useHunterStore((s) => s.grinds);

  // Hardcore + Undo
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);
  const undo = useHunterStore((s) => s.undo);
  const canUndo = useHunterStore((s) => s.canUndo);
  const undoLastAction = useHunterStore((s) => s.undoLastAction);
  const clearUndo = useHunterStore((s) => s.clearUndo);

  // “best guess” current species: if session has species, use it; else first grind
  const sessionSpecies: GreatOneSpecies | undefined = activeSession?.species;
  const currentGrind = useMemo(() => {
    if (sessionSpecies) return grinds.find((g) => g.species === sessionSpecies);
    return grinds[0];
  }, [grinds, sessionSpecies]);

  const killsTotal = currentGrind?.kills ?? 0;

  // ticking clock for elapsed time
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activeSession) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeSession]);

  const elapsedMs = activeSession ? now - activeSession.startedAt : 0;
  const elapsedHours = activeSession ? elapsedMs / 3600000 : 0;

  const killsThisSession = activeSession?.kills ?? 0;
  const pace = activeSession && elapsedHours > 0 ? killsThisSession / elapsedHours : 0;

  const milestone = nextMilestone(killsTotal);

  // Small undo timer label in HUD (no heavy UI)
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

  const handleUndo = () => {
    const res = undoLastAction();
    if (!res.ok) return;
  };

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
            {currentGrind ? (
              <>
                Tracking: <span className="text-white font-semibold">{currentGrind.species}</span>
              </>
            ) : (
              <>
                Tracking: <span className="text-white font-semibold">—</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {showUndo && (
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              title={undo?.label || "Undo"}
            >
              Undo
            </button>
          )}

          {!activeSession ? (
            <button
              type="button"
              onClick={() => startSession(currentGrind?.species)}
              className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm hover:bg-emerald-500/20"
            >
              Start Session
            </button>
          ) : (
            <button
              type="button"
              onClick={() => endSession()}
              className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm hover:bg-red-500/20"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Session Time</div>
          <div className="mt-1 text-lg font-semibold">
            {activeSession ? formatElapsed(elapsedMs) : "—"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Kills (Session)</div>
          <div className="mt-1 text-lg font-semibold">
            {activeSession ? pretty(killsThisSession) : "—"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Pace (kills/hr)</div>
          <div className="mt-1 text-lg font-semibold">{activeSession ? pace.toFixed(1) : "—"}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Next Milestone</div>
          <div className="mt-1 text-lg font-semibold">{pretty(milestone.target)}</div>
          <div className="mt-1 text-xs text-white/60">{pretty(milestone.remaining)} to go (total kills)</div>
        </div>
      </div>

      <div className="mt-3 text-xs text-white/60">
        Session kills update when you press the + buttons. Ending a session saves it to history.
      </div>
    </div>
  );
}
