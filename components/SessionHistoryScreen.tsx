// components/SessionHistoryScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { readSessionHistory } from "../utils/sessionHistory.ts";

/**
 * Phase 16A — Session History (READ-ONLY)
 * UI only. No writes. No grinder logic.
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

function pretty(n: number) {
  return new Intl.NumberFormat().format(n || 0);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function formatDate(ts?: number) {
  try {
    return ts ? new Date(ts).toLocaleString() : "";
  } catch {
    return "";
  }
}

function normalize(raw: AnySession, i: number) {
  const endedAt = raw.endedAt || 0;
  const startedAt = raw.startedAt || 0;

  return {
    id: raw.id || `sess_${endedAt}_${i}`,
    species: raw.species || "Unknown",
    startedAt,
    endedAt,
    durationMs:
      raw.durationMs ??
      (endedAt && startedAt ? endedAt - startedAt : 0),
    kills:
      raw.kills ??
      raw.killsThisSession ??
      0,
    obtained: Boolean(raw.obtained),
  };
}

type SortMode =
  | "newest"
  | "oldest"
  | "kills_desc"
  | "kills_asc";

export default function SessionHistoryScreen() {
  const [sessions, setSessions] = useState<ReturnType<typeof normalize>[]>([]);
  const [query, setQuery] = useState("");
  const [onlyObtained, setOnlyObtained] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    try {
      const raw = readSessionHistory();
      const list = Array.isArray(raw) ? raw : [];
      setSessions(list.map(normalize));
    } catch {
      setSessions([]);
    }
  }, []);

  const filtered = useMemo(() => {
    let list = sessions.slice();

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) =>
        s.species.toLowerCase().includes(q)
      );
    }

    if (onlyObtained) {
      list = list.filter((s) => s.obtained);
    }

    list.sort((a, b) => {
      if (sortMode === "oldest") return a.endedAt - b.endedAt;
      if (sortMode === "kills_desc") return b.kills - a.kills;
      if (sortMode === "kills_asc") return a.kills - b.kills;
      return b.endedAt - a.endedAt;
    });

    return list;
  }, [sessions, query, onlyObtained, sortMode]);

  if (!sessions.length) {
    return (
      <div className="p-4 text-sm text-gray-400">
        No session history yet.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by species…"
          className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
        />

        <select
          value={sortMode}
          onChange={(e) =>
            setSortMode(e.target.value as SortMode)
          }
          className="rounded border border-gray-700 bg-gray-900 px-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="kills_desc">Kills ↓</option>
          <option value="kills_asc">Kills ↑</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyObtained}
          onChange={(e) => setOnlyObtained(e.target.checked)}
        />
        Obtained only
      </label>

      {filtered.map((s) => (
        <div
          key={s.id}
          className="rounded border border-gray-700 bg-gray-900 p-3"
        >
          <div className="flex justify-between">
            <div className="font-semibold">{s.species}</div>
            <div className="text-xs text-gray-400">
              {formatDate(s.endedAt)}
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-300">
            <div>Kills: <strong>{pretty(s.kills)}</strong></div>
            <div>Duration: {formatDuration(s.durationMs)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
