// components/SettingsPanel.tsx
import React, { useMemo } from "react";
import { useHunterStore } from "../store";

function ProPill() {
  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">
      PRO
    </span>
  );
}

export default function SettingsPanel() {
  // Hardcore Mode from the store (DO NOT change plumbing)
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);
  const setHardcoreMode = useHunterStore((s) => s.setHardcoreMode);

  // Phase 4 prep: isPro persistence + test toggle exists.
  // Read defensively so we don't break if the test flag name varies.
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;

  const proEnabled = isPro || isProTest;

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

  const handleToggleHardcore = () => {
    if (!proEnabled) return;
    setHardcoreMode(!hardcoreMode);
  };

  return (
    <div className="space-y-6 px-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Settings</h2>
        <span className={modeMeta.chip}>{modeMeta.badge}</span>
      </div>

      {/* Hardcore Mode */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold">Hardcore Mode</div>

              {!proEnabled ? <ProPill /> : null}

              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                Grinds screen only
              </span>

              {!proEnabled ? (
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                  Locked
                </span>
              ) : null}
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

          {/* Toggle (PRO-gated) */}
          <button
            type="button"
            onClick={handleToggleHardcore}
            disabled={!proEnabled}
            className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
              proEnabled
                ? hardcoreMode
                  ? "bg-emerald-500/30 border-emerald-400/40"
                  : "bg-white/10 border-white/15"
                : "bg-white/5 border-white/10 opacity-60 cursor-not-allowed"
            }`}
            aria-pressed={proEnabled ? hardcoreMode : false}
            aria-label={proEnabled ? "Toggle Hardcore Mode" : "Hardcore Mode locked (PRO)"}
            title={proEnabled ? "Toggle Hardcore Mode" : "Locked — PRO"}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                proEnabled ? (hardcoreMode ? "translate-x-7" : "translate-x-1") : "translate-x-1"
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

        {/* Helper / lock message */}
        {proEnabled ? (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
            <span className="font-medium text-white/80">Safe:</span> this only changes the buttons you see.{" "}
            <span className="text-white/60">Your saved data stays the same.</span>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-white/80">
            <span className="font-medium text-amber-200">Locked — PRO:</span>{" "}
            <span className="text-white/70">
              Enable PRO (or TEST mode) to turn on Hardcore Mode. No payments are enabled in this build.
            </span>
          </div>
        )}
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

        <div className="text-xs text-white/60">Factory Reset clears all local app data on this device.</div>
      </div>
    </div>
  );
}
