// utils/sessionHistory.ts
// Read-only session history helpers
// No store access, no mutations, localStorage only

export type SessionSnapshot = {
  kills: number;
  durationMs: number;
  createdAt: number;
};

const HISTORY_KEY = "greatonegrind_session_history_v1";
const MAX_SESSIONS = 50;

export function loadSessionHistory(): SessionSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}

export function appendSessionToHistory(snapshot: SessionSnapshot) {
  try {
    const existing = loadSessionHistory();
    const next = [snapshot, ...existing].slice(0, MAX_SESSIONS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // intentionally silent
  }
}

export function clearSessionHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
