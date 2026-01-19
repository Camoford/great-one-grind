// src/components/BetaDisclaimerModal.tsx
import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "gog_beta_disclaimer_ack_v1";

type Props = {
  forceOpen?: boolean;
  onClose?: () => void;
};

export default function BetaDisclaimerModal({
  forceOpen = false,
  onClose,
}: Props) {
  const [open, setOpen] = useState(false);

  const shouldAutoOpen = useMemo(() => {
    if (forceOpen) return true;
    try {
      return localStorage.getItem(STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  }, [forceOpen]);

  useEffect(() => {
    if (shouldAutoOpen) setOpen(true);
  }, [shouldAutoOpen]);

  function acknowledgeAndClose() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
    onClose?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-100">
            Beta Disclaimer
          </h2>
          <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300">
            BETA
          </span>
        </div>

        <p className="text-sm text-slate-300">
          This app is in beta. Data may change or reset between versions.
        </p>

        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>Always use Backup/Restore before updates.</li>
          <li>Reset may be required after big changes.</li>
          <li>Report bugs with screenshots + steps.</li>
        </ul>

        <div className="mt-5 flex justify-end">
          <button
            onClick={acknowledgeAndClose}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
