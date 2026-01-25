import React, { useMemo } from "react";
import { useHunterStore } from "../store";

/**
 * UpgradeScreen — Monetization Prep (UI ONLY)
 * - Clarifies FREE vs PRO boundaries
 * - Clarifies PRO Test = local flag only
 * - No Stripe, no payments, no purchases
 * - Adds "Report issue" mailto
 * - Keeps Backup/Restore round-trip tester
 */

function Pill(props: { children: React.ReactNode; tone?: "pro" | "free" | "warn" | "info" }) {
  const tone = props.tone || "free";
  const cls =
    tone === "pro"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
      : tone === "info"
      ? "border-sky-500/35 bg-sky-500/10 text-sky-100"
      : "border-white/20 bg-white/5 text-white/80";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {props.children}
    </span>
  );
}

function SectionCard(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">{props.title}</div>
        {props.right ? <div className="shrink-0">{props.right}</div> : null}
      </div>
      {props.children}
    </div>
  );
}

function BulletList(props: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm text-white/85">
      {props.items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function openMailto(subject: string, body: string) {
  const to = "carnley87@gmail.com";
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  window.location.href = `mailto:${to}?subject=${s}&body=${b}`;
}

export default function UpgradeScreen() {
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const setPro = useHunterStore((s: any) => s.setPro);

  const exportBackup = useHunterStore((s: any) => s.exportBackup);
  const importBackup = useHunterStore((s: any) => s.importBackup);

  const versionLabel = useMemo(() => "v1.0 (beta)", []);

  function enableProTest() {
    // Local flag only (no payments)
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

  function reportIssue() {
    const subject = "Great One Grind — Beta Feedback (Upgrade/PRO)";
    const body = [
      "What did you expect?",
      "",
      "",
      "What happened instead?",
      "",
      "",
      "Screenshot/video (if possible):",
      "",
      "",
      "---- Context ----",
      `PRO Test currently: ${isPro ? "ON" : "OFF"}`,
      `Version label: ${versionLabel}`,
      "",
    ].join("\n");

    openMailto(subject, body);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="info">Beta build</Pill>
            <Pill tone="warn">No payments in this version</Pill>
            <Pill tone={isPro ? "pro" : "free"}>{isPro ? "PRO Test: ON" : "PRO Test: OFF"}</Pill>
          </div>

          <h2 className="text-2xl font-semibold text-white">{isPro ? "PRO (Test Mode)" : "Upgrade (Preview)"}</h2>

          <div className="text-sm text-white/75 leading-relaxed">
            <span className="font-semibold text-white/90">Important:</span> PRO is{" "}
            <span className="font-semibold text-white/90">optional</span>. The grinder stays free. In this beta build,
            PRO is just a <span className="font-semibold text-white/90">local toggle</span> so we can test PRO-gated UI.
          </div>
        </div>

        <div className="text-right text-xs text-white/55">
          <div className="font-semibold text-white/70">{versionLabel}</div>
          <div>No purchases</div>
        </div>
      </div>

      {/* TEST MODE banner */}
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold text-amber-100">TEST MODE (SAFE)</div>
            <div className="text-sm text-amber-100/80 leading-relaxed">
              Turning PRO on/off here only changes what buttons and screens you can access.
              <span className="font-semibold"> No Stripe. No money. No purchases.</span>
            </div>
          </div>
          <Pill tone="warn">UI-only</Pill>
        </div>
      </div>

      {/* Free vs Pro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SectionCard title="FREE (core app)">
          <div className="text-sm text-white/75">Everything needed for grinding + tracking.</div>

          <BulletList
            items={[
              "Grinds + Quick Log (core grinder)",
              "Session HUD + Session Outcomes modal",
              "History + Stats + Trophies tabs",
              "Backup / Restore (export + import) + auto-backups",
              "Great One Tracker (read-only progress view)",
            ]}
          />

          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
            Free users should never feel blocked from using the grinder. PRO is “nice-to-have” polish.
          </div>
        </SectionCard>

        <SectionCard
          title="PRO (future premium)"
          right={<Pill tone="pro">Preview</Pill>}
        >
          <div className="text-sm text-white/75">Optional power-user upgrades. No payments enabled in beta.</div>

          <BulletList
            items={[
              "Hardcore Mode toggle (PRO-gated in Settings)",
              "Export Archive (CSV / JSON) using filters",
              "Advanced insights (streaks / rolling pace / records) — planned",
              "UI speed + quality-of-life polish — planned",
            ]}
          />

          {isPro ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <div className="font-semibold text-emerald-100">PRO Test is ON ✅</div>
              <div className="text-emerald-100/80 text-xs mt-1">
                This is a local toggle for beta testing only. Nothing is charged.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
              Enable <span className="font-semibold text-white/90">PRO Test</span> to preview PRO-only UI features.
            </div>
          )}

          <div className="space-y-2">
            {isPro ? (
              <button
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                onClick={disableProTest}
              >
                Disable PRO Test
              </button>
            ) : (
              <button
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                onClick={enableProTest}
              >
                Enable PRO Test
              </button>
            )}

            <button
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              onClick={backupRestoreRoundTrip}
            >
              Backup + Restore Round-Trip (test)
            </button>

            <button
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              onClick={reportIssue}
            >
              Report an Issue (email)
            </button>

            <div className="text-xs text-white/60">
              Reminder: payments are not enabled. This screen is strictly for beta UI testing.
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between text-xs text-white/55">
        <div className="flex items-center gap-2">
          <Pill tone="warn">No purchases</Pill>
          <span className="opacity-75">Monetization prep only</span>
        </div>
        <div className="opacity-70">PRO = optional</div>
      </div>
    </div>
  );
}
