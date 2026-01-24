// components/SessionHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { GREAT_ONE_SPECIES, useHunterStore, type GreatOneSpecies } from "../store";
import { appendSessionHistory } from "../src/utils/sessionHistory";

/**
 * SessionHUD (STABLE)
 *
 * Fix:
 * - Some builds show correct kills in UI but persist 0 on End due to stale closures.
 * - On End we read LIVE Zustand state via useHunterStore.getState().
 * - Then appendSessionHistory() writes the exact values Stats/History expect.
 */

const SUMMARY_KEY = "greatonegrind_session_summary_v1";
const SUMMARY_EVENT = "greatonegrind:session_summary";

// session-only extras (diamonds/rares) persisted locally during active session
const EXTRAS_KEY = "greatonegrind_session_extras_v1";

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

type SessionExtras = {
  kind: "session_extras_v1";
  startedAt: number; // tie extras to the current session
  species: GreatOneSpecies;
  diamonds: number;
  rares: number;
};

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function readExtras(): SessionExtras | null {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.kind !== "session_extras_v1") return null;
    return parsed as SessionExtras;
  } catch {
    return null;
  }
}

function writeExtras(extras: SessionExtras) {
  try {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras));
  } catch {
    // ignore
  }
}

function clearExtras() {
  try {
    localStorage.removeItem(EXTRAS_KEY);
  } catch {
    // ignore
  }
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

  // session-only counters
  const [diamonds, setDiamonds] = useState(0);
  const [rares, setRares] = useState(0);

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

  const sessionStartedAt = useMemo(() => {
    return activeSession?.startedAt || 0;
  }, [activeSession]);

  // Load persisted extras when session changes / app refresh
  useEffect(() => {
    if (!activeSession) {
      setDiamonds(0);
      setRares(0);
      return;
    }

    const startedAt = activeSession.startedAt || 0;
    const s = species;

    const existing = readExtras();
    if (
      existing &&
      existing.startedAt === startedAt &&
      existing.species === s &&
      Number.isFinite(existing.diamonds) &&
      Number.isFinite(existing.rares)
    ) {
      setDiamonds(clampInt(existing.diamonds));
      setRares(clampInt(existing.rares));
    } else {
      const fresh: SessionExtras = {
        kind: "session_extras_v1",
        startedAt,
        species: s,
        diamonds: 0,
        rares: 0,
      };
      writeExtras(fresh);
      setDiamonds(0);
      setRares(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, species]);

  // Persist on change (during active session only)
  useEffect(() => {
    if (!activeSession) return;
    const startedAt = activeSession.startedAt || 0;
    if (!startedAt) return;

    const extras: SessionExtras = {
      kind: "session_extras_v1",
      startedAt,
      species,
      diamonds: clampInt(diamonds),
      rares: clampInt(rares),
    };
    writeExtras(extras);
  }, [activeSession, sessionStartedAt, species, diamonds, rares]);

  const elapsed = useMemo(() => {
    if (!activeSession) return "0:00";
    return formatDuration(safeNow() - (activeSession.startedAt || safeNow()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, tick]);

  // UI display (can be from reactive state)
  const killsThisSession = clampInt(activeSession?.kills ?? 0);

  function buildSummarySnapshot() {
    const grind = grinds.find((g) => g.species === species);
    const totalKillsForSpecies = clampInt(grind?.kills ?? 0);
    const fur = (grind?.fur || "").trim();

    const extras = readExtras();
    const d =
      extras && extras.startedAt === (activeSession?.startedAt || 0) && extras.species === species
        ? clampInt(extras.diamonds)
        : clampInt(diamonds);
    const r =
      extras && extras.startedAt === (activeSession?.startedAt || 0) && extras.species === species
        ? clampInt(extras.rares)
        : clampInt(rares);

    return {
      kind: "session_summary_v1",
      createdAt: safeNow(),
      species,
      durationMs: activeSession ? safeNow() - (activeSession.startedAt || safeNow()) : 0,
      killsThisSession,
      totalKillsForSpecies,
      fur,
      diamondsThisSession: d,
      raresThisSession: r,
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

  /**
   * CRITICAL: Persist history using LIVE Zustand state (prevents 0-kill writes).
   */
  function persistSessionHistoryOnEnd() {
    try {
      const live = useHunterStore.getState();
      const liveActive = live.activeSession as any;

      if (!liveActive) return;

      const startedAt = clampInt(liveActive.startedAt ?? 0);
      const liveSpecies = (liveActive.species as GreatOneSpecies) || species;
      if (!startedAt) return;

      const endedAt = safeNow();
      const durationMs = Math.max(0, endedAt - startedAt);

      const extras = readExtras();
      const d =
        extras && extras.startedAt === startedAt && extras.species === liveSpecies
          ? clampInt(extras.diamonds)
          : clampInt(diamonds);
      const r =
        extras && extras.startedAt === startedAt && extras.species === liveSpecies
          ? clampInt(extras.rares)
          : clampInt(rares);

      // LIVE kills (this is the whole fix)
      const k = clampInt(liveActive.kills ?? 0);

      appendSessionHistory({
        species: liveSpecies,
        startedAt,
        endedAt,
        durationMs,

        // kills (new + backward compat)
        killsThisSession: k,
        kills: k,

        diamondsThisSession: d,
        raresThisSession: r,
      });
    } catch {
      // never block End
    }
  }

  function resetSessionExtras(nextSpecies: GreatOneSpecies) {
    const startedAt = activeSession?.startedAt || 0;

    setDiamonds(0);
    setRares(0);

    const extras: SessionExtras = {
      kind: "session_extras_v1",
      startedAt,
      species: nextSpecies,
      diamonds: 0,
      rares: 0,
    };
    writeExtras(extras);
  }

  function onStart() {
    if (isActive) return;
    resetSessionExtras(selectedSpecies);
    startSession(selectedSpecies);
  }

  function onEnd() {
    if (!isActive) return;

    // 1) Persist history FIRST (using LIVE store state)
    persistSessionHistoryOnEnd();

    // 2) Fire summary BEFORE ending session
    dispatchSummary();

    // 3) End + clear session-only extras
    endSession();
    clearExtras();
    setDiamonds(0);
    setRares(0);
  }

  function onUndo() {
    const res = undoLastAction();
    if (!res.ok) return;
  }

  function addDiamond() {
    if (!isActive) return;
    setDiamonds((x) => clampInt(x + 1));
  }

  function addRare() {
    if (!isActive) return;
    setRares((x) => clampInt(x + 1));
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex flex-col gap-2">
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

            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-xs opacity-70">Diamonds (session)</div>
              <div className="font-semibold">{isActive ? diamonds : 0}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-xs opacity-70">Rares (session)</div>
              <div className="font-semibold">{isActive ? rares : 0}</div>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={addDiamond}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base font-semibold hover:bg-white/15"
              title="Add one Diamond harvest to this session"
            >
              + Diamond
            </button>

            <button
              onClick={addRare}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base font-semibold hover:bg-white/15"
              title="Add one Rare harvest to this session"
            >
              + Rare
            </button>
          </div>
        )}

        <div className="text-xs opacity-60">
          Undo is temporary (8s) and not saved. Session Summary appears on End.
        </div>
      </div>
    </div>
  );
}
