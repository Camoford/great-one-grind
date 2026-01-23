import React, { useState } from "react";
import GrindsList from "./components/GrindsList";
import SettingsModal from "./components/SettingsModal";
import UpgradeScreen from "./components/UpgradeScreen";
import StatsDashboard from "./components/StatsDashboard";

export default function App() {
  const [screen, setScreen] = useState<
    "grinds" | "stats" | "settings" | "upgrade"
  >("grinds");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-wide">
            Great One Grind
          </h1>

          <nav className="flex gap-2">
            <button
              onClick={() => setScreen("grinds")}
              className="rounded px-3 py-1 text-sm hover:bg-zinc-800"
            >
              Grinds
            </button>
            <button
              onClick={() => setScreen("stats")}
              className="rounded px-3 py-1 text-sm hover:bg-zinc-800"
            >
              Stats
            </button>
            <button
              onClick={() => setScreen("settings")}
              className="rounded px-3 py-1 text-sm hover:bg-zinc-800"
            >
              Settings
            </button>
            <button
              onClick={() => setScreen("upgrade")}
              className="rounded bg-amber-600 px-3 py-1 text-sm font-medium text-black hover:bg-amber-500"
            >
              PRO
            </button>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {screen === "grinds" && <GrindsList />}
        {screen === "stats" && <StatsDashboard />}
        {screen === "settings" && <SettingsModal onClose={() => setScreen("grinds")} />}
        {screen === "upgrade" && <UpgradeScreen />}
      </main>
    </div>
  );
}
