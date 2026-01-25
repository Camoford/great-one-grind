// components/SettingsPanel.tsx
import React from "react";
import { useHunterStore } from "../store";

function ProPill() {
  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">
      PRO
    </span>
  );
}

function openMailto(subject: string, body: string) {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  const to = "carnley87@gmail.com";
  window.location.href = `mailto:${to}?subject=${s}&body=${b}`;
}

function getEnvInfo() {
  try {
    return {
      ua: navigator.userAgent || "unknown",
      platform: (navigator as any).platform || "unknown",
      lang: navigator.language || "unknown",
      w: window.innerWidth || 0,
      h: window.innerHeight || 0,
    };
  } catch {
    return { ua: "unknown", platform: "unknown", lang: "unknown", w: 0, h: 0 };
  }
}

export default function SettingsPanel() {
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);
  const setHardcoreMode = useHunterStore((s) => s.setHardcoreMode);

  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;

  const proEnabled = isPro || isProTest;

  const handleViewDisclaimer = () => {
    localStorage.removeItem("beta_disclaimer_seen");
    window.location.reload();
  };

  const handleResetApp = () => {
    if (
      !window.confirm(
        "This will erase ALL app data including grinds, stats, sessions, and trophies.\n\nContinue?"
      )
    )
      return;

    if (!window.confirm("Final warning:\n\nThis cannot be undone.\n\nErase everything?")) return;

    localStorage.clear();
    window.location.reload();
  };

  const handleToggleHardcore = () => {
    if (!proEnabled) return;
    setHardcoreMode(!hardcoreMode);
  };

  const handleReportIssue = () => {
    const { ua, platform, lang, w, h } = getEnvInfo();

    const subject = "Great One Grind — Beta Issue Report";
    const body = [
      "What happened (expected vs actual):",
      "",
      "",
      "Steps to reproduce:",
      "1)",
      "2)",
      "3)",
      "",
      "Which screen were you on? (Grinds / Quick Log / History / Stats / Settings)",
      "",
      "",
      "Attach a screenshot or screen recording if possible.",
      "",
      "---- Device info ----",
      `Platform: ${platform}`,
      `Language: ${lang}`,
      `Viewport: ${w} x ${h}`,
      `User Agent: ${ua}`,
      "",
      "Thank you!",
    ].join("\n");

    openMailto(subject, body);
  };

  return (
    <div className="space-y-6 px-2">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Beta Notes */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-base font-semibold">Beta Notes</div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
          <div className="font-medium text-white/80 mb-1">Updates</div>
          Beta users always receive the latest version. Refresh or reopen the app if something looks outdated.
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
          <div className="font-medium text-white/80 mb-1">Steam Deck</div>
          Steam Deck users can open the same beta link in the Deck browser, install it, or add it to Steam as a non-Steam game.
        </div>

        <button
          type="button"
          onClick={handleReportIssue}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
        >
          Report an Issue (Email)
        </button>

        <div className="text-xs text-white/60">
          Reports go directly to the developer’s email.
        </div>
      </div>

      {/* Hardcore Mode */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold">Hardcore Mode</div>
              {!proEnabled && <ProPill />}
            </div>

            <div className="text-sm text-white/70">
              <div>
                <strong>ON:</strong> grinder-speed controls (+500/+1000, negatives, reset).
              </div>
              <div>
                <strong>OFF:</strong> clean layout (+1/+10/+50/+100).
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleHardcore}
            disabled={!proEnabled}
            className={`relative inline-flex h-8 w-14 items-center rounded-full border ${
              proEnabled
                ? hardcoreMode
                  ? "bg-emerald-500/30 border-emerald-400/40"
                  : "bg-white/10 border-white/15"
                : "bg-white/5 border-white/10 opacity-60 cursor-not-allowed"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white ${
                hardcoreMode ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-base font-semibold">Actions</div>

        <button
          onClick={handleViewDisclaimer}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm"
        >
          View Beta Disclaimer Again
        </button>

        <button
          onClick={handleResetApp}
          className="w-full rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm"
        >
          Factory Reset (Erase Everything)
        </button>
      </div>
    </div>
  );
}
