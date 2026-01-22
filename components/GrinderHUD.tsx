// components/GrinderHUD.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHunterStore, type GreatOneSpecies } from "../store";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

const MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000, 10000];

function milestoneWindow(totalKills: number) {
  const k = Math.max(0, Math.floor(totalKills || 0));

  let prev = 0;
  let target = MILESTONES[MILESTONES.length - 1];

  for (const t of MILESTONES) {
    if (k < t) {
      target = t;
      break;
    }
    prev = t;
  }

  if (k >= MILESTONES[MILESTONES.length - 1]) {
    prev = Math.floor(k / 5000) * 5000;
    target = prev + 5000;
  }

  const remaining = Math.max(0, target - k);
  const denom = Math.max(1, target - prev);
  const progress = Math.max(0, Math.min(1, (k - prev) / denom));

  return { prev, target, remaining, progress, total: k };
}

function estimateHours(paceKillsPerHour: number, remainingKills: number) {
  if (!paceKillsPerHour || paceKillsPerHour <= 0) return null;
  if (!remainingKills || remainingKills <= 0) return 0;
  return remainingKills / paceKillsPerHour;
}

function formatEta(hours: number) {
  if (!Number.isFinite(hours)) return "—";
  const totalMin = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return sum(arr) / arr.length;
}

function kpmToKph(kpm: number) {
  return kpm * 60;
}

function safeFixed(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export default function GrinderHUD() {
  const activeSession = useHunterStore((s) => s.activeSession);
  const startSession = useHunterStore((s) => s.startSession);
  const endSession = useHunterStore((s) => s.endSession);

  const grinds = useHunterStore((s) => s.grinds);

  // Phase 5+: PRO gating (defensive read; test key name can vary)
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;
  const proEnabled = isPro || isProTest;

  // “best guess” current species: if session has species, use it; else first grind
  const sessionSpecies: GreatOneSpecies | undefined = activeSession?.species;
  const currentGrind = useMemo(() => {
    if (sessionSpecies) return grinds.find((g) => g.species === sessionSpecies);
    return grinds[0];
  }, [grinds, sessionSpecies]);

  const killsTotal = currentGrind?.kills ?? 0;

  // ticking clock for elapsed time
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activeSession) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeSession]);

  const elapsedMs = activeSession ? now - activeSession.startedAt : 0;
  const elapsedHours = activeSession ? elapsedMs / 3600000 : 0;

  const killsThisSession = activeSession?.kills ?? 0;
  const paceSessionKph = activeSession && elapsedHours > 0 ? killsThisSession / elapsedHours : 0;

  const mw = milestoneWindow(killsTotal);

  // -------------------------------
  // PRO HUD+ minutes buckets (UI-only)
  // -------------------------------

  // 30-minute window: each bucket is kills gained in that minute.
  const BUCKETS = 30;

  const [paceBuckets, setPaceBuckets] = useState<number[]>(() => Array(BUCKETS).fill(0));

  // refs to avoid stale closures in intervals
  const sessionRef = useRef(activeSession);
  const lastTickKillsRef = useRef<number>(0);

  useEffect(() => {
    sessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    // Reset buckets on new session start or when session ends
    if (!activeSession) {
      setPaceBuckets(Array(BUCKETS).fill(0));
      lastTickKillsRef.current = 0;
      return;
    }

    setPaceBuckets(Array(BUCKETS).fill(0));
    lastTickKillsRef.current = activeSession.kills ?? 0;
  }, [activeSession?.startedAt]);

  useEffect(() => {
    if (!proEnabled) return;
    if (!activeSession) return;

    const interval = setInterval(() => {
      const s = sessionRef.current;
      if (!s) return;

      const currentKills = s.kills ?? 0;
      const delta = Math.max(0, currentKills - (lastTickKillsRef.current || 0));

      setPaceBuckets((prev) => {
        const next = prev.slice(1);
        next.push(delta);
        return next;
      });

      lastTickKillsRef.current = currentKills;
    }, 60_000);

    return () => clearInterval(interval);
  }, [proEnabled, activeSession]);

  const maxBucket = useMemo(() => Math.max(1, ...paceBuckets), [paceBuckets]);

  // PRO insights (derived-only)
  const bucketsLast5 = useMemo(() => paceBuckets.slice(-5), [paceBuckets]);
  const bucketsPrev5 = useMemo(() => paceBuckets.slice(-10, -5), [paceBuckets]);
  const bucketsLast15 = useMemo(() => paceBuckets.slice(-15), [paceBuckets]);

  const kpmLast5 = useMemo(() => avg(bucketsLast5), [bucketsLast5]);
  const kpmPrev5 = useMemo(() => avg(bucketsPrev5), [bucketsPrev5]);
  const kpmLast15 = useMemo(() => avg(bucketsLast15), [bucketsLast15]);

  const kphLast5 = useMemo(() => kpmToKph(kpmLast5), [kpmLast5]);
  const kphLast15 = useMemo(() => kpmToKph(kpmLast15), [kpmLast15]);

  // Best 5-min average within last 30 mins
  const best5minKpm = useMemo(() => {
    let best = 0;
    for (let i = 0; i <= paceBuckets.length - 5; i++) {
      const window = paceBuckets.slice(i, i + 5);
      best = Math.max(best, avg(window));
    }
    return best;
  }, [paceBuckets]);

  const best5minKph = useMemo(() => kpmToKph(best5minKpm), [best5minKpm]);

  // Trend: compare last 5 minutes vs previous 5
  const trend = useMemo(() => {
    const diff = kpmLast5 - kpmPrev5;
    if (Math.abs(diff) < 0.05) return "flat";
    return diff > 0 ? "up" : "down";
  }, [kpmLast5, kpmPrev5]);

  // Stall warning: pace dropped vs longer baseline
  const stallWarning = useMemo(() => {
    if (!activeSession) return false;

    const minutes = Math.floor(elapsedMs / 60_000);
    if (minutes < 12) return false; // avoid noise early

    // Need at least some activity to judge
    if (kpmLast15 <= 0) return false;

    // "stall" if last 5 min < 60% of last 15 min baseline, and last 5 has low absolute pace
    const ratio = kpmLast5 / Math.max(0.0001, kpmLast15);
    if (ratio < 0.6 && kpmLast5 < 0.6) return true; // < ~36 kph and falling hard
    return false;
  }, [activeSession, elapsedMs, kpmLast5, kpmLast15]);

  // Refined PRO pace for ETA:
  // - Prefer last 15-min pace if meaningful, else session average
  // - Slightly blend toward session average to avoid spiky ETAs
  const refinedPaceKph = useMemo(() => {
    const base = paceSessionKph || 0;
    const recent = kphLast15 || 0;

    if (!activeSession) return 0;

    // If we have any recent signal, blend 70% recent / 30% base
    if (recent > 0 && base > 0) return recent * 0.7 + base * 0.3;
    if (recent > 0) return recent;
    return base;
  }, [activeSession, paceSessionKph, kphLast15]);

  // ETA display:
  // - FREE users see no ETA (keeps HUD clean)
  // - PRO users see ETA based on refined pace (more useful)
  const etaHours = proEnabled ? estimateHours(refinedPaceKph, mw.remaining) : null;
  const etaLabel = etaHours === null ? "—" : formatEta(etaHours);

  // Also show a small "pace basis" label in PRO panel
  const paceBasis = useMemo(() => {
    if (!activeSession) return "—";
    if (kphLast15 > 0) return "last 15m";
    return "session avg";
  }, [activeSession, kphLast15]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold">Grinder HUD</div>

            {proEnabled ? (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">
                PRO {isProTest ? "TEST" : ""}
              </span>
            ) : null}
          </div>

          <div className="text-sm text-white/70">
            {currentGrind ? (
              <>
                Tracking: <span className="text-white font-semibold">{currentGrind.species}</span>
              </>
            ) : (
              <>
                Tracking: <span className="text-white font-semibold">—</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!activeSession ? (
            <button
              type="button"
              onClick={() => startSession(currentGrind?.species)}
              className="rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm hover:bg-emerald-500/20"
            >
              Start Session
            </button>
          ) : (
            <button
              type="button"
              onClick={() => endSession()}
              className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm hover:bg-red-500/20"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Session Time</div>
          <div className="mt-1 text-lg font-semibold">{activeSession ? formatElapsed(elapsedMs) : "—"}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Kills (Session)</div>
          <div className="mt-1 text-lg font-semibold">{activeSession ? pretty(killsThisSession) : "—"}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/60">Pace (kills/hr)</div>
          <div className="mt-1 text-lg font-semibold">{activeSession ? safeFixed(paceSessionKph, 1) : "—"}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-white/60">Next Milestone</div>
            {proEnabled ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                ETA
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-lg font-semibold">{pretty(mw.target)}</div>

          <div className="mt-1 text-xs text-white/60">
            {pretty(mw.remaining)} to go (total kills)
            {proEnabled && activeSession ? (
              <>
                {" "}
                • <span className="text-white/80">{etaLabel}</span>
              </>
            ) : null}
          </div>

          {/* PRO: progress bar */}
          {proEnabled ? (
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-white/30" style={{ width: `${mw.progress * 100}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                <span>{pretty(mw.total)} total</span>
                <span>{pretty(mw.remaining)} left</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* PRO Grinder Insights+ (Phase 6B) — UI-only */}
      {proEnabled ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-white/80">PRO Grinder Insights+</div>

                {activeSession ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                    {trend === "up" ? "Trending up" : trend === "down" ? "Trending down" : "Stable"}
                  </span>
                ) : null}

                {activeSession && best5minKph > 0 ? (
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-100">
                    Best 5m: {safeFixed(best5minKph, 0)}/hr
                  </span>
                ) : null}
              </div>

              <div className="mt-1 text-xs text-white/60">
                Rolling pace + refined ETA (derived-only, UI-only). No saves, no state changes.
              </div>
            </div>

            {!activeSession ? <div className="text-xs text-white/60">Start a session to see live insights.</div> : null}
          </div>

          {activeSession ? (
            <>
              {/* Top metrics row */}
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs text-white/60">Last 5m Pace</div>
                  <div className="mt-1 text-lg font-semibold">{safeFixed(kphLast5, 0)}</div>
                  <div className="mt-1 text-[11px] text-white/50">kills/hr (rolling)</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs text-white/60">Last 15m Pace</div>
                  <div className="mt-1 text-lg font-semibold">{safeFixed(kphLast15, 0)}</div>
                  <div className="mt-1 text-[11px] text-white/50">kills/hr (rolling)</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs text-white/60">Refined Pace</div>
                  <div className="mt-1 text-lg font-semibold">{safeFixed(refinedPaceKph, 0)}</div>
                  <div className="mt-1 text-[11px] text-white/50">basis: {paceBasis}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-xs text-white/60">Refined ETA</div>
                  <div className="mt-1 text-lg font-semibold">{etaLabel}</div>
                  <div className="mt-1 text-[11px] text-white/50">to {pretty(mw.target)}</div>
                </div>
              </div>

              {/* Stall warning */}
              {stallWarning ? (
                <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
                  <div className="text-sm font-semibold text-amber-100">Pace dip detected</div>
                  <div className="mt-1 text-xs text-amber-100/80">
                    Your last 5 minutes slowed down vs your recent baseline. If you’re looting/fast traveling, this is
                    normal — but if not, consider speeding up the loop.
                  </div>
                </div>
              ) : null}

              {/* 30-min buckets chart */}
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white/80">Last 30 minutes</div>
                    <div className="mt-1 text-[11px] text-white/50">Kills per minute buckets (UI-only).</div>
                  </div>
                  <div className="text-[11px] text-white/50">
                    Max/min: {pretty(maxBucket)} kpm
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-end gap-1">
                    {paceBuckets.map((v, i) => {
                      const h = Math.max(2, Math.round((v / maxBucket) * 30));
                      return (
                        <div
                          key={`b_${i}`}
                          className="w-[6px] rounded bg-white/25"
                          style={{ height: `${h}px` }}
                          title={`${v} kills`}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                    <span>older</span>
                    <span>now</span>
                  </div>
                </div>
              </div>

              {/* Small explanatory footer */}
              <div className="mt-3 text-[11px] text-white/50">
                Notes: buckets update once per minute. Early-session numbers are naturally noisy. This panel is UI-only
                and does not save anything.
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 text-xs text-white/60">
        Session kills update when you press the + buttons. Ending a session saves it to history.
      </div>
    </div>
  );
}
