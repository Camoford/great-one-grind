// components/SessionSummaryModal.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * SessionSummaryModal (STABLE)
 * - Listens to SessionHUD dispatch event
 * - Reads fallback summary from protected localStorage key
 * - Renders at App root (already mounted by your cherry-pick)
 * - READ-ONLY: never mutates store
 */

const SUMMARY_KEY = "greatonegrind_session_summary_v1";
const SUMMARY_EVENT = "greatonegrind:session_summary";

type Summary = {
  kind?: string;
  createdAt?: number;
  species?: string;
  durationMs?: number;
  killsThisSession?: number;
  totalKillsForSpecies?: number;
  fur?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function safeParse(raw: string | null): Summary | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as Summary) : null;
  } catch {
    return null;
  }
}

export default function SessionSummaryModal() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const snapshot = useMemo(() => {
    if (!summary) return null;
    return {
      species: summary.species || "Unknown",
      duration: fmtDuration(summary.durationMs || 0),
      killsSession: Number.isFinite(summary.killsThisSession) ? (summary.killsThisSession as number) : 0,
      totalKills: Number.isFinite(summary.totalKillsForSpecies)
        ? (summary.totalKillsForSpecies as number)
        : 0,
      fur: (summary.fur || "").trim(),
    };
  }, [summary]);

  // Load last saved summary (fallback)
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(SUMMARY_KEY);
      const parsed = safeParse(raw);
      if (parsed) {
        setSummary(parsed);
        setOpen(true);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // On mount: try showing last summary if it exists
    loadFromStorage();

    const onEvent = (e: Event) => {
      try {
        const ce = e as CustomEvent;
        const detail = (ce && (ce as any).detail) as Summary | undefined;
        if (detail && typeof detail === "object") {
          setSummary(detail);
          setOpen(true);
          return;
        }
      } catch {
        // ignore
      }

      // If event had no detail, fallback to storage
      loadFromStorage();
    };

    window.addEventListener(SUMMARY_EVENT, onEvent as any);

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener(SUMMARY_EVENT, onEvent as any);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open || !snapshot) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-lg font-semibold">Session Summary</div>
          <button
            className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs opacity-70">Species</div>
            <div className="font-semibold">{snapshot.species}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs opacity-70">Duration</div>
              <div className="font-semibold">{snapshot.duration}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs opacity-70">Kills (session)</div>
              <div className="font-semibold">{snapshot.killsSession}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs opacity-70">Total kills (species)</div>
            <div className="font-semibold">{snapshot.totalKills}</div>
          </div>

          {snapshot.fur ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs opacity-70">Fur</div>
              <div className="font-semibold">{snapshot.fur}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 text-xs opacity-60">
          Tip: You can close with ESC or by clicking outside the card.
        </div>
      </div>
    </div>
  );
}
