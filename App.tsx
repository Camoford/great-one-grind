// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import GrindsList from "./components/GrindsList";
import TrophyRoom from "./components/TrophyRoom";
import SettingsPanel from "./components/SettingsPanel";

import BetaDisclaimerModal from "./components/BetaDisclaimerModal";
import { APP_VERSION, IS_BETA } from "./constants";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Top Nav */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-100">
                Great One Grind
              </h1>

              {IS_BETA && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-300">
                  BETA
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400">{APP_VERSION}</div>
          </div>
        </header>

        {/* Global Beta Disclaimer */}
        <BetaDisclaimerModal />

        {/* App Routes */}
        <main className="mx-auto max-w-5xl px-2 pb-20 pt-2">
          <Routes>
            <Route path="/" element={<GrindsList />} />
            <Route path="/trophies" element={<TrophyRoom />} />
            <Route path="/settings" element={<SettingsPanel />} />
            <Route path="*" element={<GrindsList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
