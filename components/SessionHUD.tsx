import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHunterStore } from "../store";

/**
 * SessionHUD — stable + defensive
 * GUARANTEE: On End, we emit a session summary snapshot:
 *  - Save to localStorage (protected key)
 *  - Dispatch window event for SessionSummaryModal to open
 *
 * This is READ-ONLY with respect to the summary:
 * It does NOT modify kills, trophies, or grinds beyond calling store start/end.
 */

const SUMMARY_KEY = "greatonegrind_session_summary_protected_v1";
const SUMMARY_EVENT = "greatonegrind:sessionSummary";

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
  try {
    return Date.now();
  } catch {
    return 0;
  }
}

function safeJsonSet(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function SessionHUD() {
  // Store hooks (defensive: tolerate signature drift by reading values + calling functions without args)
  const sessionActive = useHunterStore((s: any) => s.sessionActive);
  const sessionStartedAt = useHunterStore((s: any) => s.sessionStartedAt);
  const sessionKills = useHunterStore((s: any) => s.sessionKills);
  const activeSpecies = useHunterStore((s: any) => s.activeSpecies);
  const grinds = useHunterStore((s: any) => s.grinds);

  const startSession = useHunterStore((s: any) => s.startSession);
  const endSession = useHunterStore((s: any) => s.endSession);

  // Local timer
  const [now, setNow] = useState<number>(safeNow());
  const tickRef = useRef<number | null>(null);

  const startedAtNum = Number(sessionStartedAt) || 0;
  const elapsedMs = sessionActive ? Math.max(0, now - startedAtNum) : 0;

  const killsThisSession = Number(sessionKills) || 0;

  // Best-effort derived pace (kills/hr)
  const pacePerHour = useMemo(() => {
    if (!sessionActive) return null;
    const minutes = elapsedMs / 60000;
    if (minutes <= 0.25) return null; // gate first 15 seconds
    const hours = elapsedMs / 3600000;
    if (hours <= 0) return null;
    return Math.round(killsThisSession / hours);
  }, [sessionActive, elapsedMs, killsThisSession]);

  // Species label fallback
  const speciesLabel = useMemo(() => {
    if (typeof activeSpecies === "string" && activeSpecies.trim()) return activeSpecies;
    // fallback: try first pinned grind species if present
    try {
      const first = Array.isArray(grinds) ? grinds[0] : null;
      return first?.species || "Session";
    } catch {
      return "Session";
    }
  }, [activeSpecies, grinds]);

  useEffect(() => {
    if (sessionActive) {
      // start ticking
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => setNow(safeNow()), 500);
      return () => {
        if (tickRef.current) window.clearInterval(tickRef.current);
        tickRef.current = null;
      };
    } else {
      // stop ticking
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [sessionActive]);

  function onStart() {
    try {
      // call with no args to avoid signature mismatch issues
      startSession?.();
      setNow(safeNow());
    } catch {
      // ignore
    }
  }

  function onEnd() {
    const endedAt = safeNow();
    const startedAt = startedAtNum || endedAt;
    const durationMs = Math.max(0, endedAt - startedAt);

    // Create snapshot BEFORE ending session (so values still present)
    const summary = {
      species: speciesLabel,
      startedAt,
      endedAt,
      durationMs,
      kills: killsThisSession,
      pacePerHour: pacePerHour ?? null,
      version: 1,
      createdAt: endedAt,
    };

    // Persist + dispatch (read-only)
    safeJsonSet(SUMMARY_KEY, summary);
    try {
      window.dispatchEvent(new CustomEvent(SUMMARY_EVENT, { detail: summary }));
    } catch {
      // ignore
    }

    // End session in store (no args)
    try {
      endSession?.();
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-white/60">Session</div>
          <div className="text-base font-semibold">{speciesLabel}</div>
        </div>

        <div className="flex items-center gap-2">
          {!sessionActive ? (
            <button
              onClick={onStart}
              className="rounded-xl bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-300"
            >
              Start
            </button>
          ) : (
            <button
              onClick={onEnd}
              className="rounded-xl bg-red-400 px-3 py-1.5 text-sm font-semibold text-black hover:bg-red-300"
            >
              End
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="text-[11px] text-white/60">Time</div>
          <div className="text-sm font-semibold">
            {sessionActive ? formatElapsed(elapsedMs) : "0:00"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="text-[11px] text-white/60">Kills</div>
          <div className="text-sm font-semibold">{killsThisSession}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className="text-[11px] text-white/60">Pace</div>
          <div className="text-sm font-semibold">
            {pacePerHour === null ? "—" : `${pacePerHour}/hr`}
          </div>
        </div>
      </div>
    </div>
  );
}
