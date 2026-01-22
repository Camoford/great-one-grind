// utils/sessionHistory.ts
// Thin re-export wrapper so TS files can import session history cleanly.
// Source of truth remains: /history.js (project root).

// Vite supports importing .js from .ts
// We re-export the functions expected by Archive.

import * as history from "../history.js";

export const SESSION_HISTORY_KEY =
  (history as any).SESSION_HISTORY_KEY ?? "greatonegrind_session_history_v1";

export function readSessionHistory(): any[] {
  const fn = (history as any).readSessionHistory;
  if (typeof fn === "function") return fn();
  return [];
}

export function appendSessionHistory(entry: any, max: number = 500) {
  const fn = (history as any).appendSessionHistory;
  if (typeof fn === "function") return fn(entry, max);
}

export function clearSessionHistory() {
  const fn = (history as any).clearSessionHistory;
  if (typeof fn === "function") return fn();
}
