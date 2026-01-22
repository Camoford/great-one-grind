// components/SettingsModal.tsx
import React, { useEffect } from "react";
import SettingsPanel from "./SettingsPanel";
import { useHunterStore } from "../store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal — UI wrapper only
 * - Clean, grinder-friendly layout
 * - ESC closes
 * - Backdrop click closes
 * - Scroll-safe on small screens
 *
 * IMPORTANT:
 * - No state mutations live here (SettingsPanel owns actions)
 * - Safe to change without touching persistence/session/history
 */
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // Phase 4 prep: isPro persistence + test toggle exists.
  // Read defensively so we don't break if the test flag name varies.
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;

  const proEnabled = isPro || isProTest;

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-white/90">Great One Grind</div>

                {proEnabled ? (
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">
                    PRO {isProTest ? "TEST" : ""}
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-400/25 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">
                    FREE
                  </span>
                )}
              </div>

              <div className="text-[11px] text-white/60">
                Settings {proEnabled ? "— PRO features unlocked" : "— PRO features locked (no payments enabled)"}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[75vh] overflow-y-auto px-4 py-4">
            <SettingsPanel />
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-white/50">
                Tip: Press <span className="text-white/70">ESC</span> to close.
              </div>

              {!proEnabled ? (
                <div className="text-[11px] text-white/60">
                  PRO is UI-only in this build.
                </div>
              ) : (
                <div className="text-[11px] text-white/60">Thanks for supporting the grind.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
