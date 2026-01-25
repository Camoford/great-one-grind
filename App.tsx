import React, { useEffect, useMemo, useState } from "react";

import GrindsList from "./components/GrindsList";
import StatsDashboard from "./components/StatsDashboard";
import SettingsModal from "./components/SettingsModal";
import UpgradeScreen from "./components/UpgradeScreen";
import SessionHistoryScreen from "./components/SessionHistoryScreen";
import TrophyRoom from "./components/TrophyRoom";

// ✅ Onboarding (first-run, UI-only)
import OnboardingModal, {
  hasSeenOnboarding,
  markOnboardingSeen,
} from "./components/OnboardingModal";

// ✅ ALWAYS mounted at root so it can listen for session end
import SessionSummaryModal from "./components/SessionSummaryModal";

type Screen =
  | "grinds"
  | "stats"
  | "history"
  | "trophies"
  | "settings"
  | "upgrade";

/* ---------------- PWA Install Hint (UI-only) ---------------- */

const INSTALL_HINT_DISMISSED_KEY = "gog_install_hint_dismissed_v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isProbablyIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac; this helps a bit:
    (ua.includes("Mac") && "ontouchend" in document);
  return !!iOS;
}

function isInStandaloneMode(): boolean {
  // iOS Safari supports navigator.standalone
  // PWA / Chromium supports display-mode media query
  try {
    const nav: any = navigator as any;
    if (typeof nav?.standalone === "boolean") return nav.standalone;
    return window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ */

export default function App() {
  const [screen, setScreen] = useState<Screen>("grinds");

  // ✅ First-run onboarding gate (device-local)
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // ✅ PWA install hint (shown once per device)
  const [installHintOpen, setInstallHintOpen] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  const ios = useMemo(() => isProbablyIOS(), []);
  const standalone = useMemo(() => {
    // This is safe to compute on mount only (no SSR here)
    try {
      return isInStandaloneMode();
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Only show onboarding once per device
    try {
      if (!hasSeenOnboarding()) {
        setOnboardingOpen(true);
      }
    } catch {
      // If localStorage blocked, just don't show it
      setOnboardingOpen(false);
    }
  }, []);

  useEffect(() => {
    // Capture install prompt when available (Chrome/Edge/Android)
    const handler = (e: Event) => {
      // Prevent browser from showing the mini-infobar; we will show our own
      e.preventDefault?.();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  useEffect(() => {
    // Show install hint ONCE per device, only if not already installed/standalone
    try {
      if (standalone) return;

      const dismissed = localStorage.getItem(INSTALL_HINT_DISMISSED_KEY);
      if (dismissed === "1") return;

      // Delay slightly so it doesn't fight with first-run onboarding
      const t = window.setTimeout(() => {
        setInstallHintOpen(true);
      }, 700);

      return () => window.clearTimeout(t);
    } catch {
      // If localStorage blocked, don't show
      setInstallHintOpen(false);
    }
  }, [standalone]);

  function closeOnboarding() {
    markOnboardingSeen();
    setOnboardingOpen(false);
  }

  function dismissInstallHint() {
    try {
      localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
    setInstallHelpOpen(false);
    setInstallHintOpen(false);
  }

  async function doInstallPrompt() {
    if (!installEvt) {
      // No native prompt available (iOS / some browsers). Show help panel.
      setInstallHelpOpen(true);
      return;
    }

    try {
      await installEvt.prompt();
      const choice = await installEvt.userChoice;

      // Regardless of accepted/dismissed, we can hide the banner for now
      // If they dismissed, they can still re-open instructions via "How"
      // We keep it "shown once" to avoid nagging.
      dismissInstallHint();

      // If accepted, the app will likely enter standalone next launch.
      // No further action needed.
      void choice;
    } catch {
      // If prompt fails, just show help
      setInstallHelpOpen(true);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header / Tabs */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold tracking-wide">
              Great One Grind
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setScreen("grinds")}
              className={`rounded-lg px-3 py-1 text-sm ${
                screen === "grinds"
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              Grinds
            </button>

            <button
              onClick={() => setScreen("stats")}
              className={`rounded-lg px-3 py-1 text-sm ${
                screen === "stats"
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              Stats
            </button>

            <button
              onClick={() => setScreen("history")}
              className={`rounded-lg px-3 py-1 text-sm ${
                screen === "history"
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              History
            </button>

            <button
              onClick={() => setScreen("trophies")}
              className={`rounded-lg px-3 py-1 text-sm ${
                screen === "trophies"
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              Trophies
            </button>

            <button
              onClick={() => setScreen("settings")}
              className={`rounded-lg px-3 py-1 text-sm ${
                screen === "settings"
                  ? "bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              Settings
            </button>

            <button
              onClick={() => setScreen("upgrade")}
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                screen === "upgrade"
                  ? "bg-amber-400 text-black"
                  : "bg-amber-500 text-black hover:bg-amber-400"
              }`}
            >
              PRO
            </button>
          </nav>
        </div>

        {/* ✅ PWA Install Hint (shown once, UI-only) */}
        {installHintOpen && !standalone && (
          <div className="border-t border-white/10 bg-zinc-950">
            <div className="mx-auto max-w-5xl px-4 py-3">
              <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm leading-snug text-zinc-100">
                  <span className="font-semibold">Tip:</span>{" "}
                  Install <span className="font-semibold">Great One Grind</span>{" "}
                  for faster access (works like a real app).
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={doInstallPrompt}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-amber-400"
                  >
                    Install
                  </button>

                  <button
                    onClick={() => setInstallHelpOpen((v) => !v)}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                  >
                    How
                  </button>

                  <button
                    onClick={dismissInstallHint}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {installHelpOpen && (
                <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950 p-3 text-sm text-zinc-200">
                  {!ios && (
                    <div className="space-y-2">
                      <div className="font-semibold text-zinc-100">
                        Install on Chrome / Edge (recommended)
                      </div>
                      <ul className="list-disc space-y-1 pl-5 text-zinc-200">
                        <li>
                          Click <span className="font-semibold">Install</span>{" "}
                          above (if available), or
                        </li>
                        <li>
                          Use the browser menu →{" "}
                          <span className="font-semibold">
                            Install app / Add to Home Screen
                          </span>
                        </li>
                      </ul>
                      <div className="text-xs text-zinc-400">
                        If you don’t see an install option, your browser may not
                        support it — you can still pin the tab.
                      </div>
                    </div>
                  )}

                  {ios && (
                    <div className="space-y-2">
                      <div className="font-semibold text-zinc-100">
                        Install on iPhone / iPad (Safari)
                      </div>
                      <ul className="list-disc space-y-1 pl-5 text-zinc-200">
                        <li>
                          Tap the{" "}
                          <span className="font-semibold">Share</span> button
                        </li>
                        <li>
                          Choose{" "}
                          <span className="font-semibold">Add to Home Screen</span>
                        </li>
                      </ul>
                      <div className="text-xs text-zinc-400">
                        iOS doesn’t show the install prompt button like Android —
                        the Home Screen method is the correct way.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {screen === "grinds" && <GrindsList />}
        {screen === "stats" && <StatsDashboard />}
        {screen === "history" && <SessionHistoryScreen />}
        {screen === "trophies" && <TrophyRoom />}
        {screen === "upgrade" && <UpgradeScreen />}
      </main>

      {/* ✅ Settings is a modal overlay */}
      <SettingsModal
        isOpen={screen === "settings"}
        onClose={() => setScreen("grinds")}
      />

      {/* ✅ First-run onboarding (UI-only) */}
      <OnboardingModal isOpen={onboardingOpen} onClose={closeOnboarding} />

      {/* ✅ Session Summary MUST live at App root */}
      <SessionSummaryModal />
    </div>
  );
}
