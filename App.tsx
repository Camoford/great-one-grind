import React, { useEffect, useState } from "react";
import { useHunterStore } from "./store";

import GrindScreen from "./components/GrindScreen";
import GrindsList from "./components/GrindsList";
import QuickLog from "./components/QuickLog";
import StatsDashboard from "./components/StatsDashboard";
import TrophyRoom from "./components/TrophyRoom";
import SettingsPanel from "./components/SettingsPanel";
import BetaDisclaimerModal from "./components/BetaDisclaimerModal";

type Screen = "grinds" | "grind" | "quicklog" | "stats" | "trophy" | "settings";

const BETA_ACCEPT_KEY = "greatonegrind_beta_accepted_v1";

export default function App() {
  // Initialize Zustand store
  useHunterStore();

  const [screen, setScreen] = useState<Screen>("grinds");

  // Beta disclaimer gating
  const [betaAccepted, setBetaAccepted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(BETA_ACCEPT_KEY);
      setBetaAccepted(v === "1");
    } catch {
      // If storage fails, keep disclaimer on (safe default)
      setBetaAccepted(false);
    }
  }, []);

  function acceptBeta() {
    try {
      localStorage.setItem(BETA_ACCEPT_KEY, "1");
    } catch {
      // ignore
    }
    setBetaAccepted(true);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* One-time Beta Disclaimer */}
      {!betaAccepted && <BetaDisclaimerModal onAccept={acceptBeta} />}

      {/* Top Nav */}
      <div className="flex items-center justify-around border-b border-slate-700 p-2 text-xs">
        {/* Beta badge */}
        <div className="absolute left-2 top-2">
          <span className="text-[10px] font-semibold text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded">
            BETA
          </span>
        </div>

        <button onClick={() => setScreen("grinds")}>Grinds</button>
        <button onClick={() => setScreen("quicklog")}>Quick Log</button>
        <button onClick={() => setScreen("stats")}>Stats</button>
        <button onClick={() => setScreen("trophy")}>Trophy</button>
        <button onClick={() => setScreen("settings")}>Settings</button>
      </div>

      {/* Screens */}
      <div className="p-2">
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
