import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * SessionSummaryModal — defensive, read-only, self-healing
 *
 * Goal:
 * - Show a session summary when a session ends.
 * - Do NOT mutate store/session data.
 * - Work even if event names drift between branches.
 *
 * How it works:
 * 1) Listens for several possible window events (CustomEvent).
 * 2) Also reads localStorage for the latest session summary snapshot.
 * 3) When it detects a "new" ended session, it opens the modal.
 */

type AnyObj = Record<string, any>;

function safeParse(raw: string | null): AnyObj | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

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

function formatDuration(ms: number | null | undefined) {
  const v = Number(ms);
  if (!Number.isFinite(v) || v <= 0) return "0:00";
  const totalSec = Math.max(0, Math.floor(v / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function formatDateTime(ts: number | null | undefined) {
  const v = Number(ts);
  if (!Number.isFinite(v) || v <= 0) return "";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return "";
  }
}

/**
 * Try to locate a session summary snapshot in localStorage.
 * We support multiple possible keys and shapes to survive refactors.
 */
function readLatestSummaryFromStorage(): AnyObj | null {
  const candidates = [
    // common protected keys people use
    "greatonegrind_session_summary_protected_v1",
    "greatonegrind_session_summary_v1",
    "greatonegrind_last_session_summary",
    "session_summary",
    "SessionSummary",
  ];

  for (const key of candidates) {
    const obj = safeParse(localStorage.getItem(key));
    if (obj && (obj.endedAt || obj.endTs || obj.endTime || obj.end)) {
      return { ...obj, __key: key };
    }
  }

  // fallback: scan localStorage for anything that looks like a summary
  // (bounded scan, defensive)
  try {
    const max = Math.min(localStorage.length, 80);
    for (let i = 0; i < max; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!/summary/i.test(k)) continue;
      const obj = safeParse(localStorage.getItem(k));
      if (obj && (obj.endedAt || obj.endTs || obj.endTime || obj.end)) {
        return { ...obj, __key: k };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Normalize different summary shapes into a single view model.
 * This stays read-only.
 */
function normalizeSummary(raw: AnyObj): AnyObj {
  const startedAt =
    raw.startedAt ??
    raw.startTs ??
    raw.startTime ??
    raw.start ??
    raw.sessionStart ??
    null;

  const endedAt =
    raw.endedAt ??
    raw.endTs ??
    raw.endTime ??
    raw.end ??
    raw.sessionEnd ??
    null;

  const durationMs =
    raw.durationMs ??
    raw.duration ??
    raw.elapsedMs ??
    raw.elapsed ??
    (Number(endedAt) && Number(startedAt)
      ? Number(endedAt) - Number(startedAt)
      : null);

  const kills =
    raw.kills ??
    raw.totalKills ??
    raw.killsThisSession ??
    raw.sessionKills ??
    raw.count ??
    0;

  const species = raw.species ?? raw.activeSpecies ?? raw.grindSpecies ?? "";

  const pace =
    raw.pace ??
    raw.pacePerHour ??
    raw.kph ??
    raw.killsPerHour ??
    null;

  const note =
    raw.note ??
    raw.summaryNote ??
    raw.message ??
    "";

  return {
    ...raw,
    __startedAt: startedAt,
    __endedAt: endedAt,
    __durationMs: durationMs,
    __kills: kills,
    __species: species,
    __pace: pace,
    __note: note,
  };
}

export default function SessionSummaryModal() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AnyObj | null>(null);

  // remember last seen endedAt so we only pop once per session
  const lastSeenEndRef = useRef<number>(0);

  const normalized = useMemo(() => {
    if (!summary) return null;
    return normalizeSummary(summary);
  }, [summary]);

  function close() {
    setOpen(false);
  }

  function maybeOpenFromRaw(raw: AnyObj | null) {
    if (!raw) return;
    const n = normalizeSummary(raw);
    const end = Number(n.__endedAt);
    if (!Number.isFinite(end) || end <= 0) return;

    if (end > lastSeenEndRef.current) {
      lastSeenEndRef.current = end;
      setSummary(raw);
      setOpen(true);
    }
  }

  useEffect(() => {
    // 1) On mount: try to open if a recent summary exists
    try {
      maybeOpenFromRaw(readLatestSummaryFromStorage());
    } catch {
      // ignore
    }

    // 2) Listen for multiple possible custom events
    const eventNames = [
      // common patterns
      "greatonegrind:sessionSummary",
      "greatonegrind_session_summary",
      "sessionSummary",
      "SESSION_SUMMARY",
      "greatonegrind:sessionEnded",
      "greatonegrind_session_ended",
    ];

    const onAny = (e: Event) => {
      const ce = e as CustomEvent<any>;
      const detail = ce?.detail;
      if (detail && typeof detail === "object") {
        maybeOpenFromRaw(detail);
      } else {
        // if event has no detail, fallback to storage read
        try {
          maybeOpenFromRaw(readLatestSummaryFromStorage());
        } catch {
          // ignore
        }
      }
    };

    for (const name of eventNames) {
      window.addEventListener(name, onAny as any);
    }

    // 3) Also react to localStorage changes (other tabs / future code)
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (!/summary/i.test(e.key)) return;
      try {
        maybeOpenFromRaw(readLatestSummaryFromStorage());
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);

    // 4) ESC to close
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    // 5) Small polling fallback (covers same-tab localStorage writes without events)
    const t = window.setInterval(() => {
      try {
        maybeOpenFromRaw(readLatestSummaryFromStorage());
      } catch {
        // ignore
      }
    }, 1200);

    return () => {
      for (const name of eventNames) {
        window.removeEventListener(name, onAny as any);
      }
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("keydown", onKey);
      window.clearInterval(t);
    };
  }, []);

  if (!open || !normalized) return null;

  const titleSpecies =
    normalized.__species ? String(normalized.__species) : "Session";

  const kills = Number(normalized.__kills) || 0;
  const pace = normalized.__pace;
  const paceText =
    pace === null || pace === undefined || pace === ""
      ? "—"
      : `${pretty(Number(pace))}/hr`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <button
        aria-label="Close session summary"
        className="absolute inset-0 bg-black/70"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/60">Session Summary</div>
            <div className="text-xl font-semibold">{titleSpecies}</div>
          </div>

          <button
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
            onClick={close}
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Kills</div>
            <div className="text-lg font-semibold">{pretty(kills)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Duration</div>
            <div className="text-lg font-semibold">
              {formatDuration(normalized.__durationMs)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Pace</div>
            <div className="text-lg font-semibold">{paceText}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Ended</div>
            <div className="text-sm font-medium">
              {formatDateTime(normalized.__endedAt) || "—"}
            </div>
          </div>
        </div>

        {normalized.__note ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Note</div>
            <div className="text-sm">{String(normalized.__note)}</div>
          </div>
        ) : null}

        {/* Debug hint (read-only) */}
        <div className="mt-3 text-[11px] text-white/35">
          Source:{" "}
          {normalized.__key ? String(normalized.__key) : "event/storage"}
        </div>
      </div>
    </div>
  );
}
