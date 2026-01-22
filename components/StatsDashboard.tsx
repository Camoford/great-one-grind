import React, { useMemo } from "react";
import { useHunterStore } from "../store";
import { readSessionHistory } from "../utils/sessionHistory";

/* ---------------- helpers ---------------- */

function pretty(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function pace(kills: number, ms: number) {
  if (!ms || ms <= 0) return 0;
  return (kills / ms) * 3600000;
}

/* ---------------- component ---------------- */

export default function StatsDashboard() {
  const grinds = useHunterStore((s) => s.grinds);

  const sessions = useMemo(() => {
    return readSessionHistory().filter(Boolean);
  }, []);

  const records = useMemo(() => {
    let bestKills = 0;
    let bestKillsSession: any = null;

    let longestMs = 0;
    let longestSession: any = null;

    let bestPace = 0;
    let bestPaceSession: any = null;

    const bySpecies = new Map<
      string,
      {
        bestKills?: any;
        bestPace?: any;
        longest?: any;
      }
    >();

    for (const s of sessions) {
      const kills = s.totalKills || 0;
      const ms = s.durationMs || 0;
      const p = pace(kills, ms);

      if (kills > bestKills) {
        bestKills = kills;
        bestKillsSession = s;
      }

      if (ms > longestMs) {
        longestMs = ms;
        longestSession = s;
      }

      if (p > bestPace) {
        bestPace = p;
        bestPaceSession = s;
      }

      if (Array.isArray(s.speciesBreakdown)) {
        for (const b of s.speciesBreakdown) {
          const entry =
            bySpecies.get(b.species) || {};

          if (!entry.bestKills || b.kills > entry.bestKills.kills) {
            entry.bestKills = {
              species: b.species,
              kills: b.kills,
              session: s,
            };
          }

          const sp = pace(b.kills, ms);
          if (!entry.bestPace || sp > entry.bestPace.pace) {
            entry.bestPace = {
              species: b.species,
              pace: sp,
              kills: b.kills,
              session: s,
            };
          }

          if (!entry.longest || ms > entry.longest.durationMs) {
            entry.longest = {
              species: b.species,
              durationMs: ms,
              kills: b.kills,
              session: s,
            };
          }

          bySpecies.set(b.species, entry);
        }
      }
    }

    return {
      bestKillsSession,
      longestSession,
      bestPaceSession,
      bySpecies,
    };
  }, [sessions]);

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Stats</h2>

      {/* Existing aggregate stats stay intact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="label">Tracked Grinds</div>
          <div className="value">{grinds.length}</div>
        </div>
        <div className="card">
          <div className="label">Sessions Logged</div>
          <div className="value">{sessions.length}</div>
        </div>
      </div>

      {/* Personal Records */}
      <div className="card space-y-3">
        <h3 className="font-semibold">🏆 Personal Records</h3>

        {records.bestKillsSession && (
          <div>
            <strong>Best Session:</strong>{" "}
            {pretty(records.bestKillsSession.totalKills)} kills (
            {formatDuration(records.bestKillsSession.durationMs)})
          </div>
        )}

        {records.longestSession && (
          <div>
            <strong>Longest Session:</strong>{" "}
            {formatDuration(records.longestSession.durationMs)} (
            {pretty(records.longestSession.totalKills)} kills)
          </div>
        )}

        {records.bestPaceSession && (
          <div>
            <strong>Best Pace:</strong>{" "}
            {pretty(
              pace(
                records.bestPaceSession.totalKills,
                records.bestPaceSession.durationMs
              )
            )}{" "}
            kills/hour
          </div>
        )}
      </div>

      {/* Per Species Records */}
      <div className="card space-y-3">
        <h3 className="font-semibold">🎯 Species Records</h3>

        {[...records.bySpecies.entries()].map(([species, r]) => (
          <div key={species} className="border-t pt-2">
            <div className="font-medium">{species}</div>

            {r.bestKills && (
              <div className="text-sm">
                Best Session: {pretty(r.bestKills.kills)} kills
              </div>
            )}

            {r.bestPace && (
              <div className="text-sm">
                Best Pace: {pretty(r.bestPace.pace)} kills/hour
              </div>
            )}

            {r.longest && (
              <div className="text-sm">
                Longest Session: {formatDuration(r.longest.durationMs)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
