// components/SettingsPanel.tsx
import React from "react";
import { useHunterStore } from "../store";

/**
 * SettingsPanel — Release polish
 *
 * UI-ONLY:
 * - Shows PRO status
 * - Adds "View Onboarding" button (reopens onboarding modal)
 * - No payments, no accounts
 * - No store writes (except whatever already exists elsewhere)
 */

const ONBOARDING_OPEN_EVENT = "greatonegrind_open_onboarding";

export default function SettingsPanel() {
  const isPro = useHunterStore((s) => s.isPro);

  function openOnboarding() {
    try {
      window.dispatchEvent(new Event(ONBOARDING_OPEN_EVENT));
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6 text-sm">
      {/* ---------------- PRO STATUS ---------------- */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">PRO Status</div>
            <div className="text-xs text-neutral-400">Beta access indicator</div>
          </div>

          {isPro ? (
            <span className="rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              ACTIVE
            </span>
          ) : (
            <span className="rounded-full bg-neutral-700 px-3 py-1 text-xs text-neutral-300">
              FREE
            </span>
          )}
        </div>

        {isPro ? (
          <div className="mt-3 text-xs text-neutral-400">
            Thanks for testing the PRO beta. Your access is enabled on this device.
          </div>
        ) : (
          <div className="mt-3 text-xs text-neutral-400">
            You’re on the free version on this device.
          </div>
        )}
      </div>

      {/* ---------------- HELP ---------------- */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-neutral-100">Help</div>
            <div className="mt-1 text-xs text-neutral-400">
              Re-open the quick start guide anytime.
            </div>
          </div>

          <button
            type="button"
            onClick={openOnboarding}
            className="shrink-0 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 active:scale-[0.99]"
          >
            View Onboarding
          </button>
        </div>
      </div>

      {/* ---------------- INFO ---------------- */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400">
        PRO features are enabled locally on this device.
        <br />
        Payments and accounts are intentionally disabled during beta.
      </div>
    </div>
  );
}
