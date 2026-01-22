// components/SettingsPanel.tsx
import React, { useMemo } from "react";
import { useHunterStore } from "../store";

export default function SettingsPanel() {
  // Hardcore Mode from the store (DO NOT change plumbing)
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);
  const setHardcoreMode = useHunterStore((s) => s.setHardcoreMode);

  // Existing keys/actions (keep behavior)
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

  const modeMeta = useMemo(() => {
    if (hardcoreMode) {
      return {
        title: "Hardcore",
        kicker: "Deep end enabled",
        badge: "⚔️ HARDCORE",
        frame:
          "rounded-2xl border border-orange-400/25 bg-gradient-to-b from-orange-500/10 via-black/40 to-black/30",
        chip:
          "rounded-full border border-orange-400/30 bg-orange-500/15 px-2 py-0.5 text-xs text-white",
        subtle: "text-orange-100/80",
      };
    }
    return {
      title: "Casual",
      kicker: "Simple mode enabled",
      badge: "🧊 CASUAL",
      frame: "rounded-2xl border border-white/10 bg-white/5",
      chip:
        "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80",
      subtle: "text-white/70",
    };
  }, [hardcoreMode]);

  const segmentOuter =
    "inline-flex rounded-2xl border border-white/10 bg-black/30 p-1";
  const segmentBtn =
    "px-3 py-2 text-sm font-semibold rounded-xl transition active:scale-[0.99]";
  const segmentOn =
    hardcoreMode
      ? "bg-orange-500/15 border border-orange-400/20 text-white"
      : "bg-white/10 border border-white/15 text-white";
  const segmentOff = "bg-transparent text-white/70 hover:bg-white/5";

  return (
    <div className="space-y-6 px-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Settings</h2>
        <span className={modeMeta.chip}>{modeMeta.badge}</span>
      </div>

      {/* MODE SELECTOR (visual only; uses existing setter) */}
      <div className={modeMeta.frame + " p-4"}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold">Mode</div>
              <span className="text-xs text-white/50">(visual + controls)</span>
            </div>

            <div className="text-sm text-white/70">
              Choose your grind identity. This only changes the control layout and
              visual feel — your data stays intact.
            </div>

            <div className="mt-2 text-xs">
              <span className="text-white/60">Current:</span>{" "}
              <span className={`font-semibold ${modeMeta.subtle}`}>
                {modeMeta.title}
              </span>{" "}
              <span className="text-white/50">•</span>{" "}
              <span className={modeMeta.subtle}>{modeMeta.kicker}</span>
            </div>
          </div>

          {/* Segmented control — zero extra taps, no new plumbing */}
          <div className={segmentOuter} role="group" aria-label="Mode selector">
            <button
              type="button"
              className={`${segmentBtn} ${
                !hardcoreMode ? segmentOn : segmentOff
              }`}
              onClick={() => setHardcoreMode(false)}
              aria-pressed={!hardcoreMode}
            >
              Casual
            </button>
            <button
              type="button"
              className={`${segmentBtn} ${
                hardcoreMode ? segmentOn : segmentOff
              }`}
              onClick={() => setHardcoreMode(true)}
              aria-pressed={hardcoreMode}
            >
              Hardcore
            </button>
          </div>
        </div>

        {/* Mode explainer */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Casual</div>
            <div className="mt-1 text-sm text-white/80">
              Clean layout. Fast taps.
            </div>
            <ul className="mt-2 space-y-1 text-xs text-white/60">
              <li>• Quick add: +1 / +10 / +50 / +100</li>
              <li>• No negative controls</li>
              <li>• Minimal visual noise</li>
            </ul>
          </div>

          <div className="rounded-xl border border-orange-400/15 bg-black/40 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/60">Hardcore</div>
              <span className="text-[10px] rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-orange-100/80">
                paying-grinder tier
              </span>
            </div>

            <div className="mt-1 text-sm text-white/90">
              Elite controls. No wasted motion.
            </div>

            <ul className="mt-2 space-y-1 text-xs text-orange-100/70">
              <li>• Adds -1 / -10 / -50 / -100 + big adds (+500/+1000)</li>
              <li>• Adds Reset Kills (with confirm)</li>
              <li>• Subtle “deep end” accents (HUD + chips)</li>
            </ul>
          </div>
        </div>

        <div className="mt-3 text-xs text-white/60">
          Tip: Hardcore Mode affects button layout only — it does not change your
          saved grind totals, trophies, sessions, or history.
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-base font-semibold">Actions</div>

        <button
          type="button"
          onClick={handleViewDisclaimer}
          className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 active:scale-[0.99]"
        >
          View Beta Disclaimer Again
        </button>

        <button
          type="button"
          onClick={handleResetApp}
          className="w-full rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm hover:bg-red-500/20 active:scale-[0.99]"
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
