// src/SettingsModal.tsx
import React, { useMemo, useState } from "react";
import BetaDisclaimerModal from "./BetaDisclaimerModal";
import { resetAppDataAndReload } from "./utils/resetAppData";
import { APP_VERSION, IS_BETA } from "./constants/app";

type Props = {
  onClose?: () => void;
};

export default function SettingsModal({ onClose }: Props) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const feedbackHref = useMemo(() => {
    const subject = encodeURIComponent("Great One Grind Feedback");
    const body = encodeURIComponent(
      `Version: ${APP_VERSION}\nBuild: ${IS_BETA ? "beta" : "release"}\n\nWhat happened?\n\nSteps to reproduce:\n1)\n2)\n3)\n\nExpected:\n\nActual:\n`
    );

    // Change this email anytime you want
    const to = "everydaylife9960@gmail.com";
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }, []);

  return (
    <div className="w-full">
      {showDisclaimer && (
        <BetaDisclaimerModal
          forceOpen
          onClose={() => setShowDisclaimer(false)}
        />
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Settings</h2>
          <p className="mt-1 text-sm text-slate-400">
            {IS_BETA ? "This app is in " : ""}
            <span className="font-semibold text-amber-300">{APP_VERSION}</span>
            {IS_BETA ? ". Data may reset between versions." : ""}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
          >
            Close
          </button>
        )}
      </div>

      {/* Send Feedback (kept) */}
      <a
        href={feedbackHref}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm font-semibold text-slate-100 hover:bg-white/5"
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-white/30 bg-white/10" />
          Send Feedback
        </span>
      </a>

      <p className="mb-6 text-xs text-slate-500">
        Tapping “Send Feedback” opens your email app with a pre-filled template.
      </p>

      <div className="space-y-3">
        {/* View Beta Disclaimer Again */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Beta Disclaimer
              </div>
              <div className="mt-1 text-xs text-slate-400">
                View the beta disclaimer modal again.
              </div>
            </div>

            <button
              onClick={() => setShowDisclaimer(true)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10"
            >
              View Again
            </button>
          </div>
        </div>

        {/* Reset App Data */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Reset App Data
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Clears local data (grinds, stats, trophies) and reloads the app.
                Use Backup first if you want to keep data.
              </div>
            </div>

            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
              >
                Reset
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => resetAppDataAndReload()}
                  className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-400"
                >
                  Yes, Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
