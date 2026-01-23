// components/SessionHistoryScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { readSessionHistory } from "../utils/sessionHistory";

/**
 * Phase 16A — Session History (READ-ONLY)
 * - UI only
 * - No grinder logic changes
 * - No persistence writes
 * - Safely reads from utils/sessionHistory.ts single source of truth
 */

type AnySession = {
  id?: string;
  species?: string;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  kills?: number;
  killsThisSession?: number;
  totalKills?: number;
  obtained?: boolean;
  obtainedCount?: number;
};

function pretty(n: number) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
  const safe = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  const totalSec = Math.floor(safe / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function formatDate(ts: number) {
  try {
    if (!Number.isFinite(ts)) return "";
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function safeNumber(v: any, fallback: number = 0) {
  return Number.isFinite(v) ? Number(v) : fallback;
}

function normalize(raw: AnySession, index: number) {
  const endedAt = safeNumber(raw.endedAt, 0);
  const startedAt = safeNumber(raw.startedAt, 0);

  const kills =
    Number.isFinite(raw.kills) ? Number(raw.kills) :
    Number.isFinite(raw.killsThisSession) ? Number(raw.killsThisSession) :
    0;

  const durationMs =
    Number.isFinite(raw.durationMs) ? Number(raw.durationMs) :
    endedAt && startedAt ? Math.max(0, endedAt - startedAt) :
    0;

  const id =
    (typeof raw.id === "string" && raw.id.trim()) ? raw.id :
    `sess_${endedAt || Date.now()}_${index}`;

  const species =
    (typeof raw.species === "string" && raw.species.trim()) ? raw.species.trim() :
    "Unknown";

  const obtained = Boolean(raw.obtained);

  return {
    id,
    species,
    startedAt,
    endedAt,
    durationMs,
    kills,
    obtained,
  };
}

type SortMode = "newest" | "oldest" | "kills_desc" | "kills_asc" | "duration_desc" | "duration_asc";

export default function SessionHistoryScreen() {
  const [sessions, setSessions] = useState<ReturnType<typeof normalize>[]>([]);
  const [query, setQuery] = useState("");
  const [onlyObtained, setOnlyObtained] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const load = () => {
    try {
      const raw = readSessionHistory();
      const list = Array.isArray(raw) ? raw : [];
      const normalized = list.map((s: AnySession, i: number) => normalize(s, i));
      setSessions(normalized);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    load();

    // Refresh on focus + storage updates (still read-only)
    const onFocus = () => load();
    const onStorage = (e: StorageEvent) => {
      // Only reload if something in localStorage changed (cheap + safe)
      if (e.storageArea === localStorage) load();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalKills = sessions.reduce((acc, s) => acc + safeNumber(s.kills, 0), 0);
    const totalMs = sessions.reduce((acc, s) => acc + safeNumber(s.durationMs, 0), 0);
    const obtainedSessions = sessions.filter((s) => s.obtained).length;

    const killsPerHour = totalMs > 0 ? (totalKills / (totalMs / 3600000)) : 0;

    return {
      totalSessions,
      totalKills,
      totalMs,
      obtainedSessions,
      killsPerHour,
    };
  }, [sessions]);

  const speciesOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) set.add(s.species);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = sessions.slice();

    if (q) {
      list = list.filter((s) => s.species.toLowerCase().includes(q));
    }

    if (onlyObtained) {
      list = list.filter((s) => s.obtained);
    }

    list.sort((a, b) => {
      const aEnd = safeNumber(a.endedAt, 0);
      const bEnd = safeNumber(b.endedAt, 0);
      const aKills = safeNumber(a.kills, 0);
      const bKills = safeNumber(b.kills, 0);
      const aDur = safeNumber(a.durationMs, 0);
      const bDur = safeNumber(b.durationMs, 0);

      switch (sortMode) {
        case "oldest":
          return aEnd - bEnd;
        case "kills_desc":
          return bKills - aKills;
        case "kills_asc":
          return aKills - bKills;
        case "duration_desc":
          return bDur - aDur;
        case "duration_asc":
          return aDur - bDur;
        case "newest":
        default:
          return bEnd - aEnd;
      }
    });

    return list;
  }, [sessions, query, onlyObtained, sortMode]);

  if (!sessions.length) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-300 font-semibold">Session History</div>
        <div className="mt-2 text-sm text-gray-400">No session history yet.</div>
        <button
          onClick={load}
          className="mt-4 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-300 font-semibold">Session History</div>
          <div className="text-xs text-gray-500 mt-1">
            Read-only timeline of ended sessions.
          </div>
        </div>

        <button
          onClick={load}
          className="shrink-0 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
          title="Reload from storage"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="text-xs text-gray-500">Sessions</div>
          <div className="text-lg font-semibold text-gray-100">{pretty(stats.totalSessions)}</div>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="text-xs text-gray-500">Total Kills</div>
          <div className="text-lg font-semibold text-gray-100">{pretty(stats.totalKills)}</div>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="text-xs text-gray-500">Total Time</div>
          <div className="text-lg font-semibold text-gray-100">{formatDuration(stats.totalMs)}</div>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="text-xs text-gray-500">Kills / Hour</div>
          <div className="text-lg font-semibold text-gray-100">
            {Number.isFinite(stats.killsPerHour) ? stats.killsPerHour.toFixed(1) : "0.0"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Filter by species</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={speciesOptions.length ? `Type e.g. "${speciesOptions[0]}"` : "Type species..."}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-200 select-none">
            <input
              type="checkbox"
              checked={onlyObtained}
              onChange={(e) => setOnlyObtained(e.target.checked)}
            />
            Obtained only
          </label>

          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Sort</div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-lg border border-gray-700 bg-gray-950 px-2 py-2 text-sm text-gray-100 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="kills_desc">Kills ↓</option>
              <option value="kills_asc">Kills ↑</option>
              <option value="duration_desc">Duration ↓</option>
              <option value="duration_asc">Duration ↑</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Showing <span className="text-gray-300">{pretty(filtered.length)}</span> of{" "}
          <span className="text-gray-300">{pretty(sessions.length)}</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-gray-700 bg-gray-900 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-100 truncate">{s.species}</div>
                  {s.obtained ? (
                    <span className="text-xs rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                      Obtained
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Ended: <span className="text-gray-300">{formatDate(s.endedAt)}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Kills</div>
                <div className="text-sm font-semibold text-gray-100">{pretty(s.kills)}</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-2">
                <div className="text-xs text-gray-500">Duration</div>
                <div className="text-gray-200">{formatDuration(s.durationMs)}</div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-2">
                <div className="text-xs text-gray-500">Started</div>
                <div className="text-gray-200">{s.startedAt ? formatDate(s.startedAt) : "—"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
