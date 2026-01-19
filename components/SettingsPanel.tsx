// SettingsPanel.tsx
import React from "react";

// NEW: import from appMeta instead of constants
import { APP_VERSION, IS_BETA, APP_NAME } from "../appMeta";

export default function SettingsPanel() {
  const handleViewDisclaimer = () => {
    localStorage.removeItem("beta_disclaimer_seen");
    window.location.reload();
  };

  const handleResetApp = () => {
    const confirmed = window.confirm(
      "This will erase ALL app data including grinds, stats, and trophies.\n\nAre you sure you want to continue?"
    );

    if (!confirmed) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6 px-2">
      <h2 className="text-xl font-semibold">Settings</h2>

      {IS_BETA && (
        <p className="text-sm text-slate-400">
          {APP_NAME} is currently{" "}
          <span className="font-semibold text-amber-300">
            v{APP_VERSION}
          </span>
          . Data may reset between versions.
        </p>
      )}

      {/* Send Feedback */}
      <button
        onClick={() =>
          (window.location.href =
            "mailto:feedback@greatonegrind.app?subject=Great%20One%20Grind%20Feedback")
        }
        className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 text-sm font-semibold hover:bg-slate-800"
      >
        📩 Send Feedback
      </button>

      {/* View Beta Disclaimer Again */}
      <button
        onClick={handleViewDisclaimer}
        className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 text-sm font-semibold hover:bg-slate-800"
      >
        ⚠️ View Beta Disclaimer Again
      </button>

      {/* Reset App Data */}
      <button
        onClick={handleResetApp}
        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20"
      >
        🗑 Reset App Data
      </button>
    </div>
  );
}
