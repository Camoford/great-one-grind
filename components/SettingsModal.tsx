// components/SettingsModal.tsx
import React, { useEffect } from "react";
import SettingsPanel from "./SettingsPanel";

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
              <div className="text-sm font-semibold text-white/90">Great One Grind</div>
              <div className="text-[11px] text-white/60">Settings</div>
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
            <div className="text-[11px] text-white/50">
              Tip: Press <span className="text-white/70">ESC</span> to close.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
