import React, { useState } from "react";
import { useHunterStore } from "./store";

import GrindScreen from "./components/GrindScreen";
import GrindsList from "./components/GrindsList";
import QuickLog from "./components/QuickLog";
import StatsDashboard from "./components/StatsDashboard";
import TrophyRoom from "./components/TrophyRoom";
import SettingsPanel from "./components/SettingsPanel";
import SessionHUD from "./components/SessionHUD";

type Screen = "grinds" | "grind" | "quicklog" | "stats" | "trophy" | "settings";

export default function App() {
  // Initialize Zustand store
  useHunterStore();

  const [screen, setScreen] = useState<Screen>("grinds");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* GLOBAL SESSION HUD — REQUIRED */}
      <SessionHUD />

      {/* Navigation */}
      <div className="mx-auto max-w-3xl px-2 pb-2">
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onClick={() => setScreen("grinds")}
          >
            Grinds
          </button>
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onClick={() => setScreen("quicklog")}
          >
            Quick Log
          </button>
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onClick={() => setScreen("stats")}
          >
            Stats
          </button>
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onClick={() => setScreen("trophy")}
          >
            Trophies
          </button>
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            onClick={() => setScreen("settings")}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Screens */}
      <div className="mx-auto max-w-3xl px-2 pb-10">
        {screen === "grinds" && <GrindsList />}
        {screen === "grind" && <GrindScreen />}
        {screen === "quicklog" && <QuickLog />}
        {screen === "stats" && <StatsDashboard />}
        {screen === "trophy" && <TrophyRoom />}
        {screen === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
