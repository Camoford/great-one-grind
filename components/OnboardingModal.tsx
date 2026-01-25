// components/OnboardingModal.tsx
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ONBOARDING_SEEN_KEY = "greatonegrind_onboarding_v1_seen";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function getViewportMode() {
  try {
    const w = window.innerWidth || 9999;
    return w < 420 ? "compact" : "normal";
  } catch {
    return "normal";
  }
}

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
  } catch {
    // ignore
  }
}

export default function OnboardingModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [compact, setCompact] = useState(getViewportMode() === "compact");

  const steps = useMemo(
    () => [
      {
        title: "Welcome to Great One Grind",
        body: (
          <>
            <p className="text-sm text-slate-200/90 leading-relaxed">
              Built for grinders: fast taps, clean tracking, and zero fluff.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Bullet>Track kills per Great One species</Bullet>
              <Bullet>Quick Log + trophy “Obtained” flow</Bullet>
              <Bullet>Session History + Archive (read-only)</Bullet>
            </div>
          </>
        ),
      },
      {
        title: "How to use it (30 seconds)",
        body: (
          <>
            <div className="mt-1 grid grid-cols-1 gap-2">
              <Card
                title="1) Pick a species"
                text="Open Grinds and select your Great One species."
              />
              <Card
                title="2) Tap to count kills"
                text="Use the quick add buttons to keep your pace."
              />
              <Card
                title="3) When it happens…"
                text="Mark ‘Obtained’ to save a trophy snapshot and reset that grind."
              />
            </div>
            <p className="mt-3 text-xs text-slate-200/70">
              Tip: This app is designed to stay fast even during long grinds.
            </p>
          </>
        ),
      },
      {
        title: "Backups (recommended)",
        body: (
          <>
            <p className="text-sm text-slate-200/90 leading-relaxed">
              Your data is stored on this device. Use backups so you can restore after
              a reinstall or phone change.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Bullet>Export a backup from Settings</Bullet>
              <Bullet>Keep it somewhere safe (notes, drive, email)</Bullet>
              <Bullet>Restore anytime from Settings</Bullet>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-slate-200/70">
                PWA tip: If you installed the app, updates can refresh cached files.
                Your grind data stays safe — but backups are still the best protection.
              </p>
            </div>
          </>
        ),
      },
      {
        title: "You’re ready",
        body: (
          <>
            <p className="text-sm text-slate-200/90 leading-relaxed">
              Start a session, keep your pace, and let the grind do its thing.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Bullet>Use Session HUD to track time + pace</Bullet>
              <Bullet>Check Stats for lifetime progress</Bullet>
              <Bullet>Use History to review sessions (read-only)</Bullet>
            </div>
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
              <p className="text-xs text-emerald-100/90">
                Pro tip: Set a realistic target (500 / 1000) and grind in chunks.
              </p>
            </div>
          </>
        ),
      },
    ],
    []
  );

  const total = steps.length;
  const progress = clamp01(total <= 1 ? 1 : step / (total - 1));

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        safeClose();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (step < total - 1) setStep((s) => Math.min(total - 1, s + 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (step > 0) setStep((s) => Math.max(0, s - 1));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, total]);

  useEffect(() => {
    const onResize = () => setCompact(getViewportMode() === "compact");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  function safeClose() {
    markOnboardingSeen();
    onClose();
  }

  const s = steps[step];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Great One Grind Onboarding"
    >
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/70"
        aria-label="Close onboarding"
        onClick={safeClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        {/* header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white leading-tight">
                {s.title}
              </h2>
              <p className="mt-1 text-xs text-slate-200/70">
                Step {step + 1} of {total}
              </p>
            </div>

            <button
              onClick={safeClose}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 active:scale-[0.99]"
              aria-label="Close"
              title="Close (Esc)"
            >
              Close
            </button>
          </div>

          {/* progress */}
          <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/70"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {/* body */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            {s.body}
          </div>

          {/* controls */}
          <div className={`mt-4 flex items-center justify-between gap-2 ${compact ? "flex-col" : ""}`}>
            <button
              onClick={() => setStep((x) => Math.max(0, x - 1))}
              disabled={step === 0}
              className={`rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white
                ${step === 0 ? "opacity-40 cursor-not-allowed" : "bg-white/5 hover:bg-white/10 active:scale-[0.99]"}
                ${compact ? "w-full" : ""}`}
              aria-label="Previous"
              title="Previous (←)"
            >
              Back
            </button>

            <div className={`flex-1 ${compact ? "hidden" : ""}`} />

            {step < total - 1 ? (
              <button
                onClick={() => setStep((x) => Math.min(total - 1, x + 1))}
                className={`rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white/90 active:scale-[0.99]
                  ${compact ? "w-full" : ""}`}
                aria-label="Next"
                title="Next (→)"
              >
                Next
              </button>
            ) : (
              <button
                onClick={safeClose}
                className={`rounded-xl border border-emerald-400/30 bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 active:scale-[0.99]
                  ${compact ? "w-full" : ""}`}
                aria-label="Start grinding"
              >
                Start Grinding
              </button>
            )}
          </div>

          <p className="mt-3 text-[11px] text-slate-200/55">
            Keyboard: ← → to navigate, Esc to close.
          </p>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 h-2 w-2 rounded-full bg-white/70 shrink-0" />
      <div className="text-sm text-slate-200/90 leading-relaxed">{children}</div>
    </div>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs text-slate-200/75 leading-relaxed">{text}</div>
    </div>
  );
}
