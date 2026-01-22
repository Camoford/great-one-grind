import React from "react";

export default function UpgradeScreen() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">Upgrade to PRO</h2>
        <p className="mt-1 text-sm text-white/70">
          For grinders who track everything.
        </p>
      </div>

      {/* FREE */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
        <div className="text-base font-semibold mb-2">FREE (Always)</div>
        <ul className="space-y-1 text-sm text-white/80">
          <li>• Grinds & Quick Log</li>
          <li>• Sessions & Hardcore Mode</li>
          <li>• Trophy Room</li>
          <li>• Basic stats</li>
        </ul>
        <div className="mt-3 text-xs text-white/60">
          Core grinding features will never be locked.
        </div>
      </div>

      {/* PRO */}
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">PRO</div>
          <div className="text-sm font-semibold text-emerald-300">$4.99 one-time</div>
        </div>

        <ul className="mt-3 space-y-2 text-sm text-white/85">
          <li>
            <span className="font-medium">RNG Reality Check</span>
            <div className="text-xs text-white/60">
              Total kills, sessions, dry streaks, and time invested. No predictions.
            </div>
          </li>

          <li>
            <span className="font-medium">Advanced Grinder Stats</span>
            <div className="text-xs text-white/60">
              Kills/hour trends, efficiency, long-term performance.
            </div>
          </li>

          <li>
            <span className="font-medium">Unlimited Session History</span>
            <div className="text-xs text-white/60">
              Free keeps last 20. PRO keeps everything.
            </div>
          </li>

          <li>
            <span className="font-medium">Custom Milestones</span>
          </li>

          <li>
            <span className="font-medium">Export Data</span>
            <div className="text-xs text-white/60">CSV / JSON</div>
          </li>
        </ul>

        <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          ⚠️ RNG Notice: Great Ones are fully random. PRO features do not predict,
          influence, or guarantee outcomes.
        </div>

        <button
          disabled
          className="mt-4 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/70 cursor-not-allowed"
        >
          Upgrade Coming Soon
        </button>
      </div>
    </div>
  );
}
