// components/SettingsPanel.tsx
import React from "react";
import { useHunterStore } from "../store";

export default function SettingsPanel() {
  // Hardcore Mode from the store
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);
  const setHardcoreMode = useHunterStore((s) => s.setHardcoreMode);

  // If your app already has these keys, keep them as-is
  const handleViewDisclaimer = () => {
    localStorage.removeItem("beta_disclaimer_seen");
    window.location.reload();
  };

  const handleResetApp = () => {
    const confirmed = window.confirm(
      "This will erase ALL app data including grinds, stats, sessions, and trophies.\n\nAre you sure you want to continue?"
    );

    if (!confirmed) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6 px-2">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Hardcore Mode Toggle */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-base font-semibold">Hardcore Mode</div>
            <div className="text-sm text-white/70">
              When ON: shows grinder-speed controls in Grinds (negative buttons, +500/+1000, Reset Kills).
              <br />
              When OFF: keeps the simple +1/+10/+50/+100 layout.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHardcoreMode(!hardcoreMode)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
              hardcoreMode
                ? "bg-emerald-500/30 border-emerald-400/40"
                : "bg-white/10 border-white/15"
            }`}
            aria-pressed={hardcoreMode}
            aria-label="Toggle Hardcore Mode"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                hardcoreMode ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-3 text-xs text-white/60">
          Tip: Hardcore Mode changes only the button layout — your saved data stays the same.
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-base font-semibold">Actions</div>

        <button
          type="button"
          onClick={handleViewDisclaimer}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
        >
          View Beta Disclaimer Again
        </button>

        <button
          type="button"
          onClick={handleResetApp}
          className="w-full rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm hover:bg-red-500/20"
        >
          Factory Reset (Erase Everything)
        </button>

        <div className="text-xs text-white/60">
          Factory Reset clears all local app data on this device.
        </div>
      </div>
    </div>
  );
}
