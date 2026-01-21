import React, { useEffect, useMemo, useRef, useState } from "react";

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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);

    setReduced(!!mq.matches);

    // Safari fallback
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } else {
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }
  }, []);

  return reduced;
}

export default function SessionSummaryModal({
  open,
  onClose,
  kills,
  durationMs,
  title = "Session Summary",
}: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const pacePerHour = useMemo(() => {
    const hours = durationMs / (1000 * 60 * 60);
    if (!hours || hours <= 0) return 0;
    return kills / hours;
  }, [kills, durationMs]);

  // --- Animation state (purely visual) ---
  const [animateIn, setAnimateIn] = useState(false);

  // --- Auto-close safety ---
  const autoCloseMs = 12000; // 12s
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
  const timerRef = useRef<number | null>(null);

  // --- Focus management ---
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const cancelAutoClose = () => {
    if (!autoCloseEnabled) return;
    setAutoCloseEnabled(false);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) return;

    // Save last active element for restore
    lastActiveRef.current = (document.activeElement as HTMLElement) || null;

    // Trigger animation
    setAnimateIn(false);
    const raf = window.requestAnimationFrame(() => setAnimateIn(true));

    // Focus close button for keyboard users
    const focusT = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    // Start auto-close timer (cancellable)
    setAutoCloseEnabled(true);
    timerRef.current = window.setTimeout(() => {
      // Only close if user hasn't interacted
      onClose();
    }, autoCloseMs);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelAutoClose();
        onClose();
      }
    };

    // Prevent background scroll while modal open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(focusT);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;

      // Restore focus
      const el = lastActiveRef.current;
      if (el && typeof el.focus === "function") {
        try {
          el.focus();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Restart timer if kills/duration changes while open (rare; still read-only UI)
  useEffect(() => {
    if (!open) return;
    // Don't re-arm timer if user already interacted
    if (!autoCloseEnabled) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onClose(), autoCloseMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kills, durationMs]);

  if (!open) return null;

  const overlayAnim = prefersReducedMotion
    ? ""
    : "transition-opacity duration-200 ease-out";
  const cardAnim = prefersReducedMotion
    ? ""
    : "transition-transform transition-opacity duration-200 ease-out";

  const overlayOpacity = animateIn ? "opacity-100" : "opacity-0";
  const cardState = animateIn
    ? "opacity-100 translate-y-0 scale-100"
    : "opacity-0 translate-y-2 scale-[0.98]";

  const secondsLeft = Math.max(
    0,
    Math.ceil((autoCloseMs - 0) / 1000) // purely presentational placeholder baseline
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${overlayAnim} ${overlayOpacity}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseMove={cancelAutoClose}
      onMouseDown={cancelAutoClose}
      onTouchStart={cancelAutoClose}
      onScrollCapture={cancelAutoClose}
    >
      {/* Backdrop: click to close */}
      <button
        type="button"
        aria-label="Close session summary"
        className="absolute inset-0 cursor-default bg-black/70"
        onClick={() => {
          cancelAutoClose();
          onClose();
        }}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-xl ${cardAnim} ${cardState}`}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={cancelAutoClose}
        onFocusCapture={cancelAutoClose}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/60">
              Quick recap of this session’s grind.
            </p>
          </div>

          <button
            ref={closeBtnRef}
            onClick={() => {
              cancelAutoClose();
              onClose();
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Kills
            </div>
            <div className="mt-1 text-3xl font-extrabold text-white">{kills}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Time
            </div>
            <div className="mt-1 text-3xl font-extrabold text-white">
              {formatDuration(durationMs)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">
              Avg pace
            </div>
            <div className="mt-1 text-3xl font-extrabold text-white">
              {pacePerHour.toFixed(1)}{" "}
              <span className="text-base font-semibold text-white/60">
                kills/hour
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/45">
          <div>Saved automatically • Read-only</div>

          {autoCloseEnabled ? (
            <div className="text-white/40">
              Auto-closing soon (tap/scroll to keep open)
            </div>
          ) : (
            <div className="text-white/40">Auto-close paused</div>
          )}
        </div>
      </div>
    </div>
  );
}
