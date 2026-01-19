import React from "react";

type Props = {
  onAccept: () => void;
};

export default function BetaDisclaimerModal({ onAccept }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Beta Disclaimer</h2>
          <span className="text-xs font-semibold text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded">
            BETA
          </span>
        </div>

        <div className="text-sm text-slate-300 space-y-2">
          <p>
            This app is currently in <strong>beta</strong>. It is an early-access
            product and may contain bugs, incomplete features, or unexpected
            behavior.
          </p>

          <p>
            Features and data may change or reset between versions as the app
            improves.
          </p>

          <p>
            Purchases made during beta are <strong>non-refundable</strong>.
          </p>

          <p>
            By continuing, you acknowledge and accept these conditions.
          </p>
        </div>

        <button
          onClick={onAccept}
          className="w-full px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-sm"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
