import React, { useState } from "react";
import { useHunterStore } from "./store";

/* Screens */
import GrindsList from "./components/GrindsList";
import GrindScreen from "./components/GrindScreen";
import QuickLog from "./components/QuickLog";
import StatsDashboard from "./components/StatsDashboard";
import TrophyRoom from "./components/TrophyRoom";
import SettingsPanel from "./components/SettingsPanel";

/* Session History (components folder) */
import SessionHistoryScreen from "./components/SessionHistoryScreen";

/* P3 Session Summary Modal — DO NOT MOVE */
import SessionSummaryModal from "./components/SessionSummaryModal";

/* ---------------- Types ---------------- */

type Screen =
  | "grinds"
  | "grind"
  | "quicklog"
  | "stats"
  | "trophy"
  | "history"
  | "settings";

/* ---------------- App ---------------- */

export default function App() {
  // Initialize store (persistence, self-heal, sessions)
  useHunterStore();

  const [screen, setScreen] = useState<Screen>("grinds");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ---------- Header ---------- */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <h1 className="text-lg font-semibold tracking-tight">
          Great One Grind
        </h1>

        <button
          onClick={() => setScreen("settings")}
          className="text-sm text-slate-300 hover:text-white"
        >
          Settings
        </button>
      </header>

      {/* ---------- Screen Body ---------- */}
      <main className="flex-1 overflow-y-auto px-2 py-3">
        {screen === "grinds" && (
          <GrindsList onOpenGrind={() => setScreen("grind")} />
        )}

        {screen === "grind" && (
          <GrindScreen onBack={() => setScreen("grinds")} />
        )}

        {screen === "quicklog" && (
          <QuickLog onBack={() => setScreen("grinds")} />
        )}

        {screen === "stats" && <StatsDashboard />}

        {screen === "trophy" && <TrophyRoom />}

        {screen === "history" && <SessionHistoryScreen />}

        {screen === "settings" && (
          <SettingsPanel onBack={() => setScreen("grinds")} />
        )}
      </main>

      {/* ---------- Bottom Navigation ---------- */}
      <nav className="grid grid-cols-5 gap-1 border-t border-slate-800 px-2 py-2 text-xs">
        <button
          onClick={() => setScreen("grinds")}
          className={navClass(screen === "grinds")}
        >
          Grinds
        </button>

        <button
          onClick={() => setScreen("quicklog")}
          className={navClass(screen === "quicklog")}
        >
          Quick Log
        </button>

        <button
          onClick={() => setScreen("stats")}
          className={navClass(screen === "stats")}
        >
          Stats
        </button>

        <button
          onClick={() => setScreen("trophy")}
          className={navClass(screen === "trophy")}
        >
          Trophies
        </button>

        <button
          onClick={() => setScreen("history")}
          className={navClass(screen === "history")}
        >
          History
        </button>
      </nav>

      {/* ---------- P3 Session Summary Modal ---------- */}
      {/* MUST remain mounted at App root */}
      <SessionSummaryModal />
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function navClass(active: boolean) {
  return `
    rounded-md py-2
    ${active ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400"}
    hover:bg-slate-700
  `;
}
