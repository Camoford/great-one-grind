// components/SettingsPanel.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * SettingsPanel (UI-only)
 * Adds: About / Version card + Copy Debug Info
 * Keeps: Hidden PRO Beta Key Redeem flow
 * - No backend
 * - No payments
 * - One-time redeem PER DEVICE (device-local lock)
 * - Hidden section (tap header 7 times)
 *
 * NOTE:
 * - About/Version is READ-ONLY and safe.
 */

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
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    };
  } catch {
    return { ua: "unknown", platform: "unknown", lang: "unknown", w: 0, h: 0, tz: "unknown" };
  }
}

/* ---------------- About / Version (UI-only) ---------------- */

const ABOUT_UI_KEY = "greatonegrind_about_ui_v1";

function loadAboutOpen(): boolean {
  try {
    const raw = localStorage.getItem(ABOUT_UI_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return !!parsed?.open;
  } catch {
    return false;
  }
}

function saveAboutOpen(open: boolean) {
  try {
    localStorage.setItem(ABOUT_UI_KEY, JSON.stringify({ open }));
  } catch {}
}

function tryGetBuildVersion(): string {
  // Try common Vite env patterns; falls back to "Beta"
  try {
    const anyImportMeta = (import.meta as any) || {};
    const env = anyImportMeta.env || {};
    const v =
      env.VITE_APP_VERSION ||
      env.VITE_VERSION ||
      env.VITE_BUILD ||
      env.VITE_COMMIT ||
      env.VITE_GIT_SHA ||
      "";
    return (typeof v === "string" && v.trim()) ? v.trim() : "Beta";
  } catch {
    return "Beta";
  }
}

function nowIsoLocal() {
  try {
    return new Date().toLocaleString();
  } catch {
    return "";
  }
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  // fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ---------------- PRO Beta Key Redeem ---------------- */

const REDEEM_UI_KEY = "greatonegrind_pro_redeem_ui_v1";
const REDEEMED_SET_KEY = "greatonegrind_pro_redeemed_keys_v1";

/**
 * ✅ You control these keys.
 * Keep them hard-to-guess, and only give them to selected testers.
 *
 * Format suggestion:
 * GOG-PRO-XXXX-XXXX-XXXX (letters/numbers)
 *
 * Example keys below are placeholders — replace them before distributing.
 */
const KEYRING = [
  // Replace these with your real beta keys
  "GOG-PRO-9F2K-7Q1M-4D8P",
  "GOG-PRO-A1B2-C3D4-E5F6",
  "GOG-PRO-Z9Y8-X7W6-V5U4",
];

/** Normalize user input into a consistent comparable form */
function normalizeKey(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "").replace(/_/g, "-");
}

/**
 * Light device-local hash (NOT crypto-security; just to avoid storing plain keys).
 * Enough for "one-time per device" lock.
 */
function djb2Hash(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  // convert to unsigned 32-bit
  return (h >>> 0).toString(16).padStart(8, "0");
}

function readRedeemedSet(): Record<string, true> {
  try {
    const raw = localStorage.getItem(REDEEMED_SET_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeRedeemedSet(obj: Record<string, true>) {
  localStorage.setItem(REDEEMED_SET_KEY, JSON.stringify(obj));
}

function saveRedeemUi(open: boolean) {
  try {
    localStorage.setItem(REDEEM_UI_KEY, JSON.stringify({ open }));
  } catch {}
}

function loadRedeemUi(): boolean {
  try {
    const raw = localStorage.getItem(REDEEM_UI_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return !!parsed?.open;
  } catch {
    return false;
  }
}

export default function SettingsPanel() {
  const hardcoreMode = useHunterStore((s: any) => !!s.hardcoreMode);
  const setHardcoreMode = useHunterStore((s: any) => s.setHardcoreMode);

  // PRO (defensive reads — works across builds)
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore((s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)) || false;

  // Defensive PRO setters (some builds have setPro, some only store persistence)
  const setPro = useHunterStore((s: any) => s.setPro || s.setIsPro || s.enablePro || null);

  const proEnabled = isPro || isProTest;

  const [tapCount, setTapCount] = useState(0);
  const [redeemOpen, setRedeemOpen] = useState<boolean>(() => loadRedeemUi());
  const [redeemKey, setRedeemKey] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<{ tone: "ok" | "bad" | "info"; text: string } | null>(null);

  const [aboutOpen, setAboutOpen] = useState<boolean>(() => loadAboutOpen());
  const [aboutMsg, setAboutMsg] = useState<{ tone: "ok" | "bad" | "info"; text: string } | null>(null);

  const redeemedCount = useMemo(() => {
    const set = readRedeemedSet();
    return Object.keys(set).length;
  }, []);

  const buildVersion = useMemo(() => tryGetBuildVersion(), []);
  const buildChannel = proEnabled ? "PRO / Tester" : "Free";
  const lastViewed = useMemo(() => nowIsoLocal(), []);

  const handleHeaderTap = () => {
    // Tap the "Settings" header 7 times to reveal (or hide) the Redeem section
    const next = tapCount + 1;
    if (next >= 7) {
      const open = !redeemOpen;
      setRedeemOpen(open);
      saveRedeemUi(open);
      setTapCount(0);
      setRedeemMsg({
        tone: "info",
        text: open ? "Redeem unlocked (hidden tester mode)." : "Redeem hidden.",
      });
      return;
    }
    setTapCount(next);
  };

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
    const { ua, platform, lang, w, h, tz } = getEnvInfo();

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
      `Build: ${buildVersion}`,
      `Channel: ${buildChannel}`,
      `Timezone: ${tz}`,
      `Platform: ${platform}`,
      `Language: ${lang}`,
      `Viewport: ${w} x ${h}`,
      `User Agent: ${ua}`,
      "",
      "Thank you!",
    ].join("\n");

    openMailto(subject, body);
  };

  const handleRedeem = () => {
    setRedeemMsg(null);

    const key = normalizeKey(redeemKey);
    if (!key) {
      setRedeemMsg({ tone: "bad", text: "Enter a key first." });
      return;
    }

    // basic format guard (keeps typos from feeling random)
    if (!key.startsWith("GOG-PRO-") || key.length < 12) {
      setRedeemMsg({ tone: "bad", text: "That key format looks wrong." });
      return;
    }

    const allowed = KEYRING.map(normalizeKey);
    const isValid = allowed.includes(key);

    if (!isValid) {
      setRedeemMsg({ tone: "bad", text: "Invalid key." });
      return;
    }

    // device-local lock
    const hash = djb2Hash(key);
    const set = readRedeemedSet();
    if (set[hash]) {
      setRedeemMsg({ tone: "bad", text: "This key was already redeemed on this device." });
      return;
    }

    // mark redeemed on device
    set[hash] = true;
    writeRedeemedSet(set);

    // enable PRO permanently on this device
    try {
      if (typeof setPro === "function") {
        setPro(true);
      } else {
        // last resort: try to set localStorage flag (store persistence usually reads it)
        localStorage.setItem("greatonegrind_force_pro_v1", "true");
      }
    } catch {}

    setRedeemKey("");
    setRedeemMsg({ tone: "ok", text: "PRO unlocked on this device ✅" });
  };

  const handleRedeemHide = () => {
    setRedeemOpen(false);
    saveRedeemUi(false);
    setRedeemMsg({ tone: "info", text: "Redeem hidden." });
    setTapCount(0);
  };

  const toggleAbout = () => {
    const next = !aboutOpen;
    setAboutOpen(next);
    saveAboutOpen(next);
    setAboutMsg(null);
  };

  const handleCopyDebug = async () => {
    setAboutMsg(null);
    const { ua, platform, lang, w, h, tz } = getEnvInfo();

    const text = [
      "Great One Grind — Debug Info",
      `Build: ${buildVersion}`,
      `Channel: ${buildChannel}`,
      `Viewed: ${nowIsoLocal()}`,
      `Timezone: ${tz}`,
      `Platform: ${platform}`,
      `Language: ${lang}`,
      `Viewport: ${w} x ${h}`,
      `User Agent: ${ua}`,
    ].join("\n");

    const ok = await copyToClipboard(text);
    setAboutMsg(ok ? { tone: "ok", text: "Copied debug info ✅" } : { tone: "bad", text: "Copy failed (browser blocked)." });
  };

  const handleEmailSupport = () => {
    const { ua, platform, lang, w, h, tz } = getEnvInfo();
    const subject = "Great One Grind — Support";
    const body = [
      "Describe your issue or feedback:",
      "",
      "",
      "---- Debug Info ----",
      `Build: ${buildVersion}`,
      `Channel: ${buildChannel}`,
      `Timezone: ${tz}`,
      `Platform: ${platform}`,
      `Language: ${lang}`,
      `Viewport: ${w} x ${h}`,
      `User Agent: ${ua}`,
    ].join("\n");

    openMailto(subject, body);
  };

  return (
    <div className="space-y-6 px-2">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold text-white select-none cursor-pointer"
          onClick={handleHeaderTap}
          title="(Tester) Tap 7x to toggle Redeem"
        >
          Settings
        </h2>

        <div className="flex items-center gap-2">
          {isPro ? <Pill tone="pro">PRO Active</Pill> : isProTest ? <Pill tone="info">PRO Test</Pill> : <Pill>Free</Pill>}
        </div>
      </div>

      {/* About / Version */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-white">About</div>

          <button
            type="button"
            onClick={toggleAbout}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
            title="Toggle About details"
          >
            {aboutOpen ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="info">Build: {buildVersion}</Pill>
          <Pill tone="info">{buildChannel}</Pill>
          <Pill tone="warn">Beta</Pill>
        </div>

        {aboutOpen ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
            <div className="text-xs text-white/75 space-y-1">
              <div>
                <span className="font-semibold text-white/85">App:</span> Great One Grind
              </div>
              <div>
                <span className="font-semibold text-white/85">Build:</span> {buildVersion}
              </div>
              <div>
                <span className="font-semibold text-white/85">Channel:</span> {buildChannel}
              </div>
              <div>
                <span className="font-semibold text-white/85">Last viewed:</span> {lastViewed}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyDebug}
                className="flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
              >
                Copy Debug Info
              </button>

              <button
                type="button"
                onClick={handleEmailSupport}
                className="flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
              >
                Email Support
              </button>
            </div>

            {aboutMsg ? (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  aboutMsg.tone === "ok"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    : aboutMsg.tone === "bad"
                    ? "border-red-500/30 bg-red-500/10 text-red-100"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-100"
                }`}
              >
                {aboutMsg.text}
              </div>
            ) : null}

            <div className="text-[11px] text-white/60">
              This page is <span className="font-semibold text-white/70">read-only</span>. Copy Debug helps fast bug reports.
            </div>
          </div>
        ) : null}
      </div>

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

      {/* Hidden: PRO Beta Key Redeem */}
      {redeemOpen ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-base font-semibold text-white">Tester: Redeem PRO Key</div>
              <div className="text-xs text-white/75">
                Hidden tester mode. Keys unlock PRO permanently on <span className="font-semibold">this device</span>.
              </div>
            </div>

            <button
              type="button"
              onClick={handleRedeemHide}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
              title="Hide this section"
            >
              Hide
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="text-xs text-white/70">
              Enter key (example format): <span className="font-mono text-white/85">GOG-PRO-XXXX-XXXX-XXXX</span>
            </div>

            <input
              className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/15 text-white font-mono text-sm"
              placeholder="GOG-PRO-...."
              value={redeemKey}
              onChange={(e) => setRedeemKey(e.target.value)}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRedeem}
                className="flex-1 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-sm text-white hover:bg-emerald-500/25"
              >
                Redeem
              </button>

              <button
                type="button"
                onClick={() => {
                  setRedeemKey("");
                  setRedeemMsg(null);
                }}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
              >
                Clear
              </button>
            </div>

            {redeemMsg ? (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  redeemMsg.tone === "ok"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    : redeemMsg.tone === "bad"
                    ? "border-red-500/30 bg-red-500/10 text-red-100"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-100"
                }`}
              >
                {redeemMsg.text}
              </div>
            ) : null}

            <div className="text-[11px] text-white/60">
              Device redeemed keys: <span className="font-semibold text-white/70">{redeemedCount}</span>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
            <span className="font-semibold text-white/80">Admin note:</span> Replace the placeholder KEYRING values before
            sharing keys.
          </div>
        </div>
      ) : null}

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
                <span className="font-semibold text-white/80">ON:</span> adds grinder-speed controls (+500/+1000, negatives,
                reset).
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

        <div className="text-xs text-white/60">Factory Reset clears all local app data on this device.</div>
      </div>
    </div>
  );
}
