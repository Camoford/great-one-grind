// components/SettingsPanel.tsx
import React from "react";
import { useHunterStore } from "../store";

/**
 * SettingsPanel — Phase 18 PRO Validation
 *
 * UI-ONLY changes:
 * - Clear PRO status indicator
 * - No toggles
 * - No revoke
 * - No payments
 * - No logic changes
 */

export default function SettingsPanel() {
  const isPro = useHunterStore((s) => s.isPro);

  return (
    <div className="space-y-6 text-sm">
      {/* ---------------- PRO STATUS ---------------- */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">PRO Status</div>
            <div className="text-xs text-neutral-400">
              Beta access indicator
            </div>
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

        {isPro && (
          <div className="mt-3 text-xs text-neutral-400">
            Thanks for testing the PRO beta. Your access is enabled on this
            device.
          </div>
        )}
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
