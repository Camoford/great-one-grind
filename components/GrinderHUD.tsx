// components/GrinderHUD.tsx
import React, { useEffect, useMemo, useState } from "react";
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

function nextMilestone(kills: number) {
  const targets = [50, 100, 250, 500, 1000, 2000, 5000, 10000];
  const k = Math.max(0, Math.floor(kills || 0));
  for (const t of targets) {
    if (k < t) return { target: t, remaining: t - k };
  }
  const next = Math.ceil(k / 5000) * 5000 + 5000;
  return { target: next, remaining: next - k };
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function estimateTimeToTargetHours(paceKillsPerHour: number, remainingKills: number) {
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
  const pace = activeSession && elapsedHours > 0 ? killsThisSession / elapsedHours : 0;

  const milestone = nextMilestone(killsTotal);

  const progress = clamp01(milestone.target > 0 ? (killsTotal % milestone.target) / milestone.target : 0);

  // ETA is PRO-only (keeps FREE HUD clean)
  const etaHours = estimateTimeToTargetHours(pace, milestone.remaining);
  const etaLabel = etaHours === null ? "—" : formatEta(etaHours);

  // PRO HUD+: "last 10 min pace buckets" (UI-only, no persistence)
  // Only visible when a session is active (otherwise it looks empty/noisy).
  const [paceBuckets, setPaceBuckets] = useState<number[]>(() => Array(10).fill(0));
  const [lastTickKills, setLastTickKills] = useState<number>(0);

  useEffect(() => {
    // reset buckets when session changes
    if (!activeSession) {
      setPaceBuckets(Array(10).fill(0));
      setLastTickKills(0);
      return;
    }

    setPaceBuckets(Array(10).fill(0));
    setLastTickKills(activeSession.kills ?? 0);
  }, [activeSession?.startedAt]); // only reset on new session start

  useEffect(() => {
    if (!proEnabled) return;
    if (!activeSession) return;

    // Every minute: shift in the kills gained this minute.
    const interval = setInterval(() => {
      const currentKills = activeSession?.kills ?? 0;
      const delta = Math.max(0, currentKills - lastTickKills);

      setPaceBuckets((prev) => {
        const next = prev.slice(1);
        next.push(delta);
        return next;
      });

      setLastTickKills(currentKills);
    }, 60_000);

    return () => clearInterval(interval);
  }, [proEnabled, activeSession, lastTickKills]);

  const maxBucket = useMemo(() => {
    return Math.max(1, ...paceBuckets);
  }, [paceBuckets]);

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
          <div className="mt-1 text-lg font-semibold">{activeSession ? pace.toFixed(1) : "—"}</div>
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

          <div className="mt-1 text-lg font-semibold">{pretty(milestone.target)}</div>

          <div className="mt-1 text-xs text-white/60">
            {pretty(milestone.remaining)} to go (total kills)
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
                <div className="h-2 rounded-full bg-white/30" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                <span>{pretty(killsTotal)} total</span>
                <span>
                  {pretty(Math.max(0, milestone.target - (killsTotal % milestone.target)))} left
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* PRO HUD+ mini panel (UI-only) */}
      {proEnabled && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/80">PRO HUD+</div>
              <div className="mt-1 text-xs text-white/60">
                Last 10 minutes (kills per minute buckets). UI-only preview.
              </div>
            </div>

            {!activeSession ? (
              <div className="text-xs text-white/60">Start a session to see live pace buckets.</div>
            ) : null}
          </div>

          <div className="mt-3">
            <div className="flex items-end gap-1">
              {paceBuckets.map((v, i) => {
                const h = Math.max(2, Math.round((v / maxBucket) * 28));
                return (
                  <div
                    key={`b_${i}`}
                    className="w-2 rounded bg-white/25"
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
      )}

      <div className="mt-3 text-xs text-white/60">
        Session kills update when you press the + buttons. Ending a session saves it to history.
      </div>
    </div>
  );
}
