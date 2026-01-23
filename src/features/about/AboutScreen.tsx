// src/features/about/AboutScreen.tsx
import React from "react";

/**
 * AboutScreen — READ-ONLY
 * UI-only informational screen rendered inside SettingsModal
 *
 * Phase 16C-C2:
 * - Visual polish to match Settings + Grinds
 * - Mobile-friendly spacing
 * - No logic, no store access, no side effects
 */

export default function AboutScreen() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="text-lg font-semibold text-white/90">About Great One Grind</div>
        <div className="mt-1 text-[12px] text-white/60">
          Version 1.0 • Built for grinders
        </div>
      </div>

      {/* What this is */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm font-semibold text-white/85">
          What this app does
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          Great One Grind is a tracker and grinder companion for
          <span className="font-medium text-white/90"> The Hunter: Call of the Wild</span>.
          It helps you track kills, sessions, milestones, and Great One progress
          without changing the game or interfering with gameplay.
        </p>
      </section>

      {/* Philosophy */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm font-semibold text-white/85">
          Design philosophy
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          This app is intentionally simple, fast, and grinder-focused.
          There are no forced accounts, no ads, and no RNG manipulation.
          Everything you see is calculated from your own hunting sessions.
        </p>
      </section>

      {/* PRO note */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm font-semibold text-white/85">
          About PRO
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          PRO features in this build are UI-only and test-mode enabled.
          No payments are active and no purchases are required.
          Future monetization, if added, will never affect core grinding features.
        </p>
      </section>

      {/* Disclaimer */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm font-semibold text-white/85">
          Disclaimer
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          Great One Grind is a fan-made companion app.
          It is not affiliated with or endorsed by Avalanche Studios
          or Expansive Worlds.
        </p>
      </section>

      {/* Footer */}
      <div className="pt-2 text-center text-[11px] text-white/50">
        Built by grinders, for grinders.
      </div>
    </div>
  );
}
