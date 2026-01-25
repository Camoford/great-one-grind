import React, { useEffect, useState } from "react";

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

export default function App() {
  const [screen, setScreen] = useState<Screen>("grinds");

  // ✅ First-run onboarding gate (device-local)
  const [onboardingOpen, setOnboardingOpen] = useState(false);

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

  function closeOnboarding() {
    markOnboardingSeen();
    setOnboardingOpen(false);
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

            {/* ✅ RESTORED */}
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
