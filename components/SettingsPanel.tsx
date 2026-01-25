// components/SettingsPanel.tsx
import React from "react";
import { useHunterStore } from "../store";

function Pill(props: { children: React.ReactNode; tone?: "pro" | "warn" | "info" }) {
  const tone = props.tone || "info";
  const cls =
    tone === "pro"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
      : "border-sky-500/35 bg-sky-500/10 text-sky-100";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {props.children}
    </span>
  );
}

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
  const hardcoreMode = useHunterStore((s: any) => !!s.hardcoreMode);
  const setHardcoreMode = useHunterStore((s: any) => s.setHardcoreMode);

  // PRO (defensive reads — works across builds)
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
    const ok = window.confirm(
      "This will erase ALL app data on this device (grinds, history, stats, trophies, backups).\n\nContinue?"
    );
    if (!ok) return;

    const ok2 = window.confirm("Final warning:\n\nThis cannot be undone.\n\nErase everything?");
    if (!ok2) return;

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
      "What happened? (expected vs actual)",
      "",
      "",
      "Steps to reproduce:",
      "1)",
      "2)",
      "3)",
      "",
      "Which screen? (Grinds / Quick Log / History / Stats / Settings / Upgrade)",
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
      <h2 className="text-xl font-semibold text-white">Settings</h2>

      {/* Beta Notes */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-white">Beta Notes</div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="warn">No payments</Pill>
            <Pill tone="info">UI-only PRO Test</Pill>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
          <div className="font-medium text-white/85 mb-1">Updates</div>
          Beta users automatically get the latest build. If something looks outdated,{" "}
          <span className="font-semibold text-white/85">refresh</span> or{" "}
          <span className="font-semibold text-white/85">close + reopen</span> the app.
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
          <div className="font-medium text-white/85 mb-1">Steam Deck</div>
          Open the beta link in the Deck browser. You can also{" "}
          <span className="font-semibold text-white/85">pin/install</span> it like an app, or add it to Steam as a{" "}
          <span className="font-semibold text-white/85">non-Steam game</span>.
        </div>

        <button
          type="button"
          onClick={handleReportIssue}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
        >
          Report an Issue (Email)
        </button>

        <div className="text-xs text-white/60">
          Reports open your email app and go to <span className="font-semibold text-white/70">carnley87@gmail.com</span>.
        </div>
      </div>

      {/* Hardcore Mode */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold text-white">Hardcore Mode</div>
              {!proEnabled ? <ProPill /> : <Pill tone="pro">PRO Enabled</Pill>}
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                Grinds screen only
              </span>
              {!proEnabled ? (
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                  Locked
                </span>
              ) : null}
            </div>

            <div className="text-sm text-white/70 leading-relaxed">
              <div>
                <span className="font-semibold text-white/80">ON:</span> adds grinder-speed controls (+500/+1000, negatives, reset).
              </div>
              <div>
                <span className="font-semibold text-white/80">OFF:</span> keeps the clean layout (+1/+10/+50/+100).
              </div>
            </div>
          </div>

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
            aria-label={proEnabled ? "Toggle Hardcore Mode" : "Hardcore Mode locked (PRO Test)"}
            title={proEnabled ? "Toggle Hardcore Mode" : "Locked — PRO"}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                proEnabled ? (hardcoreMode ? "translate-x-7" : "translate-x-1") : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {!proEnabled ? (
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-white/80">
            <span className="font-semibold text-amber-200">Locked — PRO:</span>{" "}
            Enable <span className="font-semibold">PRO Test</span> on the{" "}
            <span className="font-semibold">Upgrade</span> tab to preview this.{" "}
            <span className="text-white/70">No payments are enabled in beta.</span>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
            Safe: this only changes the buttons you see. Your saved data stays the same.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-base font-semibold text-white">Actions</div>

        <button
          type="button"
          onClick={handleViewDisclaimer}
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
        >
          View Beta Disclaimer Again
        </button>

        <button
          type="button"
          onClick={handleResetApp}
          className="w-full rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-white hover:bg-red-500/20"
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
