import React, { useMemo } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  kills: number;
  durationMs: number;
  title?: string;
};

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function SessionSummaryModal({
  open,
  onClose,
  kills,
  durationMs,
  title = "Session Summary",
}: Props) {
  const pacePerHour = useMemo(() => {
    const hours = durationMs / (1000 * 60 * 60);
    if (!hours || hours <= 0) return 0;
    return kills / hours;
  }, [kills, durationMs]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/60">
              Quick recap of this session’s grind.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Kills
            </div>
            <div className="mt-1 text-2xl font-bold text-white">{kills}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Time
            </div>
            <div className="mt-1 text-2xl font-bold text-white">
              {formatDuration(durationMs)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Avg pace
            </div>
            <div className="mt-1 text-2xl font-bold text-white">
              {pacePerHour.toFixed(1)}{" "}
              <span className="text-base font-semibold text-white/60">
                kills/hour
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-white/45">
          Note: Summary is read-only and does not change your grind data.
        </div>
      </div>
    </div>
  );
}
