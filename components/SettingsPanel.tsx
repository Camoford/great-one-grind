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

    const confirmedAgain = window.confirm(
      "Final warning:\n\nThis cannot be undone.\n\nPress OK to permanently erase everything."
    );
    if (!confirmedAgain) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6 px-2">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Hardcore Mode */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold">Hardcore Mode</div>
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                Grinds screen only
              </span>
            </div>

            <div className="text-sm text-white/70 leading-relaxed">
              <div className="mb-1">
                <span className="font-medium text-white/80">ON:</span> adds grinder-speed controls (negative buttons,{" "}
                <span className="font-medium text-white/80">+500/+1000</span>, and{" "}
                <span className="font-medium text-white/80">Reset Kills</span>).
              </div>
              <div>
                <span className="font-medium text-white/80">OFF:</span> keeps the clean layout (+1/+10/+50/+100).
              </div>
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

        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
          <span className="font-medium text-white/80">Safe:</span> this only changes the buttons you see.{" "}
          <span className="text-white/60">Your saved data stays the same.</span>
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
