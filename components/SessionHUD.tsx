// components/SessionHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * Session HUD (Option A)
 * - Start/End session
 * - Live session timer
 * - Live session kills
 * - Active species indicator (best-effort, defensive)
 *
 * NOTE:
 * This is written defensively because store field names may differ slightly.
 * It will still compile and run without breaking your stable dev build.
 */

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

export default function SessionHUD() {
  // --- Read store defensively (avoid type coupling) ---
  const activeSession = useHunterStore((s: any) => s.activeSession ?? s.sessionActive ?? null);

  const sessionHistory = useHunterStore((s: any) => s.sessionHistory ?? s.sessions ?? []);
  const grinds = useHunterStore((s: any) => s.grinds ?? s.species ?? []);

  const startSession = useHunterStore((s: any) => s.startSession ?? s.beginSession ?? null);
  const endSession = useHunterStore((s: any) => s.endSession ?? s.finishSession ?? null);

  // Fallback: some builds may store a setter for active species
  const setActiveGrindId = useHunterStore((s: any) => s.setActiveGrindId ?? s.setActiveSpeciesId ?? null);

  // --- Derived session start time ---
  const sessionStartMs: number | null = useMemo(() => {
    if (!activeSession) return null;

    // Common patterns:
    // { startedAt: number } OR { startTime: number } OR { startAt: number } OR ISO string
    const raw =
      activeSession.startedAt ??
      activeSession.startTime ??
      activeSession.startAt ??
      activeSession.started ??
      activeSession.start ??
      null;

    if (!raw) return Date.now(); // if session exists but no timestamp, just treat as "now"
    if (typeof raw === "number") return raw;
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }, [activeSession]);

  // --- Live clock tick ---
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // --- Determine "active species" (best-effort) ---
  const activeGrindId =
    (activeSession && (activeSession.grindId ?? activeSession.speciesId ?? activeSession.activeId)) || null;

  const activeEntry =
    activeGrindId && Array.isArray(grinds)
      ? grinds.find((g: any) => g?.id === activeGrindId)
      : null;

  const activeSpeciesLabel: string = useMemo(() => {
    // If grind entry has species/name fields
    const labelFromEntry = activeEntry?.species ?? activeEntry?.name ?? activeEntry?.title ?? null;
    if (typeof labelFromEntry === "string" && labelFromEntry.trim()) return labelFromEntry;

    // Some stores keep activeSession.species as a string
    const labelFromSession = activeSession?.species ?? activeSession?.speciesName ?? null;
    if (typeof labelFromSession === "string" && labelFromSession.trim()) return labelFromSession;

    return "No species selected";
  }, [activeEntry, activeSession]);

  // --- Live session kills (best-effort) ---
  const sessionKills: number = useMemo(() => {
    if (!activeSession) return 0;

    // Common patterns:
    // activeSession.kills OR activeSession.sessionKills
    const direct = activeSession.kills ?? activeSession.sessionKills ?? null;
    if (typeof direct === "number") return direct;

    // If session stores starting kills and we can read current grind kills
    const startKills = activeSession.startKills ?? activeSession.killsAtStart ?? activeSession.startCount ?? null;
    const currentKills = activeEntry?.kills ?? null;

    if (typeof startKills === "number" && typeof currentKills === "number") {
      return Math.max(0, currentKills - startKills);
    }

    return 0;
  }, [activeSession, activeEntry]);

  // --- UI handlers ---
  const onStart = () => {
    if (typeof startSession === "function") {
      // If store accepts an activeGrindId, pass it; else just call.
      try {
        if (activeGrindId) startSession(activeGrindId);
        else startSession();
      } catch {
        // If signature differs, fallback
        try {
          startSession();
        } catch {
          // no-op
        }
      }
      return;
    }

    alert(
      "Start Session is not wired in the store yet.\n\nYour dev build says session persistence exists, so the action name may differ.\nTell ChatGPT the store action names if you see this."
    );
  };

  const onEnd = () => {
    if (typeof endSession === "function") {
      try {
        endSession();
      } catch {
        // no-op
      }
      return;
    }

    alert(
      "End Session is not wired in the store yet.\n\nYour dev build says session persistence exists, so the action name may differ.\nTell ChatGPT the store action names if you see this."
    );
  };

  const onPickSpecies = () => {
    // Optional helper: set active grind/species if your store supports it.
    if (typeof setActiveGrindId !== "function") return;

    // Try to pick the first pinned/default entry if available
    const first = Array.isArray(grinds) ? grinds[0] : null;
    if (first?.id) {
      try {
        setActiveGrindId(first.id);
      } catch {
        // no-op
      }
    }
  };

  const isActive = !!activeSession;

  const elapsed = sessionStartMs ? formatDuration(now - sessionStartMs) : "0:00";

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-3xl px-2 pt-2">
        <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur px-3 py-2 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-white/60">Session</div>
              <div className="truncate text-sm font-semibold">
                {activeSpeciesLabel}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-white/60">Time</div>
                <div className="text-sm font-semibold tabular-nums">{elapsed}</div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/60">Kills</div>
                <div className="text-sm font-semibold tabular-nums">{sessionKills}</div>
              </div>

              {!isActive ? (
                <button
                  onClick={onStart}
                  className="rounded-xl bg-white text-black px-3 py-2 text-sm font-semibold hover:opacity-90 active:opacity-80"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={onEnd}
                  className="rounded-xl border border-white/15 bg-white/10 text-white px-3 py-2 text-sm font-semibold hover:bg-white/15 active:opacity-90"
                >
                  End
                </button>
              )}
            </div>
          </div>

          {/* Optional helper row */}
          {!activeGrindId && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-xs text-white/50">
                Tip: Select a grind/species for accurate session stats.
              </div>
              {typeof setActiveGrindId === "function" && (
                <button
                  onClick={onPickSpecies}
                  className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold hover:bg-white/10"
                >
                  Auto-pick
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
