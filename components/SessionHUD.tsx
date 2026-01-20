// components/SessionHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * Session HUD (Option A) — Auto-detect wiring
 * - Start / End Session
 * - Live timer
 * - Session kills (best-effort)
 * - Active species indicator (best-effort)
 *
 * This version DOES NOT assume action names.
 * It searches Zustand store keys for likely start/end session functions.
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

function isFn(v: any) {
  return typeof v === "function";
}

function safeGetState(): any {
  try {
    return (useHunterStore as any).getState?.() ?? null;
  } catch {
    return null;
  }
}

function findFirstFnKey(state: any, candidates: string[]) {
  if (!state) return null;
  for (const k of candidates) {
    if (isFn(state[k])) return k;
  }
  return null;
}

/**
 * Heuristic: find a function key that looks like "start session" / "end session"
 * - Prefer keys containing both words (start + session)
 * - Otherwise allow "begin"/"finish"/"stop" + "session"
 * - Avoid unrelated keys like "startBackup" etc by requiring "session"
 */
function findHeuristicSessionFnKey(state: any, type: "start" | "end") {
  if (!state) return null;
  const keys = Object.keys(state);

  const wantWords =
    type === "start"
      ? ["start", "begin", "resume", "open"]
      : ["end", "finish", "stop", "close"];

  // 1) Best: contains session + any start/end synonym
  const best = keys.find((k) => {
    const lk = k.toLowerCase();
    if (!lk.includes("session")) return false;
    if (!wantWords.some((w) => lk.includes(w))) return false;
    return isFn(state[k]);
  });
  if (best) return best;

  // 2) Fallback: exact common names (some apps use "start" / "end" only)
  const fallback = keys.find((k) => {
    const lk = k.toLowerCase();
    if (!wantWords.some((w) => lk === w)) return false;
    return isFn(state[k]);
  });
  if (fallback) return fallback;

  return null;
}

export default function SessionHUD() {
  // Re-render when session state changes (we keep selectors defensive)
  const activeSession = useHunterStore((s: any) => s.activeSession ?? s.sessionActive ?? s.session ?? null);
  const grinds = useHunterStore((s: any) => s.grinds ?? s.species ?? []);
  const activeGrindId =
    (activeSession && (activeSession.grindId ?? activeSession.speciesId ?? activeSession.activeId)) || null;

  const activeEntry =
    activeGrindId && Array.isArray(grinds)
      ? grinds.find((g: any) => g?.id === activeGrindId)
      : null;

  const activeSpeciesLabel: string = useMemo(() => {
    const labelFromEntry = activeEntry?.species ?? activeEntry?.name ?? activeEntry?.title ?? null;
    if (typeof labelFromEntry === "string" && labelFromEntry.trim()) return labelFromEntry;

    const labelFromSession = activeSession?.species ?? activeSession?.speciesName ?? null;
    if (typeof labelFromSession === "string" && labelFromSession.trim()) return labelFromSession;

    return "No species selected";
  }, [activeEntry, activeSession]);

  const sessionStartMs: number | null = useMemo(() => {
    if (!activeSession) return null;
    const raw =
      activeSession.startedAt ??
      activeSession.startTime ??
      activeSession.startAt ??
      activeSession.started ??
      activeSession.start ??
      null;

    if (!raw) return Date.now();
    if (typeof raw === "number") return raw;
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }, [activeSession]);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sessionKills: number = useMemo(() => {
    if (!activeSession) return 0;

    const direct = activeSession.kills ?? activeSession.sessionKills ?? null;
    if (typeof direct === "number") return direct;

    const startKills = activeSession.startKills ?? activeSession.killsAtStart ?? activeSession.startCount ?? null;
    const currentKills = activeEntry?.kills ?? null;

    if (typeof startKills === "number" && typeof currentKills === "number") {
      return Math.max(0, currentKills - startKills);
    }

    return 0;
  }, [activeSession, activeEntry]);

  const isActive = !!activeSession;
  const elapsed = sessionStartMs ? formatDuration(now - sessionStartMs) : "0:00";

  // ---- Auto-detect action keys ----
  const state = safeGetState();

  const startKey =
    findFirstFnKey(state, ["startSession", "beginSession", "startNewSession", "sessionStart"]) ||
    findHeuristicSessionFnKey(state, "start");

  const endKey =
    findFirstFnKey(state, ["endSession", "finishSession", "stopSession", "sessionEnd"]) ||
    findHeuristicSessionFnKey(state, "end");

  // For transparency in UI (tiny debug line, no errors)
  const startLabel = startKey ? startKey : "not found";
  const endLabel = endKey ? endKey : "not found";

  const callMaybe = (fn: any, args: any[]) => {
    try {
      fn(...args);
      return true;
    } catch {
      return false;
    }
  };

  const onStart = () => {
    const st = safeGetState();
    const fn = startKey && st ? st[startKey] : null;

    if (!isFn(fn)) {
      alert(
        "Session Start action not found in store.\n\nNext step: paste the session section of store.ts and I will wire it perfectly."
      );
      return;
    }

    // Try common signatures:
    // startSession()
    // startSession(grindId)
    // startSession({ grindId })
    const ok =
      callMaybe(fn, []) ||
      (activeGrindId ? callMaybe(fn, [activeGrindId]) : false) ||
      (activeGrindId ? callMaybe(fn, [{ grindId: activeGrindId }]) : false);

    if (!ok) {
      alert(
        "Found a session start function, but its parameters differ.\n\nNext step: paste the session section of store.ts and I will match the signature."
      );
    }
  };

  const onEnd = () => {
    const st = safeGetState();
    const fn = endKey && st ? st[endKey] : null;

    if (!isFn(fn)) {
      alert(
        "Session End action not found in store.\n\nNext step: paste the session section of store.ts and I will wire it perfectly."
      );
      return;
    }

    // Try common signatures:
    // endSession()
    // endSession({ reason })
    const ok = callMaybe(fn, []) || callMaybe(fn, [{ reason: "user" }]);

    if (!ok) {
      alert(
        "Found a session end function, but its parameters differ.\n\nNext step: paste the session section of store.ts and I will match the signature."
      );
    }
  };

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-3xl px-2 pt-2">
        <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur px-3 py-2 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-white/60">Session</div>
              <div className="truncate text-sm font-semibold">{activeSpeciesLabel}</div>

              {/* tiny wiring hint (helps debugging without breaking anything) */}
              <div className="mt-0.5 text-[10px] text-white/35">
                start: {startLabel} · end: {endLabel}
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
        </div>
      </div>
    </div>
  );
}
