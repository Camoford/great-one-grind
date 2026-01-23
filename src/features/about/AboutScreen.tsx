// src/features/about/AboutScreen.tsx
import React from "react";

/**
 * About Screen (Phase 14D)
 * - Read-only
 * - No store access
 * - No mutations
 * - Safe for publish prep
 */

export default function AboutScreen() {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Great One Grind</div>
            <div style={styles.sub}>v1.0 (ship-ready)</div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.h}>What this app is</div>
          <div style={styles.p}>
            Great One Grind is a grinder-first companion for <b>The Hunter: Call of the Wild</b>. It helps you track
            kills, sessions, milestones, and trophies — with backups so your grind data stays safe.
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.h}>PRO (optional)</div>
          <div style={styles.p}>
            PRO features are <b>optional</b>. In this build, PRO is <b>test-only</b> — there are <b>no payments</b>,{" "}
            <b>no Stripe</b>, and <b>no purchases</b>.
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.h}>Data safety</div>
          <div style={styles.p}>
            Use <b>Export Backup</b> to save your data and <b>Restore</b> to recover it. This app is designed to avoid
            silent resets and protect your progress.
          </div>
        </div>

        <div style={styles.footer}>
          <div style={styles.muted}>Publish Prep • Phase 14D • Read-only screen</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    padding: 16,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    background: "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)",
    color: "#e5e7eb",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 16,
    padding: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 0.2,
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.85,
  },
  section: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.10)",
  },
  h: {
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 8,
  },
  p: {
    fontSize: 14,
    lineHeight: 1.55,
    opacity: 0.95,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.10)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  muted: {
    fontSize: 12,
    opacity: 0.7,
  },
};
