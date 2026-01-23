// components/SessionHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { GREAT_ONE_SPECIES, useHunterStore, type GreatOneSpecies } from "../store";

/**
 * SessionHUD (STABLE)
 * - Shows Species dropdown + Start/End
 * - Shows Undo button when an undo is armed (8s window)
 * - Dispatches Session Summary event on End (for SessionSummaryModal mounted at App root)
 */

const SUMMARY_KEY = "greatonegrind_session_summary_v1";
const SUMMARY_EVENT = "greatonegrind:session_summary";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
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

export default function SessionHUD() {
  const grinds = useHunterStore((s) => s.grinds);
  const activeSession = useHunterStore((s) => s.activeSession);

  const startSession = useHunterStore((s) => s.startSession);
  const endSession = useHunterStore((s) => s.endSession);

  const canUndo = useHunterStore((s) => s.canUndo);
  const undoLastAction = useHunterStore((s) => s.undoLastAction);

  const [selectedSpecies, setSelectedSpecies] = useState<GreatOneSpecies>("Whitetail Deer");
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
    return selectedSpecies;
  }, [activeSession, selectedSpecies]);

  const elapsed = useMemo(() => {
    if (!activeSession) return "0:00";
    return formatDuration(safeNow() - (activeSession.startedAt || safeNow()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, tick]);

  const killsThisSession = activeSession?.kills ?? 0;

  function buildSummarySnapshot() {
    const grind = grinds.find((g) => g.species === species);
    const totalKillsForSpecies = grind?.kills ?? 0;
    const fur = (grind?.fur || "").trim();

    return {
      kind: "session_summary_v1",
      createdAt: safeNow(),
      species,
      durationMs: activeSession ? safeNow() - (activeSession.startedAt || safeNow()) : 0,
      killsThisSession,
      totalKillsForSpecies,
      fur,
    };
  }

  function dispatchSummary() {
    try {
      const summary = buildSummarySnapshot();
      localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
      window.dispatchEvent(new CustomEvent(SUMMARY_EVENT, { detail: summary }));
    } catch {
      // ignore
    }
  }

  function onStart() {
    if (isActive) return;
    startSession(selectedSpecies);
  }

  function onEnd() {
    if (!isActive) return;

    // fire summary BEFORE ending session
    dispatchSummary();
    endSession();
  }

  function onUndo() {
    const res = undoLastAction();
    if (!res.ok) return;
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">Species</span>
            <select
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value as GreatOneSpecies)}
              disabled={isActive}
              aria-label="Select species"
            >
              {GREAT_ONE_SPECIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {!isActive ? (
            <button
              onClick={onStart}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Start
            </button>
          ) : (
            <button
              onClick={onEnd}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              End
            </button>
          )}

          {canUndo() && (
            <button
              onClick={onUndo}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              title="Undo last change (8s window)"
            >
              Undo
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-xs opacity-70">Status</div>
            <div className="font-semibold">{isActive ? "Active" : "Idle"}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-xs opacity-70">Elapsed</div>
            <div className="font-semibold">{isActive ? elapsed : "0:00"}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-xs opacity-70">Kills (session)</div>
            <div className="font-semibold">{isActive ? killsThisSession : 0}</div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs opacity-60">
        Undo is temporary (8s) and not saved. Session Summary appears on End.
      </div>
    </div>
  );
}
