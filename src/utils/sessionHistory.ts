// src/utils/sessionHistory.ts
// Single source of truth for session history (NO history.js dependency)

export const SESSION_HISTORY_KEY = "greatonegrind_session_history_v1";

export function readSessionHistory(): any[] {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendSessionHistory(entry: any, max: number = 500) {
  const list = readSessionHistory();
  list.unshift(entry);

  if (list.length > max) {
    list.length = max;
  }

  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(list));
}

export function clearSessionHistory() {
  localStorage.removeItem(SESSION_HISTORY_KEY);
}
