// components/SettingsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import SettingsPanel from "./SettingsPanel";
import AboutScreen from "../src/features/about/AboutScreen";
import { useHunterStore } from "../store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal — UI wrapper only (READ-ONLY)
 * - Clean, grinder-friendly layout
 * - ESC closes
 * - Backdrop click closes
 * - Scroll-safe on small screens
 *
 * Phase 16C-C1 (UI polish):
 * - Fixes encoding artifacts by using plain text / safe chars
 * - Slight layout polish + mobile-safe sizing
 *
 * IMPORTANT:
 * - No store/session mutations live here
 * - Safe to change without touching persistence/session/history
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [view, setView] = useState<"settings" | "about" | "howto">("settings");

  // Read-only flags (defensive)
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) =>
        !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;

  const proEnabled = useMemo(() => isPro || isProTest, [isPro, isProTest]);

  useEffect(() => {
    if (!isOpen) return;

    // Always reset to Settings when opening (prevents "stuck" views)
    setView("settings");

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtitle =
    view === "about"
      ? "About • v1.0 • Read-only"
      : view === "howto"
      ? "How to Use • Read-only help"
      : proEnabled
      ? "Settings - PRO features unlocked"
      : "Settings - PRO features locked (no payments enabled)";

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative z-[310] flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-white/90">
                  Great One Grind
                </div>

                {proEnabled ? (
                  <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">
                    PRO{isProTest ? " TEST" : ""}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">
                    FREE
                  </span>
                )}
              </div>

              <div className="mt-0.5 text-[11px] text-white/60">{subtitle}</div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {view !== "settings" ? (
                <button
                  type="button"
                  onClick={() => setView("settings")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                  aria-label="Back to Settings"
                  title="Back to Settings"
                >
                  Back
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setView("howto")}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                    aria-label="How to Use"
                    title="How to Use"
                  >
                    Help
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("about")}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                    aria-label="About"
                    title="About"
                  >
                    About
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                aria-label="Close"
                title="Close"
              >
                X
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[75vh] overflow-y-auto px-4 py-4">
            {view === "about" ? (
              <AboutScreen />
            ) : view === "howto" ? (
              <HowToUse />
            ) : (
              <SettingsPanel />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-white/50">
                Tip: Press <span className="text-white/70">ESC</span> to close.
              </div>

              {view === "about" ? (
                <div className="text-[11px] text-white/60">About is read-only.</div>
              ) : view === "howto" ? (
                <div className="text-[11px] text-white/60">Help is read-only.</div>
              ) : !proEnabled ? (
                <div className="text-[11px] text-white/60">PRO is UI-only in this build.</div>
              ) : (
                <div className="text-[11px] text-white/60">Thanks for supporting the grind.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HowToUse — READ-ONLY help content
 * - No hooks that mutate store
 * - No timers
 * - No logic changes
 */
function HowToUse() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white/90">How to Use This App</div>
        <div className="mt-1 text-xs text-white/70">
          Simple guide for the full app. Nothing here changes your data.
        </div>
      </div>

      <Section title="What this app does">
        <Bullets
          items={[
            "Tracks grind kill counts by animal.",
            "Lets you log fur types and trophies.",
            "Tracks hunt sessions and shows session totals.",
            "Lets you export/import a backup so you do not lose progress.",
            "No accounts. No online sync. Data stays on your device.",
          ]}
        />
      </Section>

      <Section title="Tracking kills (Grind screen)">
        <Bullets
          items={[
            "Find the animal you are grinding.",
            "Tap +1 / +10 / +50 / +100 to add kills.",
            "Counts save automatically.",
          ]}
        />
      </Section>

      <Section title="UNDO (where it is and how it works)">
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">
          Undo appears at the TOP of the grind screen, by the animals you are grinding.
          <div className="mt-2">
            Undo only shows for about <span className="font-semibold">8 seconds</span>.
            After it disappears, the save is <span className="font-semibold">permanent</span>.
          </div>
        </div>

        <div className="mt-3 text-xs text-white/75">
          Use Undo immediately if you tapped the wrong button or the wrong animal. Undo is
          intentionally short so you cannot accidentally undo hours later and mess up your grind.
        </div>
      </Section>

      <Section title="Quick Log (fast hunting)">
        <Bullets
          items={[
            "Use Quick Log while hunting so you do not have to scroll.",
            "Pick the animal, pick the fur type, then log the kill.",
            "If it is not in the list, use Custom and type it.",
          ]}
        />
      </Section>

      <Section title="Trophies and Great Ones">
        <Bullets
          items={[
            "When you get something rare, log it in Quick Log and mark it as a Trophy/Obtained (if shown).",
            "View saved trophies in the Trophy Room tab.",
          ]}
        />
      </Section>

      <Section title="Sessions (optional but useful)">
        <Bullets
          items={[
            "Start a session when you begin hunting.",
            "Log kills normally (Grind screen or Quick Log).",
            "End the session to see a summary.",
            "Use History/Session History to review past sessions (read-only).",
          ]}
        />
      </Section>

      <Section title="Backup (Export and Import)">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
          Backup is the safety feature. Export saves your data. Import restores it.
        </div>

        <div className="mt-3 text-xs text-white/75">
          <div className="font-semibold text-white/85">Export (recommended)</div>
          <Bullets
            items={[
              "Export after a big trophy, before switching devices, or once in a while.",
              "Save the backup somewhere safe (Drive, email to yourself, Notes).",
            ]}
          />

          <div className="mt-3 font-semibold text-white/85">Import (restore)</div>
          <Bullets
            items={[
              "Import restores a backup and replaces your current data.",
              "Only import when you mean to restore.",
            ]}
          />
        </div>
      </Section>

      <Section title="Simple way to use the app (no stress)">
        <Bullets
          items={[
            "Use the Grind screen for totals.",
            "Use Quick Log during hunts.",
            "If you mis-tap, hit Undo right away (8 seconds).",
            "Export a backup sometimes so you never lose progress.",
          ]}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white/90">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-xs text-white/75">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
