// src/utils/sessionHistory.ts
// Single source of truth for session history (NO history.js dependency)

export const SESSION_HISTORY_KEY = "greatonegrind_session_history_v1";
export const SESSION_HISTORY_EVENT = "greatonegrind:session_history_updated";

/**
 * SessionHistoryEntry (v1)
 * Backward compatible:
 * - Old entries may only contain species/kills/duration-like fields
 * - We normalize on read so UI/stats can rely on safe numbers
 */
export type SessionHistoryEntry = {
  kind: "session_history_v1";
  endedAt: number; // timestamp when session ended

  species: string;

  // core
  durationMs: number;
  killsThisSession: number;

  // v1.0.2 additions
  diamondsThisSession: number;
  raresThisSession: number;

  // optional/future-safe
  obtained?: boolean;
  fur?: string;
};

function safeInt(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function safeStr(v: any): string {
  return typeof v === "string" ? v : "";
}

function fireHistoryUpdated() {
  try {
    window.dispatchEvent(new Event(SESSION_HISTORY_EVENT));
  } catch {
    // ignore
  }
}

function normalizeEntry(raw: any): SessionHistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;

  const species = safeStr((raw as any).species).trim() || "Unknown";

  const endedAt =
    safeInt((raw as any).endedAt) ||
    safeInt((raw as any).createdAt) ||
    safeInt((raw as any).timestamp) ||
    Date.now();

  const durationMs =
    safeInt((raw as any).durationMs) ||
    safeInt((raw as any).duration) ||
    safeInt((raw as any).ms) ||
    0;

  const killsThisSession =
    safeInt((raw as any).killsThisSession) ||
    safeInt((raw as any).kills) ||
    safeInt((raw as any).sessionKills) ||
    0;

  const diamondsThisSession = safeInt((raw as any).diamondsThisSession);
  const raresThisSession = safeInt((raw as any).raresThisSession);

  const obtained =
    typeof (raw as any).obtained === "boolean" ? ((raw as any).obtained as boolean) : undefined;

  const fur = safeStr((raw as any).fur).trim() || undefined;

  return {
    kind: "session_history_v1",
    endedAt,
    species,
    durationMs,
    killsThisSession,
    diamondsThisSession,
    raresThisSession,
    obtained,
    fur,
  };
}

export function readSessionHistory(): SessionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    const out: SessionHistoryEntry[] = [];
    for (const item of parsed) {
      const n = normalizeEntry(item);
      if (n) out.push(n);
    }
    return out;
  } catch {
    return [];
  }
}

export function appendSessionHistory(entry: Partial<SessionHistoryEntry>, max: number = 500) {
  const list = readSessionHistory();

  const normalized = normalizeEntry({
    ...entry,
    kind: "session_history_v1",
    endedAt: safeInt((entry as any).endedAt) || Date.now(),
  });

  if (!normalized) return;

  list.unshift(normalized);

  if (list.length > max) {
    list.length = max;
  }

  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(list));
  fireHistoryUpdated();
}

export function clearSessionHistory() {
  localStorage.removeItem(SESSION_HISTORY_KEY);
  fireHistoryUpdated();
}
