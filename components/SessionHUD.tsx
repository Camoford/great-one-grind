// components/SessionHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";
import { appendSessionToHistory } from "../utils/sessionHistory";

/**
 * Session HUD — stable + defensive
 * P3 Session Summary (protected from Undo cleanup)
 * + Session History append (read-only)
 * - Saves summary under protected key
 * - Appends snapshot to bounded history
 * - Fires browser event for App.tsx to open modal
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

const HUD_SELECTED_GRIND_KEY = "greatonegrind_hud_selected_grind_v1";
const LAST_SESSION_SUMMARY_KEY = "__session_summary_protected_v1";
const SESSION_SUMMARY_EVENT = "greatonegrind:session_summary_ready";

type SavedSummary = {
  kills: number;
  durationMs: number;
  createdAt: number;
};

export default function SessionHUD() {
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

  const [selectedId, setSelectedId] = useState<string>(() => {
    return localStorage.getItem(HUD_SELECTED_GRIND_KEY) ?? "";
  });

  useEffect(() => {
    if (!selectedId && storeSelectedId) {
      const id = String(storeSelectedId);
      setSelectedId(id);
      localStorage.setItem(HUD_SELECTED_GRIND_KEY, id);
    }
  }, [storeSelectedId, selectedId]);

  useEffect(() => {
    if (selectedId || !grinds?.length) return;
    const first = grinds[0];
    if (!first?.id) return;
    const id = String(first.id);
    setSelectedId(id);
    localStorage.setItem(HUD_SELECTED_GRIND_KEY, id);
    if (isFn(setActiveGrindId)) setActiveGrindId(id);
  }, [grinds, selectedId, setActiveGrindId]);

  const selectedEntry = useMemo(() => {
    if (!selectedId) return null;
    return grinds.find((g: any) => String(g?.id) === String(selectedId)) ?? null;
  }, [selectedId, grinds]);

  const state = safeGetState();
  const startSession = state?.startSession;
  const endSession = state?.endSession;

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

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = sessionStartMs ? formatDuration(now - sessionStartMs) : "0:00";
  const isActive = !!activeSession;

  const activeSpeciesLabel =
    activeSession?.species ??
    activeSession?.speciesName ??
    selectedEntry?.species ??
    selectedEntry?.name ??
    "No species selected";

  const sessionKills: number =
    typeof activeSession?.kills === "number"
      ? activeSession.kills
      : typeof activeSession?.sessionKills === "number"
      ? activeSession.sessionKills
      : 0;

  const onSelect = (id: string) => {
    setSelectedId(id);
    if (id) localStorage.setItem(HUD_SELECTED_GRIND_KEY, id);
    else localStorage.removeItem(HUD_SELECTED_GRIND_KEY);
    if (isFn(setActiveGrindId)) setActiveGrindId(id);
  };

  const onStart = () => {
    if (!isFn(startSession) || !selectedId) return;
    try {
      startSession(selectedId);
    } catch {
      startSession({ grindId: selectedId });
    }
  };

  const onEnd = () => {
    if (!isFn(endSession)) return;

    const payload: SavedSummary = {
      kills: Math.max(0, sessionKills),
      durationMs: sessionStartMs
        ? Math.max(0, Date.now() - sessionStartMs)
        : 0,
      createdAt: Date.now(),
    };

    // ✅ Append to bounded session history (read-only feature)
    appendSessionToHistory(payload);

    // ✅ Preserve P3 protected summary behavior
    localStorage.setItem(
      LAST_SESSION_SUMMARY_KEY,
      JSON.stringify(payload)
    );
    window.dispatchEvent(new Event(SESSION_SUMMARY_EVENT));

    try {
      endSession();
    } catch {
      endSession({ reason: "user" });
    }
  };

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
                <div className="text-sm font-semibold tabular-nums">
                  {elapsed}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/60">Kills</div>
                <div className="text-sm font-semibold tabular-nums">
                  {sessionKills}
                </div>
              </div>

              {!isActive ? (
                <button
                  onClick={onStart}
                  className="rounded-xl bg-white text-black px-3 py-2 text-sm font-semibold"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={onEnd}
                  className="rounded-xl border border-white/15 bg-white/10 text-white px-3 py-2 text-sm font-semibold"
                >
                  End
                </button>
              )}
            </div>
          </div>

          {!isActive && (
            <div className="mt-2">
              <div className="text-xs text-white/60 mb-1">
                Active species
              </div>
              <select
                value={selectedId}
                onChange={(e) => onSelect(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm"
              >
                <option value="">Select species…</option>
                {grinds.map((g: any) => (
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
