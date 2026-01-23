// components/SessionHistoryScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { readSessionHistory } from "../src/utils/sessionHistory";

/**
 * Phase 16C-A1 — Session History UI Polish (READ-ONLY)
 * - UI only (no writes)
 * - Group by day (Today / Yesterday / Date)
 * - Grinder-friendly rows + better empty states
 * - Search + obtained-only + sort + clear filters
 */

type AnySession = {
  id?: string;
  species?: string;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  kills?: number;
  killsThisSession?: number;
  obtained?: boolean;
};

type Row = {
  id: string;
  species: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  kills: number;
  obtained: boolean;
};

type SortMode = "newest" | "oldest" | "kills_desc" | "kills_asc";

function safeNum(v: any, fallback: number = 0) {
  return Number.isFinite(v) ? Number(v) : fallback;
}

function pretty(n: number) {
  try {
    return new Intl.NumberFormat().format(n || 0);
  } catch {
    return String(n || 0);
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(Math.max(0, safeNum(ms, 0)) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function formatTime(ts: number) {
  try {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDayLabel(ts: number) {
  try {
    if (!ts) return "Unknown";
    const d = new Date(ts);

    const today = new Date();
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const y0 = t0 - 24 * 60 * 60 * 1000;

    const x0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    if (x0 === t0) return "Today";
    if (x0 === y0) return "Yesterday";

    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "Unknown";
  }
}

function normalize(raw: AnySession, i: number): Row {
  const endedAt = safeNum(raw.endedAt, 0);
  const startedAt = safeNum(raw.startedAt, 0);

  const kills =
    Number.isFinite(raw.kills) ? Number(raw.kills) :
    Number.isFinite(raw.killsThisSession) ? Number(raw.killsThisSession) :
    0;

  const durationMs =
    Number.isFinite(raw.durationMs) ? Number(raw.durationMs) :
    endedAt && startedAt ? Math.max(0, endedAt - startedAt) :
    0;

  return {
    id: (typeof raw.id === "string" && raw.id.trim())
      ? raw.id
      : `sess_${endedAt || Date.now()}_${i}`,
    species: (typeof raw.species === "string" && raw.species.trim())
      ? raw.species
      : "Unknown",
    startedAt,
    endedAt,
    durationMs,
    kills,
    obtained: Boolean(raw.obtained),
  };
}

function sortLabel(mode: SortMode) {
  if (mode === "newest") return "Newest";
  if (mode === "oldest") return "Oldest";
  if (mode === "kills_desc") return "Kills ↓";
  return "Kills ↑";
}

export default function SessionHistoryScreen() {
  const [sessions, setSessions] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [onlyObtained, setOnlyObtained] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const load = () => {
    try {
      const raw = readSessionHistory();
      const list = Array.isArray(raw) ? raw : [];
      setSessions(list.map((s: AnySession, i: number) => normalize(s, i)));
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = sessions.slice();
    const q = query.trim().toLowerCase();

    if (q) list = list.filter((s) => s.species.toLowerCase().includes(q));
    if (onlyObtained) list = list.filter((s) => s.obtained);

    list.sort((a, b) => {
      const aT = a.endedAt || a.startedAt;
      const bT = b.endedAt || b.startedAt;

      if (sortMode === "oldest") return aT - bT;
      if (sortMode === "kills_desc") return b.kills - a.kills;
      if (sortMode === "kills_asc") return a.kills - b.kills;
      return bT - aT; // newest
    });

    return list;
  }, [sessions, query, onlyObtained, sortMode]);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    const keys: string[] = [];

    for (const s of filtered) {
      const key = formatDayLabel(s.endedAt || s.startedAt);
      if (!map.has(key)) {
        map.set(key, []);
        keys.push(key);
      }
      map.get(key)!.push(s);
    }

    return keys.map((k) => ({ key: k, list: map.get(k) || [] }));
  }, [filtered]);

  const clearFilters = () => {
    setQuery("");
    setOnlyObtained(false);
    setSortMode("newest");
  };

  // Empty: no sessions at all
  if (!sessions.length) {
    return (
      <div className="p-4">
        <div className="rounded border border-gray-800 bg-gray-950 p-4">
          <div className="text-sm font-semibold text-gray-100">Session History</div>
          <div className="mt-1 text-sm text-gray-400">
            No session history yet. Start a session, then hit <span className="text-gray-200">End</span>.
          </div>
        </div>
      </div>
    );
  }

  const hasFilters = Boolean(query.trim()) || onlyObtained || sortMode !== "newest";

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-100">Session History</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Showing <span className="text-gray-200">{pretty(filtered.length)}</span> session(s)
            <span className="text-gray-700"> • </span>
            Sort: <span className="text-gray-300">{sortLabel(sortMode)}</span>
          </div>
        </div>

        <button
          onClick={load}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm hover:bg-gray-800"
          title="Reload from storage (read-only)"
        >
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="rounded border border-gray-800 bg-gray-950 p-3 space-y-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by species…"
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
          />

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded border border-gray-700 bg-gray-900 px-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={onlyObtained}
              onChange={(e) => setOnlyObtained(e.target.checked)}
            />
            Obtained only
          </label>

          {hasFilters ? (
            <button
              onClick={clearFilters}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm hover:bg-gray-800"
              title="Clear filters (UI only)"
            >
              Clear
            </button>
          ) : (
            <div className="text-xs text-gray-600">Tip: filter by species</div>
          )}
        </div>
      </div>

      {/* Empty state for filters */}
      {!filtered.length ? (
        <div className="rounded border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
          No sessions match your filters.
          {hasFilters ? (
            <div className="mt-2">
              <button
                onClick={clearFilters}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm hover:bg-gray-800"
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Grouped list */}
      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.key} className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between">
              <div>
                {g.key} <span className="text-gray-700">•</span>{" "}
                <span className="text-gray-400">{pretty(g.list.length)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {g.list.map((s) => (
                <div
                  key={s.id}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold truncate text-gray-100">{s.species}</div>
                        {s.obtained ? (
                          <span className="text-[10px] rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                            Obtained
                          </span>
                        ) : (
                          <span className="text-[10px] rounded-full border border-gray-700 bg-gray-950 px-2 py-0.5 text-gray-400">
                            Session
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatTime(s.startedAt)} → {formatTime(s.endedAt)}
                        <span className="text-gray-700"> • </span>
                        {formatDuration(s.durationMs)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Kills</div>
                      <div className="text-sm font-semibold text-gray-100">{pretty(s.kills)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
