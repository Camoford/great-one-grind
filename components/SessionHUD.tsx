// SessionHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * Session HUD — stable + defensive
 * Phase 7G FIX: write ended sessions to localStorage session history
 *
 * Truth source (from src/utils/sessionHistory.ts):
 * - KEY: "greatonegrind_session_history_v1"
 * - append behavior: unshift(entry), cap max 500
 *
 * This file writes directly to localStorage so it cannot miss due to import/path issues.
 */

const SESSION_HISTORY_KEY = "greatonegrind_session_history_v1";
const HUD_SELECTED_GRIND_KEY = "greatonegrind_hud_selected_grind_v1";

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

function safeNow() {
  return Date.now();
}

function safeNumber(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function pickStartedAt(activeSession: any): number {
  if (!activeSession) return safeNow();
  const raw =
    activeSession.startedAt ??
    activeSession.startTime ??
    activeSession.startAt ??
    activeSession.started ??
    activeSession.start ??
    null;

  if (!raw) return safeNow();
  if (typeof raw === "number") return raw;

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : safeNow();
}

function pickKills(activeSession: any): number {
  const direct =
    activeSession?.kills ??
    activeSession?.sessionKills ??
    activeSession?.killsThisSession ??
    activeSession?.count ??
    null;

  return typeof direct === "number" ? direct : 0;
}

function pickSpeciesLabel(activeSession: any, selectedEntry: any): string {
  const fromSession = activeSession?.species ?? activeSession?.speciesName ?? null;
  if (typeof fromSession === "string" && fromSession.trim()) return fromSession;

  const fromSelected =
    selectedEntry?.species ?? selectedEntry?.name ?? selectedEntry?.title ?? null;
  if (typeof fromSelected === "string" && fromSelected.trim()) return fromSelected;

  return "Unknown";
}

function appendSessionHistoryLocal(entry: any, max: number = 500) {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];

    list.unshift(entry);
    if (list.length > max) list.length = max;

    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(list));
  } catch {
    // never crash the app
  }
}

function dispatchHistoryUpdated() {
  try {
    window.dispatchEvent(new Event("greatonegrind:historyUpdated"));
    window.dispatchEvent(new Event("greatonegrind:sessionEnded"));
  } catch {
    // ignore
  }
}

export default function SessionHUD() {
  // ---- Store selectors (try all common keys) ----
  const grinds = useHunterStore((s: any) =>
    s.grinds ??
    s.grindEntries ??
    s.grindList ??
    s.species ??
    s.speciesList ??
    s.entries ??
    []
  );

  const activeSession = useHunterStore((s: any) =>
    s.activeSession ?? s.session ?? s.currentSession ?? null
  );

  const storeSelectedId = useHunterStore((s: any) =>
    s.activeGrindId ??
    s.selectedGrindId ??
    s.currentGrindId ??
    s.activeId ??
    s.selectedId ??
    s.currentId ??
    null
  );

  const setActiveGrindId = useHunterStore((s: any) =>
    s.setActiveGrindId ??
    s.setSelectedGrindId ??
    s.setCurrentGrindId ??
    s.setActiveId ??
    s.setSelectedId ??
    null
  );

  // ---- Persisted selection ----
  const [selectedId, setSelectedId] = useState<string>(() => {
    const saved = localStorage.getItem(HUD_SELECTED_GRIND_KEY);
    return saved ?? "";
  });

  // If store already has an active/selected id, adopt it
  useEffect(() => {
    if (!selectedId && storeSelectedId) {
      const id = String(storeSelectedId);
      setSelectedId(id);
      localStorage.setItem(HUD_SELECTED_GRIND_KEY, id);
    }
  }, [storeSelectedId, selectedId]);

  // Auto-pick first grind if nothing selected
  useEffect(() => {
    if (selectedId) return;
    if (!Array.isArray(grinds) || grinds.length === 0) return;

    const first = grinds[0];
    if (!first?.id) return;

    const id = String(first.id);
    setSelectedId(id);
    localStorage.setItem(HUD_SELECTED_GRIND_KEY, id);

    if (isFn(setActiveGrindId)) {
      try {
        setActiveGrindId(id);
      } catch {
        // ignore
      }
    }
  }, [grinds, selectedId, setActiveGrindId]);

  const selectedEntry = useMemo(() => {
    if (!selectedId || !Array.isArray(grinds)) return null;
    return grinds.find((g: any) => String(g?.id) === String(selectedId)) ?? null;
  }, [selectedId, grinds]);

  // ---- start/end session actions from store ----
  const state = safeGetState();
  const startSession = state?.startSession;
  const endSession = state?.endSession;

  // ---- Timer ----
  const sessionStartMs: number | null = useMemo(() => {
    if (!activeSession) return null;
    return pickStartedAt(activeSession);
  }, [activeSession]);

  const [now, setNow] = useState(() => safeNow());
  useEffect(() => {
    const t = setInterval(() => setNow(safeNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = sessionStartMs ? formatDuration(now - sessionStartMs) : "0:00";
  const isActive = !!activeSession;

  const activeSpeciesLabel = useMemo(() => {
    return pickSpeciesLabel(activeSession, selectedEntry);
  }, [activeSession, selectedEntry]);

  const sessionKills: number = useMemo(() => {
    return pickKills(activeSession);
  }, [activeSession]);

  const onSelect = (id: string) => {
    setSelectedId(id);
    if (id) localStorage.setItem(HUD_SELECTED_GRIND_KEY, id);
    else localStorage.removeItem(HUD_SELECTED_GRIND_KEY);

    if (id && isFn(setActiveGrindId)) {
      try {
        setActiveGrindId(id);
      } catch {
        // ignore
      }
    }
  };

  const onStart = () => {
    if (!isFn(startSession)) {
      alert("startSession not found in store.");
      return;
    }
    if (!selectedId) {
      alert("Pick a species first, then press Start.");
      return;
    }

    const ok =
      (() => {
        try {
          startSession(selectedId);
          return true;
        } catch {
          return false;
        }
      })() ||
      (() => {
        try {
          startSession({ grindId: selectedId });
          return true;
        } catch {
          return false;
        }
      })();

    if (!ok) {
      alert("startSession exists, but its parameters differ. Paste store.ts session section.");
    }
  };

  const onEnd = () => {
    if (!isFn(endSession)) {
      alert("endSession not found in store.");
      return;
    }

    // Capture snapshot BEFORE ending (endSession may clear activeSession)
    const startedAt = pickStartedAt(activeSession);
    const endedAt = safeNow();
    const durationMs = Math.max(0, endedAt - startedAt);
    const kills = pickKills(activeSession);
    const species = pickSpeciesLabel(activeSession, selectedEntry);
    const grindId = selectedId || String(storeSelectedId ?? "") || null;

    const entry = {
      id: `sess_${endedAt}_${Math.random().toString(16).slice(2)}`,
      species,
      grindId,
      startedAt,
      endedAt,
      durationMs,
      kills,
      createdAt: endedAt,
      v: 1,
    };

    // End session (keep your defensive calls)
    try {
      endSession();
    } catch {
      try {
        endSession({ reason: "user" });
      } catch {
        alert("endSession exists, but its parameters differ. Paste store.ts session section.");
        return;
      }
    }

    // Write to the exact key Archive reads from
    appendSessionHistoryLocal(entry, 500);

    // Notify Archive (same tab) + any listeners
    dispatchHistoryUpdated();
  };

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-3xl px-2 pt-2">
        <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur px-3 py-2 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-white/60">Session</div>
              <div className="truncate text-sm font-semibold">{activeSpeciesLabel}</div>
              <div className="mt-0.5 text-[10px] text-white/35">
                start: startSession · end: endSession
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

          {!isActive && (
            <div className="mt-2">
              <div className="text-xs text-white/60 mb-1">Active species</div>
              <select
                value={selectedId}
                onChange={(e) => onSelect(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none"
              >
                <option value="">Select species…</option>
                {Array.isArray(grinds) &&
                  grinds.map((g: any) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.species ?? g.name ?? "Unknown"}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
