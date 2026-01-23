// components/SessionSummaryModal.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * SessionSummaryModal (STABLE)
 * - Opens ONLY when SessionHUD dispatches event
 * - Storage is fallback ONLY when event fires without detail
 * - READ-ONLY: never mutates store
 * - On close: clears protected localStorage snapshot so it won't re-open on refresh
 *
 * Phase 16C-A2 — UI polish ONLY
 * - Layout/spacing improvements
 * - Stronger header + actions row
 * - Optional badge based on summary.kind
 * - Defensive display (no logic changes)
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

function pretty(n: number) {
  try {
    return new Intl.NumberFormat().format(n || 0);
  } catch {
    return String(n || 0);
  }
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

    const kind = (summary.kind || "").toLowerCase();
    const obtainedHint =
      kind.includes("obtained") ||
      kind.includes("trophy") ||
      kind.includes("greatone") ||
      kind.includes("great_one");

    return {
      kind: summary.kind || "",
      obtainedHint,
      species: (summary.species || "Unknown").trim() || "Unknown",
      duration: fmtDuration(summary.durationMs || 0),
      killsSession: Number.isFinite(summary.killsThisSession)
        ? (summary.killsThisSession as number)
        : 0,
      totalKills: Number.isFinite(summary.totalKillsForSpecies)
        ? (summary.totalKillsForSpecies as number)
        : 0,
      fur: (summary.fur || "").trim(),
    };
  }, [summary]);

  function loadFromStorage(): Summary | null {
    try {
      return safeParse(localStorage.getItem(SUMMARY_KEY));
    } catch {
      return null;
    }
  }

  function closeAndClear() {
    try {
      localStorage.removeItem(SUMMARY_KEY);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  useEffect(() => {
    const onEvent = (e: Event) => {
      // Priority 1: event detail
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

      // Priority 2: fallback to storage ONLY when the event fires
      const stored = loadFromStorage();
      if (stored) {
        setSummary(stored);
        setOpen(true);
      }
    };

    window.addEventListener(SUMMARY_EVENT, onEvent as any);

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeAndClear();
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
      onMouseDown={closeAndClear}
      role="dialog"
      aria-modal="true"
      aria-label="Session summary modal"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-white">Session Summary</div>
              {snapshot.obtainedHint ? (
                <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                  Obtained
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 text-xs text-white/60">
              Species totals are shown for quick tracking.
            </div>
          </div>

          <button
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            onClick={closeAndClear}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="mt-3 space-y-2 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Species</div>
            <div className="font-semibold text-white truncate">{snapshot.species}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Duration</div>
              <div className="font-semibold text-white">{snapshot.duration}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Kills (session)</div>
              <div className="font-semibold text-white">{pretty(snapshot.killsSession)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Total kills (species)</div>
            <div className="font-semibold text-white">{pretty(snapshot.totalKills)}</div>
          </div>

          {snapshot.fur ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Fur</div>
              <div className="font-semibold text-white">{snapshot.fur}</div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs text-white/50">
            Tip: ESC or click outside to close
          </div>

          <button
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            onClick={closeAndClear}
            title="Continue grinding"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
