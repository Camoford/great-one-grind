// components/SettingsPanel.tsx
import React, { useState } from "react";
import AboutScreen from "../src/features/about/AboutScreen";

/**
 * Settings Panel
 * Phase 14D-2
 * - Adds About / Version entry
 * - UI-only
 * - No store/session mutation
 */

export default function SettingsPanel() {
  const [view, setView] = useState<"settings" | "about">("settings");

  if (view === "about") {
    return (
      <div>
        <div style={styles.topBar}>
          <button style={styles.back} onClick={() => setView("settings")}>
            ← Back
          </button>
        </div>
        <AboutScreen />
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.section}>
        <div style={styles.h}>Settings</div>
      </div>

      {/* EXISTING SETTINGS CONTENT REMAINS VISUAL-ONLY */}
      <div style={styles.section}>
        <button style={styles.btn} onClick={() => setView("about")}>
          About / Version
        </button>
      </div>

      <div style={styles.footer}>
        <div style={styles.muted}>Phase 14D • UI only</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 16,
    color: "#e5e7eb",
  },
  section: {
    marginBottom: 16,
  },
  h: {
    fontSize: 16,
    fontWeight: 800,
  },
  btn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontSize: 14,
    cursor: "pointer",
  },
  topBar: {
    padding: 12,
  },
  back: {
    background: "transparent",
    border: "none",
    color: "#93c5fd",
    fontSize: 14,
    cursor: "pointer",
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  muted: {
    fontSize: 12,
    opacity: 0.7,
  },
};
