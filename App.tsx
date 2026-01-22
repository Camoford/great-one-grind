import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "./store";

import GrindScreen from "./components/GrindScreen";
import GrindsList from "./components/GrindsList";
import QuickLog from "./components/QuickLog";
import StatsDashboard from "./components/StatsDashboard";
import TrophyRoom from "./components/TrophyRoom";
import SettingsPanel from "./components/SettingsPanel";
import UpgradeScreen from "./components/UpgradeScreen";
import SessionHUD from "./components/SessionHUD";

type Screen =
  | "grinds"
  | "grind"
  | "quicklog"
  | "stats"
  | "trophy"
  | "settings"
  | "upgrade"
  | "archive";

/* ---------------- ROUTING HELPERS (HASH) ----------------
   - Refresh-safe
   - Deep-link-safe
   - Back/forward-safe
   - No external router dependency
--------------------------------------------------------- */

const ROUTE_ORDER: Screen[] = [
  "grinds",
  "quicklog",
  "stats",
  "trophy",
  "settings",
  "upgrade",
  "archive",
];

function normalizeHash(raw: string) {
  // Accept: "#/stats", "#stats", "/stats", "stats"
  const h = (raw || "").trim();
  if (!h) return "";

  let s = h;
  if (s.startsWith("#")) s = s.slice(1);
  s = s.trim();

  if (s.startsWith("/")) s = s.slice(1);
  s = s.trim();

  return s.toLowerCase();
}

function screenFromHash(hash: string): Screen {
  const s = normalizeHash(hash);

  // Default route
  if (!s) return "grinds";

  // Only allow known routes
  const match = ROUTE_ORDER.find((r) => r === (s as Screen));
  return match || "grinds";
}

function hashForScreen(screen: Screen) {
  return `#/${screen}`;
}

/* ---------------- UI ---------------- */

function NavButton({
  active,
  onClick,
  children,
  variant = "default",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "upgrade";
}) {
  const base =
    "rounded-lg border px-3 py-2 text-sm transition active:scale-[0.99]";
  const common =
    "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/20";
  const upgrade =
    "border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-400/40";

  const cls =
    variant === "upgrade"
      ? `${base} ${upgrade} ${active ? "ring-1 ring-emerald-400/30" : ""}`
      : `${base} ${common} ${active ? "ring-1 ring-white/20" : ""}`;

  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}

function ArchivePlaceholder() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-lg font-semibold">Archive</div>
      <div className="mt-2 text-sm text-white/70">
        Routing is now ready for Archive (deep links + refresh + back/forward).
        <br />
        Nav exposure and real Archive screen wiring comes in <b>Phase 7C</b>.
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/60">
        Tip: You can already open this route by URL:
        <div className="mt-1 font-mono text-white/80">#/archive</div>
      </div>
    </div>
  );
}

export default function App() {
  // Initialize Zustand store (side-effect safe)
  useHunterStore();

  // Initialize screen from URL hash (refresh-safe)
  const initialScreen = useMemo<Screen>(() => {
    return screenFromHash(window.location.hash);
  }, []);

  const [screen, setScreen] = useState<Screen>(initialScreen);

  // Keep state in sync with URL hash (back/forward + manual edits)
  useEffect(() => {
    const syncFromHash = () => {
      const next = screenFromHash(window.location.hash);
      setScreen((prev) => (prev === next ? prev : next));
    };

    window.addEventListener("hashchange", syncFromHash);
    // Some browsers fire popstate with hash navigation too; harmless if redundant
    window.addEventListener("popstate", syncFromHash);

    // On mount, also normalize any weird hash formats
    syncFromHash();

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  // Whenever app changes screen (button click), push it into the URL hash
  useEffect(() => {
    const desired = hashForScreen(screen);
    if (window.location.hash !== desired) {
      window.location.hash = desired;
    }
  }, [screen]);

  /**
   * ESC behavior
   * - If on Settings or Upgrade, ESC returns to Grinds
   * - Do NOT hijack ESC while typing in inputs/textareas/contenteditable
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase() || "";
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (el && el.getAttribute("contenteditable") === "true");

      if (isTyping) return;

      if (screen === "settings" || screen === "upgrade") {
        e.preventDefault();
        setScreen("grinds");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* GLOBAL SESSION HUD — REQUIRED */}
      <SessionHUD />

      {/* Navigation */}
      <div className="mx-auto max-w-3xl px-2 pb-2">
        <div className="mt-2 flex flex-wrap gap-2">
          <NavButton active={screen === "grinds"} onClick={() => setScreen("grinds")}>
            Grinds
          </NavButton>

          <NavButton
            active={screen === "quicklog"}
            onClick={() => setScreen("quicklog")}
          >
            Quick Log
          </NavButton>

          <NavButton active={screen === "stats"} onClick={() => setScreen("stats")}>
            Stats
          </NavButton>

          <NavButton
            active={screen === "trophy"}
            onClick={() => setScreen("trophy")}
          >
            Trophies
          </NavButton>

          <NavButton
            active={screen === "settings"}
            onClick={() => setScreen("settings")}
          >
            Settings
          </NavButton>

          <NavButton
            variant="upgrade"
            active={screen === "upgrade"}
            onClick={() => setScreen("upgrade")}
          >
            Upgrade
          </NavButton>

          {/* NOTE: Archive intentionally NOT exposed in nav yet (Phase 7C) */}
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
        {screen === "upgrade" && <UpgradeScreen />}

        {/* Hidden route ready for Phase 7C wiring */}
        {screen === "archive" && <ArchivePlaceholder />}
      </div>
    </div>
  );
}
