// components/GrinderHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
import { GREAT_ONE_SPECIES, useHunterStore, type GreatOneSpecies } from "../store";

/**
 * GrinderHUD (visual-only + guidance)
 *
 * IMPORTANT (Beta safety):
 * - The TOP SessionHUD Start/End is the ONLY place that logs Session History + Stats.
 * - This GrinderHUD Start/End is intentionally DISABLED to avoid confusion.
 *
 * We keep GrinderHUD for pace / milestone / grinder-friendly visuals only.
 * No store/session plumbing changes here (safe).
 */

const SUMMARY_KEY = "greatonegrind_session_summary_v1";
const SUMMARY_EVENT = "greatonegrind:session_summary";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function safeNow() {
  return Date.now();
}

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function nextMilestone(kills: number) {
  const targets = [50, 100, 250, 500, 1000, 2000, 5000, 10000];
  const k = Math.max(0, Math.floor(kills || 0));
  for (const t of targets) {
    if (k < t) return t;
  }
  return 10000;
}

function formatMinutes(min: number) {
  if (!Number.isFinite(min) || min < 0) return "—";
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function GrinderHUD() {
  const grinds = useHunterStore((s) => s.grinds);
  const activeSession = useHunterStore((s) => s.activeSession);
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    const t = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, [activeSession]);

  const isActive = !!activeSession;

  const species = useMemo<GreatOneSpecies>(() => {
    const s = activeSession?.species as GreatOneSpecies | undefined;
    if (s && GREAT_ONE_SPECIES.includes(s)) return s;
    return "Whitetail Deer";
  }, [activeSession]);

  const grind = useMemo(() => {
    return grinds.find((g) => g.species === species) || null;
  }, [grinds, species]);

  const totalKills = grind?.kills ?? 0;
  const killsSession = activeSession?.kills ?? 0;

  const startedAt = activeSession?.startedAt ?? safeNow();

  const elapsedMs = useMemo(() => {
    if (!activeSession) return 0;
    return Math.max(0, safeNow() - (activeSession.startedAt || safeNow()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, tick]);

  const elapsed = useMemo(() => {
    if (!activeSession) return "—";
    return formatElapsed(elapsedMs);
  }, [activeSession, elapsedMs]);

  const target = nextMilestone(totalKills);
  const remaining = Math.max(0, target - totalKills);
  const progress = clamp01(totalKills / target);

  const pace = useMemo(() => {
    if (!activeSession) return 0;
    const ms = Math.max(1, safeNow() - (activeSession.startedAt || safeNow()));
    const hours = ms / 3_600_000;
    return hours > 0 ? killsSession / hours : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, tick, killsSession]);

  const timeToNext = useMemo(() => {
    if (!activeSession) return "—";
    if (pace <= 0.01) return "—";
    const hrs = remaining / pace;
    if (!Number.isFinite(hrs) || hrs < 0) return "—";
    return formatMinutes(hrs * 60);
  }, [activeSession, pace, remaining]);

  const killsPer10Min = useMemo(() => {
    if (!activeSession) return 0;
    const minutes = Math.max(1 / 60, elapsedMs / 60_000);
    const perMin = killsSession / minutes;
    return perMin * 10;
  }, [activeSession, elapsedMs, killsSession]);

  const stallLevel = useMemo<"ok" | "warn" | "danger">(() => {
    if (!activeSession) return "ok";
    // purely visual guidance:
    // - pace very low for a bit -> warn
    // - pace near zero for longer -> danger
    const mins = elapsedMs / 60_000;
    if (mins < 6) return "ok";
    if (pace < 10 && mins >= 10) return "warn";
    if (pace < 5 && mins >= 15) return "danger";
    return "ok";
  }, [activeSession, elapsedMs, pace]);

  const stallText = useMemo(() => {
    if (!activeSession) return "—";
    if (stallLevel === "danger") return "Stalling";
    if (stallLevel === "warn") return "Slow";
    return "On pace";
  }, [activeSession, stallLevel]);

  const stallHint = useMemo(() => {
    if (!activeSession) return "Start a session (top bar)";
    if (stallLevel === "danger") return "Swap zones • reset route • speed up pulls";
    if (stallLevel === "warn") return "Tighten loop • check drink time • keep moving";
    return "Keep the loop clean";
  }, [activeSession, stallLevel]);

  // We keep the summary dispatch read-only (it does NOT write history)
  function dispatchSummary(beforeEnding: { killsSession: number; startedAt: number; species: GreatOneSpecies }) {
    try {
      const sp = beforeEnding.species;
      const g = grinds.find((x) => x.species === sp);
      const total = g?.kills ?? 0;
      const fur = (g?.fur || "").trim();

      const summary = {
        kind: "session_summary_v1",
        createdAt: safeNow(),
        species: sp,
        durationMs: safeNow() - (beforeEnding.startedAt || safeNow()),
        killsThisSession: beforeEnding.killsSession,
        totalKillsForSpecies: total,
        fur,
      };

      localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
      window.dispatchEvent(new CustomEvent(SUMMARY_EVENT, { detail: summary }));
    } catch {
      // ignore
    }
  }

  // 🔒 Disabled by design (we do NOT want two different Start buttons for beta)
  function onStartDisabled() {
    // no-op
  }

  function onEndDisabled() {
    // no-op (do not end session here)
    if (!activeSession) return;

    // OPTIONAL: keep summary read-only dispatch (safe), but DO NOT end session here.
    dispatchSummary({
      killsSession: activeSession.kills ?? 0,
      startedAt: activeSession.startedAt ?? safeNow(),
      species: (activeSession.species as GreatOneSpecies) || species,
    });
  }

  const paceText = isActive ? pace.toFixed(1) : "—";
  const timeText = isActive ? timeToNext : "—";
  const k10Text = isActive ? killsPer10Min.toFixed(1) : "—";

  const shell = cx(
    "w-full rounded-2xl border p-2.5",
    hardcoreMode
      ? "border-red-500/20 bg-gradient-to-b from-red-500/10 via-black/35 to-black/35"
      : "border-white/10 bg-white/5"
  );

  const proPill = cx(
    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
    hardcoreMode ? "bg-red-500/20 text-red-100" : "bg-amber-500/20 text-amber-200"
  );

  const activePill = cx(
    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
    isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/60"
  );

  const hardcorePill = "rounded-full bg-red-500/25 px-2 py-0.5 text-[10px] font-semibold text-red-100";

  return (
    <div className={shell}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[13px] font-semibold">{hardcoreMode ? "Grinder HUD — Hardcore" : "Grinder HUD"}</div>

            <div className="mt-0.5 text-[11px] text-white/55">
              {hardcoreMode
                ? "High-speed feedback. Tight loops. No fluff."
                : "Built for grinders. No spawn myths. No fake odds. Just tracking."}
            </div>

            <span className={proPill}>PRO</span>

            <span className={activePill} title={isActive ? "Session running" : "No active session"}>
              {isActive ? "Active" : "Idle"}
            </span>

            {hardcoreMode ? <span className={hardcorePill}>Hardcore</span> : null}

            {hardcoreMode && isActive ? (
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  stallLevel === "danger"
                    ? "bg-red-500/20 text-red-100"
                    : stallLevel === "warn"
                    ? "bg-amber-500/20 text-amber-100"
                    : "bg-white/10 text-white/70"
                )}
                title={stallHint}
              >
                {stallText}
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 text-[11px] opacity-70">
            Tracking: <span className="font-semibold opacity-100">{species}</span>
            {hardcoreMode && isActive ? (
              <span className="ml-2 opacity-70">
                • Started <span className="font-semibold opacity-100">{new Date(startedAt).toLocaleTimeString()}</span>
              </span>
            ) : null}
          </div>

          {/* ✅ Clear guidance (beta-safe) */}
          <div
            className={cx(
              "mt-1 rounded-xl border px-3 py-2 text-[11px]",
              hardcoreMode ? "border-red-500/15 bg-black/35 text-white/75" : "border-white/10 bg-black/25 text-white/70"
            )}
          >
            <span className="font-semibold text-white/85">Session logging:</span> Use the{" "}
            <span className="font-semibold text-white/90">TOP Start / End</span> to log{" "}
            <span className="font-semibold text-white/90">History + Stats</span>.
            {hardcoreMode ? (
              <span className="ml-1 text-white/60">
                (This HUD is live feedback only — it won’t save sessions.)
              </span>
            ) : null}
          </div>
        </div>

        {/* Disabled Start/End button (visible but non-clickable) */}
        {!isActive ? (
          <button
            onClick={onStartDisabled}
            disabled
            className={cx(
              "shrink-0 cursor-not-allowed rounded-xl border px-4 py-2 text-sm font-semibold",
              hardcoreMode ? "border-red-500/20 bg-white/5 text-white/45" : "border-white/15 bg-white/5 text-white/45"
            )}
            title="Disabled: Use the TOP Start to log sessions"
          >
            Start
          </button>
        ) : (
          <button
            onClick={onEndDisabled}
            disabled
            className={cx(
              "shrink-0 cursor-not-allowed rounded-xl border px-4 py-2 text-sm font-semibold",
              hardcoreMode ? "border-red-500/20 bg-white/5 text-white/45" : "border-white/15 bg-white/5 text-white/45"
            )}
            title="Disabled: Use the TOP End to save History/Stats"
          >
            End
          </button>
        )}
      </div>

      {/* Primary emphasis row */}
      <div className={cx("mt-2.5 grid gap-2", hardcoreMode ? "grid-cols-3" : "grid-cols-2")}>
        <BigStat
          tone={hardcoreMode ? "hard" : "soft"}
          label="Pace"
          value={paceText}
          unit="kills/hr"
          hint={isActive ? "Live" : "Start a session (top bar)"}
        />
        <BigStat
          tone={hardcoreMode ? "hard" : "soft"}
          label="Time to Next"
          value={timeText}
          unit=""
          hint={isActive ? `${pretty(remaining)} remaining` : `${pretty(remaining)} to next milestone`}
        />
        {hardcoreMode ? (
          <BigStat
            tone="hard"
            label="Kills / 10m"
            value={k10Text}
            unit=""
            hint={isActive ? "Sprint check" : "—"}
          />
        ) : null}
      </div>

      {/* Secondary row */}
      <div className={cx("mt-2 grid gap-2", hardcoreMode ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4")}>
        <StatCard tone={hardcoreMode ? "hard" : "soft"} label="Session Time" value={elapsed} />
        <StatCard tone={hardcoreMode ? "hard" : "soft"} label="Kills (Session)" value={isActive ? pretty(killsSession) : "—"} />
        <StatCard tone={hardcoreMode ? "hard" : "soft"} label="Total Kills" value={pretty(totalKills)} />
        <MilestoneCard
          tone={hardcoreMode ? "hard" : "soft"}
          target={target}
          remaining={remaining}
          progress={progress}
          sub={isActive ? `Target ${pretty(target)} • Push time` : `Target ${pretty(target)} • Total progress`}
        />
        {hardcoreMode ? (
          <StatCard
            tone="hard"
            label="Stall Guard"
            value={isActive ? stallText : "—"}
            sub={isActive ? stallHint : "—"}
          />
        ) : null}
      </div>

      <div className="mt-2.5 text-[11px] opacity-60">
        Tip: Use the TOP Start/End to save session history. GrinderHUD is a visual dashboard.
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  hint?: string;
  tone: "soft" | "hard";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-2.5",
        tone === "hard" ? "border-red-500/15 bg-black/45" : "border-white/10 bg-black/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={cx("text-[11px] font-semibold", tone === "hard" ? "text-white/85" : "opacity-80")}>{label}</div>
        {unit ? <div className="text-[10px] opacity-60">{unit}</div> : <div />}
      </div>

      <div
        className={cx(
          "mt-1 font-extrabold tracking-tight leading-tight",
          tone === "hard" ? "text-[28px]" : "text-[26px]"
        )}
      >
        {value}
      </div>

      {hint ? <div className="mt-1 text-[11px] opacity-70">{hint}</div> : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "soft" | "hard";
}) {
  return (
    <div
      className={cx(
        "rounded-xl border p-2.5",
        tone === "hard" ? "border-red-500/15 bg-black/35" : "border-white/10 bg-black/20"
      )}
    >
      <div className="text-[11px] opacity-70">{label}</div>
      <div className="mt-1 text-[15px] font-semibold leading-tight">{value}</div>
      {sub ? <div className="mt-1 text-[11px] opacity-70">{sub}</div> : null}
    </div>
  );
}

function MilestoneCard({
  target,
  remaining,
  progress,
  sub,
  tone,
}: {
  target: number;
  remaining: number;
  progress: number;
  sub: string;
  tone: "soft" | "hard";
}) {
  return (
    <div
      className={cx(
        "rounded-xl border p-2.5",
        tone === "hard" ? "border-red-500/15 bg-black/35" : "border-white/10 bg-black/20"
      )}
    >
      <div className="text-[11px] opacity-70">Next Milestone</div>
      <div className="mt-1 text-[15px] font-semibold leading-tight">{pretty(target)}</div>
      <div className="mt-1 text-[11px] opacity-70">{sub}</div>

      <div className={cx("mt-2 h-2 w-full rounded-full", tone === "hard" ? "bg-red-500/10" : "bg-white/10")}>
        <div
          className={cx("h-2 rounded-full", tone === "hard" ? "bg-red-200/40" : "bg-white/30")}
          style={{ width: `${Math.round(clamp01(progress) * 100)}%` }}
        />
      </div>

      <div className="mt-1 text-[11px] opacity-60">{pretty(remaining)} to go</div>
    </div>
  );
}
