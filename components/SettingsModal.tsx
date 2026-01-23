// components/SettingsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import SettingsPanel from "./SettingsPanel";
import AboutScreen from "../src/features/about/AboutScreen";
import { useHunterStore } from "../store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal — UI wrapper only (READ-ONLY)
 * - Clean, grinder-friendly layout
 * - ESC closes
 * - Backdrop click closes
 * - Scroll-safe on small screens
 *
 * Phase 16C-C1 (UI polish):
 * - Fixes encoding artifacts (—, ✕, ←) by using plain text / safe chars
 * - Slight layout polish + mobile-safe sizing
 *
 * IMPORTANT:
 * - No store/session mutations live here
 * - Safe to change without touching persistence/session/history
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [view, setView] = useState<"settings" | "about">("settings");

  // Read-only flags (defensive)
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;

  const proEnabled = useMemo(() => isPro || isProTest, [isPro, isProTest]);

  useEffect(() => {
    if (!isOpen) return;

    // Always reset to Settings when opening (prevents "stuck on About")
    setView("settings");

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtitle =
    view === "about"
      ? "About • v1.0 • Read-only"
      : proEnabled
      ? "Settings - PRO features unlocked"
      : "Settings - PRO features locked (no payments enabled)";

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative z-[310] flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-white/90">
                  Great One Grind
                </div>

                {proEnabled ? (
                  <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">
                    PRO{isProTest ? " TEST" : ""}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">
                    FREE
                  </span>
                )}
              </div>

              <div className="mt-0.5 text-[11px] text-white/60">{subtitle}</div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {view === "about" ? (
                <button
                  type="button"
                  onClick={() => setView("settings")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                  aria-label="Back to Settings"
                  title="Back to Settings"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setView("about")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                  aria-label="About"
                  title="About"
                >
                  About
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                aria-label="Close"
                title="Close"
              >
                X
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[75vh] overflow-y-auto px-4 py-4">
            {view === "about" ? <AboutScreen /> : <SettingsPanel />}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-white/50">
                Tip: Press <span className="text-white/70">ESC</span> to close.
              </div>

              {view === "about" ? (
                <div className="text-[11px] text-white/60">About is read-only.</div>
              ) : !proEnabled ? (
                <div className="text-[11px] text-white/60">PRO is UI-only in this build.</div>
              ) : (
                <div className="text-[11px] text-white/60">Thanks for supporting the grind.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
