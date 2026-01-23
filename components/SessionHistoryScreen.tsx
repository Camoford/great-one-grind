// components/SessionHistoryScreen.tsx
import React, { useEffect, useState } from "react";

/**
 * Phase 16A — Session History (READ-ONLY)
 *
 * - Displays past session summaries
 * - No mutations
 * - No grinder logic
 * - Safe to mount anywhere
 */

type SessionSummary = {
  id: string;
  species: string;
  kills: number;
  durationMs: number;
  startedAt: number;
  endedAt: number;
};

const STORAGE_KEY = "greatonegrind_session_history_v1";

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function SessionHistoryScreen() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setSessions(parsed);
      }
    } catch {
      setSessions([]);
    }
  }, []);

  if (!sessions.length) {
    return (
      <div className="p-4 text-sm text-gray-400">
        No session history yet.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-gray-700 bg-gray-900 p-3"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold">{s.species}</div>
            <div className="text-xs text-gray-400">
              {formatDate(s.endedAt)}
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-300">
            <div>Kills: <strong>{s.kills}</strong></div>
            <div>Duration: {formatDuration(s.durationMs)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
