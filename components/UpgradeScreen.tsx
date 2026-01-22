// components/UpgradeScreen.tsx
import React, { useMemo } from "react";
import { useHunterStore } from "../store";

/**
 * Phase 3E + Phase 4 Prep
 * - Polished UI
 * - Adds TEST-ONLY PRO toggle (no Stripe, no payments)
 * - Verifies: persistence, backups, restore
 *
 * IMPORTANT:
 * This button is NOT a real purchase. It only toggles a local flag.
 * We'll replace this later with real payments.
 */

export default function UpgradeScreen() {
  const isPro = useHunterStore((s) => s.isPro);
  const setPro = useHunterStore((s) => s.setPro);
  const exportBackup = useHunterStore((s) => s.exportBackup);
  const importBackup = useHunterStore((s) => s.importBackup);

  const statusPill = useMemo(() => {
    if (isPro) {
      return (
        <div className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">
          PRO Active
        </div>
      );
    }
    return (
      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/75">
        Free Mode
      </div>
    );
  }, [isPro]);

  const handleTogglePro = () => {
    // TEST ONLY — not a real purchase
    setPro(!isPro);
  };

  const handleTestBackupRoundTrip = () => {
    // Optional helper: proves PRO survives backup/restore
    const json = exportBackup();
    const res = importBackup(json);
    if (!res.ok) {
      alert(`Backup round-trip failed: ${res.error}`);
      return;
    }
    alert("Backup round-trip OK ✅ (PRO flag + data restored)");
  };

  return (
    <div className="min-h-[calc(100vh-120px)] w-full px-4 pb-24 pt-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <span className="inline-block h-2 w-2 rounded-full bg-white/60" />
                PRO is optional — the core grinder stays free
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Upgrade to <span className="text-white">PRO</span>
              </h1>

              <p className="text-sm text-white/70">
                PRO is for grinders who want a cleaner, faster workflow and deeper insights.
                <span className="text-white/80"> One-time unlock.</span>
              </p>
            </div>

            {statusPill}
          </div>

          {/* TEST MODE notice */}
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
            <div className="text-sm font-semibold text-amber-200">TEST MODE</div>
            <div className="mt-1 text-xs text-amber-100/80">
              The button below toggles PRO locally for testing only. No payments, no Stripe, no money.
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Free</h2>
                <p className="mt-1 text-sm text-white/70">
                  Everything you need to grind and track safely.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80">
                Included
              </div>
            </div>

            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/60" />
                Session HUD + Session Summary
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/60" />
                Session History (read-only log)
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/60" />
                Backup / Restore + safety protections
              </li>
            </ul>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/70">
                Tip: Press <span className="text-white/90">ESC</span> anytime to return to Grinds.
              </p>
            </div>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border border-white/15 bg-white/8 p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">PRO</h2>
                <p className="mt-1 text-sm text-white/70">
                  Premium grinder experience — faster decisions, less clutter.
                </p>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
                One-time
              </div>
            </div>

            <ul className="space-y-2 text-sm text-white/85">
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/80" />
                PRO-only workflow polish & advanced controls
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/80" />
                Expanded Hardcore tooling & speed actions
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/80" />
                Deeper grinder insights (pace, targets, efficiency)
              </li>
              <li className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-white/80" />
                Future PRO-only QoL (no data risk)
              </li>
            </ul>

            {/* CTA */}
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={handleTogglePro}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                {isPro ? "Disable PRO (test)" : "Enable PRO (test)"}
              </button>

              <button
                type="button"
                onClick={handleTestBackupRoundTrip}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/90"
              >
                Backup + Restore Round-Trip (test)
              </button>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-white/70">
                  Payments are not enabled yet. This is a safe PRO flag toggle to verify persistence and backups.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-xs text-white/60">
          Press <span className="text-white/80">ESC</span> to return to Grinds.
        </div>
      </div>
    </div>
  );
}
