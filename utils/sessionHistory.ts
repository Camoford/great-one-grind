// utils/sessionHistory.ts
// Read-only Session History storage + retrieval
// Safe, defensive, no app-state mutation.

export type SessionHistoryItem = {
  startedAt: number;
  endedAt: number;
  durationMs: number;
  kills: number;
  // optional: extra snapshot fields can exist, we ignore them safely
  [key: string]: any;
};

const KEY = "greatonegrind_session_history_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getSessionHistory(): SessionHistoryItem[] {
  const data = safeJsonParse<unknown>(localStorage.getItem(KEY));
  if (!Array.isArray(data)) return [];

  // sanitize
  return data
    .filter((x) => x && typeof x === "object")
    .map((x: any) => ({
      startedAt: Number(x.startedAt || 0),
      endedAt: Number(x.endedAt || 0),
      durationMs: Number(x.durationMs || 0),
      kills: Number(x.kills || x.sessionKills || 0),
      ...x,
    }))
    .filter((s) => Number.isFinite(s.startedAt) && s.startedAt > 0);
}

export function appendSessionHistory(item: SessionHistoryItem) {
  const list = getSessionHistory();
  list.push(item);

  // cap (keep last 200 to avoid bloat)
  const capped = list.slice(-200);
  localStorage.setItem(KEY, JSON.stringify(capped));
}

export function clearSessionHistory() {
  localStorage.removeItem(KEY);
}
