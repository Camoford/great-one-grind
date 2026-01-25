// components/StatsDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";
import {
  readSessionHistory,
  SESSION_HISTORY_EVENT,
  type SessionHistoryEntry,
} from "../src/utils/sessionHistory";

/* ---------------- helpers ---------------- */

function pretty(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
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

function ymdFromTs(ts: number) {
  try {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  } catch {
    return "";
  }
}

function dayKeyToTs(day: string) {
  const t = new Date(`${day}T00:00:00`).getTime();
  return Number.isFinite(t) ? t : 0;
}

function addDays(ts: number, days: number) {
  return ts + days * 86400000;
}

function clampInt(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.floor(x));
}

/* ---------------- UI bits ---------------- */

function ProPill() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide opacity-80">
      PRO
    </span>
  );
}

function LockedCard(props: { title: string; bullets: string[] }) {
  return (
    <div className="rounded-2xl border bg-white/5 p-4 space-y-2 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="font-semibold">
          {props.title} <ProPill />
        </div>
        <span className="text-[11px] opacity-70">Locked</span>
      </div>

      <div className="text-sm opacity-80">
        Unlock PRO to see:
        <ul className="mt-2 list-disc pl-5 space-y-1 opacity-90">
          {props.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-xl border bg-black/20 p-3 text-xs opacity-80">
        Go to the <span className="font-semibold">Upgrade</span> tab to enable{" "}
        <span className="font-semibold">PRO Test</span> (UI-only).
      </div>
    </div>
  );
}

/* ---------------- component ---------------- */

export default function StatsDashboard() {
  const grinds = useHunterStore((s) => s.grinds);
  const isPro = useHunterStore((s) => s.isPro);

  const [sessions, setSessions] = useState<SessionHistoryEntry[]>(() => readSessionHistory());

  useEffect(() => {
    const refresh = () => setSessions(readSessionHistory());
    refresh();
    window.addEventListener(SESSION_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(SESSION_HISTORY_EVENT, refresh);
  }, []);

  const lifetime = useMemo(() => {
    const rows = [...grinds]
      .map((g) => ({
        species: String(g.species || "Unknown"),
        kills: clampInt((g as any).kills ?? 0),
      }))
      .sort((a, b) => b.kills - a.kills);

    const totalLifetimeKills = rows.reduce((sum, r) => sum + r.kills, 0);

    return { rows, totalLifetimeKills };
  }, [grinds]);

  const derived = useMemo(() => {
    let bestKills = 0;
    let bestKillsSession: SessionHistoryEntry | null = null;

    let longestMs = 0;
    let longestSession: SessionHistoryEntry | null = null;

    let bestPace = 0;
    let bestPaceSession: SessionHistoryEntry | null = null;

    let sessionKillsTotal = 0;
    let sessionDiamondsTotal = 0;
    let sessionRaresTotal = 0;

    const bySpecies = new Map<
      string,
      {
        totalKills: number;
        sessions: number;
        diamonds: number;
        rares: number;
        bestKills: number;
        bestPace: number;
        longestMs: number;
      }
    >();

    for (const s of sessions) {
      const species = String(s.species || "Unknown");
      const kills = clampInt(s.killsThisSession);
      const ms = clampInt(s.durationMs);
      const d = clampInt(s.diamondsThisSession);
      const r = clampInt(s.raresThisSession);

      sessionKillsTotal += kills;
      sessionDiamondsTotal += d;
      sessionRaresTotal += r;

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

      const entry =
        bySpecies.get(species) || {
          totalKills: 0,
          sessions: 0,
          diamonds: 0,
          rares: 0,
          bestKills: 0,
          bestPace: 0,
          longestMs: 0,
        };

      entry.totalKills += kills;
      entry.sessions += 1;
      entry.diamonds += d;
      entry.rares += r;
      entry.bestKills = Math.max(entry.bestKills, kills);
      entry.bestPace = Math.max(entry.bestPace, p);
      entry.longestMs = Math.max(entry.longestMs, ms);

      bySpecies.set(species, entry);
    }

    const speciesRows = [...bySpecies.entries()].map(([species, r]) => ({
      species,
      ...r,
    }));

    return {
      sessionKillsTotal,
      sessionDiamondsTotal,
      sessionRaresTotal,
      bestKillsSession,
      longestSession,
      bestPaceSession,
      speciesRows,
    };
  }, [sessions]);

  return (
    <div className="p-4 space-y-4">
      {/* ✅ Logging clarity banner */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/75">
        <span className="font-semibold text-white/90">Logging tip:</span> Use the{" "}
        <span className="font-semibold text-white/90">TOP Start / End</span> on the Grinds screen to log{" "}
        <span className="font-semibold text-white/90">History + Stats</span> (kills, diamonds, rares).
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Stats</h2>
        <div className="text-xs opacity-70">
          {isPro ? "PRO Enabled" : "FREE (read-only)"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white/5 p-3">
          <div className="text-xs opacity-70">Sessions Logged</div>
          <div className="text-2xl font-semibold">{pretty(sessions.length)}</div>
        </div>

        <div className="rounded-2xl border bg-white/5 p-3">
          <div className="text-xs opacity-70">Lifetime Kills</div>
          <div className="text-2xl font-semibold">{pretty(lifetime.totalLifetimeKills)}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white/5 p-4 space-y-2">
        <div className="font-semibold">Session Totals</div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Kills" value={derived.sessionKillsTotal} />
          <Stat label="Diamonds" value={derived.sessionDiamondsTotal} />
          <Stat label="Rares" value={derived.sessionRaresTotal} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-black/20 p-3">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-lg font-semibold">{pretty(value)}</div>
    </div>
  );
}

