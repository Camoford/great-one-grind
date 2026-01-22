import React, { useMemo } from "react";
import { useHunterStore } from "../store";

/**
 * Phase 13 — Ship-Ready Pass (Upgrade Screen polish)
 * - Copy clarity (PRO is optional, no payments in this build)
 * - Keeps TEST MODE toggle (local flag only)
 * - Keeps Backup/Restore round-trip tester
 *
 * RULES:
 * - UI only
 * - No Stripe
 * - No purchases
 * - No session plumbing changes
 */

function Pill(props: { children: React.ReactNode; tone?: "pro" | "free" | "warn" }) {
  const tone = props.tone || "free";
  const cls =
    tone === "pro"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
      : "border-white/20 bg-white/5 text-white/80";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {props.children}
    </span>
  );
}

function SectionCard(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{props.title}</div>
      </div>
      {props.children}
    </div>
  );
}

function BulletList(props: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
      {props.items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function UpgradeScreen() {
  const isPro = useHunterStore((s) => s.isPro);
  const setPro = useHunterStore((s) => s.setPro);

  const exportBackup = useHunterStore((s) => s.exportBackup);
  const importBackup = useHunterStore((s) => s.importBackup);

  const versionLabel = useMemo(() => {
    // Simple ship label (safe, no build tooling required)
    return "v1.0 (ship-ready)";
  }, []);

  function enableProTest() {
    setPro(true);
  }

  function disableProTest() {
    setPro(false);
  }

  function backupRestoreRoundTrip() {
    try {
      const blob = exportBackup();
      const ok = importBackup(blob);
      if (ok) {
        alert("✅ Backup + Restore round-trip succeeded.");
      } else {
        alert("⚠️ Restore returned false. No data was changed.");
      }
    } catch (e: any) {
      alert(`❌ Backup/Restore test failed:\n${String(e?.message || e)}`);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Pill tone="warn">PRO is optional — the core grinder stays free</Pill>
          </div>

          <h2 className="text-2xl font-semibold">{isPro ? "You’re PRO" : "Upgrade"}</h2>

          <div className="text-sm opacity-80">
            {isPro ? (
              <>
                PRO features are unlocked. <span className="font-semibold">Payments are NOT enabled</span> in this build.
              </>
            ) : (
              <>
                Unlock PRO features (UI-only). <span className="font-semibold">No Stripe, no money, no purchases</span>.
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Pill tone={isPro ? "pro" : "free"}>{isPro ? "PRO Active" : "FREE"}</Pill>
        </div>
      </div>

      {/* Test Mode banner */}
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold text-amber-100">TEST MODE</div>
            <div className="text-sm text-amber-100/80">
              PRO is controlled by a local flag for testing only. <span className="font-semibold">No Stripe. No money. No purchases.</span>
            </div>
          </div>
          <Pill tone="warn">Safe</Pill>
        </div>
      </div>

      {/* Free vs Pro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SectionCard title="Free">
          <div className="flex items-center justify-between">
            <div className="text-sm opacity-80">Everything you need to grind and track safely.</div>
            <Pill>Included</Pill>
          </div>

          <BulletList
            items={[
              "Session HUD + Session Summary",
              "Session History (read-only log)",
              "Backup / Restore + safety protections",
              "Core grinder + Hardcore controls (if enabled by settings)",
            ]}
          />

          <div className="rounded-xl border bg-black/20 p-3 text-xs opacity-80">
            Tip: Press <span className="font-semibold">ESC</span> anytime to return to Grinds.
          </div>
        </SectionCard>

        <SectionCard title="PRO">
          <div className="flex items-center justify-between">
            <div className="text-sm opacity-80">Premium grinder experience — faster decisions, less clutter.</div>
            <Pill tone="pro">One-time (future)</Pill>
          </div>

          <BulletList
            items={[
              "PRO-only workflow polish & advanced insights",
              "Personal Records + Species Records",
              "Grinder Insights v3 (best day, streaks, rolling pace, timeline)",
              "Archive export (CSV / JSON) using filters",
            ]}
          />

          {isPro ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <div className="font-semibold text-emerald-100">You’re unlocked ✅</div>
              <div className="text-emerald-100/80 text-xs mt-1">
                Hardcore controls and PRO-gated features are active. Payments are not enabled in this build.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-black/20 p-3 text-sm opacity-80">
              Enable <span className="font-semibold">PRO Test</span> to preview these features (UI-only).
            </div>
          )}

          <div className="space-y-2">
            {isPro ? (
              <button
                className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-white/10"
                onClick={disableProTest}
              >
                Disable PRO (test)
              </button>
            ) : (
              <button
                className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-white/10"
                onClick={enableProTest}
              >
                Enable PRO (test)
              </button>
            )}

            <button
              className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-white/10"
              onClick={backupRestoreRoundTrip}
            >
              Backup + Restore Round-Trip (test)
            </button>

            <div className="text-xs opacity-70">
              Payments are not enabled. This is a safe PRO flag toggle to verify persistence and backups.
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between text-xs opacity-60">
        <div>{versionLabel}</div>
        <div className="opacity-70">Read-only insights • No purchases</div>
      </div>
    </div>
  );
}
