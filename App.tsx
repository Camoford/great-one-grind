import React, { useEffect, useState } from "react";
import { useHunterStore } from "./store";

import GrindScreen from "./components/GrindScreen";
import GrindsList from "./components/GrindsList";
import QuickLog from "./components/QuickLog";
import StatsDashboard from "./components/StatsDashboard";
import TrophyRoom from "./components/TrophyRoom";
import SettingsPanel from "./components/SettingsPanel";
import SessionHUD from "./components/SessionHUD";
import SessionSummaryModal from "./components/SessionSummaryModal";

type Screen = "grinds" | "grind" | "quicklog" | "stats" | "trophy" | "settings";

const LAST_SESSION_SUMMARY_KEY = "__session_summary_protected_v1";
const SESSION_SUMMARY_EVENT = "greatonegrind:session_summary_ready";

type SavedSummary = {
  kills: number;
  durationMs: number;
  createdAt: number;
};

export default function App() {
  useHunterStore();

  const [screen, setScreen] = useState<Screen>("grinds");

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryKills, setSummaryKills] = useState(0);
  const [summaryDurationMs, setSummaryDurationMs] = useState(0);

  const openSummary = () => {
    const raw = localStorage.getItem(LAST_SESSION_SUMMARY_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as SavedSummary;
    setSummaryKills(parsed.kills);
    setSummaryDurationMs(parsed.durationMs);
    setSummaryOpen(true);
  };

  const closeSummary = () => {
    setSummaryOpen(false);
    localStorage.removeItem(LAST_SESSION_SUMMARY_KEY);
  };

  useEffect(() => {
    window.addEventListener(SESSION_SUMMARY_EVENT, openSummary);
    openSummary();
    return () => {
      window.removeEventListener(SESSION_SUMMARY_EVENT, openSummary);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <SessionSummaryModal
        open={summaryOpen}
        onClose={closeSummary}
        kills={summaryKills}
        durationMs={summaryDurationMs}
      />

      <SessionHUD />

      <div className="mx-auto max-w-3xl px-2 pb-2">
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => setScreen("grinds")}>Grinds</button>
          <button onClick={() => setScreen("quicklog")}>Quick Log</button>
          <button onClick={() => setScreen("stats")}>Stats</button>
          <button onClick={() => setScreen("trophy")}>Trophies</button>
          <button onClick={() => setScreen("settings")}>Settings</button>
        </div>
      </div>

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
