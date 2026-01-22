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
const MAX_ITEMS = 50;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Read session history (newest last)
 */
export function getSessionHistory(): SessionHistoryItem[] {
  const data = safeJsonParse<unknown>(localStorage.getItem(KEY));
  if (!Array.isArray(data)) return [];

  return data.filter(
    (x) =>
      x &&
      typeof x === "object" &&
      typeof (x as any).startedAt === "number" &&
      typeof (x as any).endedAt === "number"
  ) as SessionHistoryItem[];
}

/**
 * Append a completed session to history
 * Defensive, bounded, and side-effect free.
 */
export function appendSessionToHistory(
  item: SessionHistoryItem
): void {
  try {
    const list = getSessionHistory();
    const next = [...list, item].slice(-MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore — history is non-critical
  }
}
