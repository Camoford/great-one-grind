// components/SessionSummaryModal.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * SessionSummaryModal — Session Outcomes v2 (SAFE / READ-ONLY)
 * - Opens ONLY when SessionHUD dispatches event
 * - Storage is fallback ONLY when event fires without detail
 * - NEVER mutates store
 * - On close: clears protected localStorage snapshot so it won't re-open on refresh
 *
 * Adds (UI-only):
 * - Clear "Outcome" header (Ended / Obtained hint)
 * - Pace (kills/hour) + kills/min
 * - Optional timestamps
 * - Copy Summary + Report Issue buttons
 */

const SUMMARY_KEY = "greatonegrind_session_summary_v1";
const SUMMARY_EVENT = "greatonegrind:session_summary";

type Summary = {
  kind?: string;
  createdAt?: number;

  // existing fields used by v1
  species?: string;
  durationMs?: number;
  killsThisSession?: number;
  totalKillsForSpecies?: number;
  fur?: string;

  // Optional future-friendly fields (safe if absent)
  startedAt?: number;
  endedAt?: number;
  trophiesAdded?: number;
  notes?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function pretty(n: number) {
  const x = Number.isFinite(n) ? (n as number) : 0;
  try {
    return new Intl.NumberFormat().format(x);
  } catch {
    return String(x);
  }
}

function fmtRate(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0";
  // keep it readable: 0–999 show 1 decimal, 1000+ no decimals
  if (n >= 1000) return String(Math.round(n));
  return (Math.round(n * 10) / 10).toFixed(n < 10 ? 2 : 1).replace(/\.?0+$/, "");
}

function fmtDateTime(ts?: number) {
  if (!ts || !Number.isFinite(ts)) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function safeParse(raw: string | null): Summary | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as Summary) : null;
  } catch {
    return null;
  }
}

function openMailto(to: string, subject: string, body: string) {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  window.location.href = `mailto:${to}?subject=${s}&body=${b}`;
}

export default function SessionSummaryModal() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);

  const snapshot = useMemo(() => {
    if (!summary) return null;

    const kindRaw = (summary.kind || "").trim();
    const kind = kindRaw.toLowerCase();

    const obtainedHint =
      kind.includes("obtained") ||
      kind.includes("trophy") ||
      kind.includes("greatone") ||
      kind.includes("great_one");

    const species = (summary.species || "Unknown").trim() || "Unknown";
    const durationMs = Number.isFinite(summary.durationMs) ? (summary.durationMs as number) : 0;
    const duration = fmtDuration(durationMs);

    const killsSession = Number.isFinite(summary.killsThisSession) ? (summary.killsThisSession as number) : 0;
    const totalKills = Number.isFinite(summary.totalKillsForSpecies) ? (summary.totalKillsForSpecies as number) : 0;

    const fur = (summary.fur || "").trim();

    const hours = durationMs > 0 ? durationMs / 3600000 : 0;
    const minutes = durationMs > 0 ? durationMs / 60000 : 0;

    const killsPerHour = hours > 0 ? killsSession / hours : 0;
    const killsPerMin = minutes > 0 ? killsSession / minutes : 0;

    const createdAt = summary.createdAt && Number.isFinite(summary.createdAt) ? (summary.createdAt as number) : 0;
    const startedAt = summary.startedAt && Number.isFinite(summary.startedAt) ? (summary.startedAt as number) : 0;
    const endedAt = summary.endedAt && Number.isFinite(summary.endedAt) ? (summary.endedAt as number) : 0;

    const endedDisplay = endedAt || createdAt || Date.now();
    const startedDisplay = startedAt || (durationMs > 0 ? endedDisplay - durationMs : 0);

    // Optional "trophiesAdded" field (safe if absent)
    const trophiesAdded = Number.isFinite((summary as any).trophiesAdded) ? ((summary as any).trophiesAdded as number) : 0;

    // Outcome label: default to "Session ended"
    const outcomeTitle = obtainedHint ? "Session ended — Obtained" : "Session ended";
    const outcomeSub =
      obtainedHint
        ? "Nice. This session ended with an obtained/trophy event."
        : "Your session ended normally. Totals shown for quick tracking.";

    return {
      kindRaw,
      obtainedHint,
      outcomeTitle,
      outcomeSub,

      species,
      duration,
      durationMs,

      killsSession,
      totalKills,
      fur,

      killsPerHour,
      killsPerMin,

      startedDisplay,
      endedDisplay,

      trophiesAdded,
    };
  }, [summary]);

  function loadFromStorage(): Summary | null {
    try {
      return safeParse(localStorage.getItem(SUMMARY_KEY));
    } catch {
      return null;
    }
  }

  function closeAndClear() {
    try {
      localStorage.removeItem(SUMMARY_KEY);
    } catch {
      // ignore
    }
    setCopied(false);
    setOpen(false);
  }

  async function handleCopy() {
    if (!snapshot) return;

    const lines: string[] = [];
    lines.push("Great One Grind — Session Outcomes");
    lines.push(`Outcome: ${snapshot.outcomeTitle}`);
    lines.push(`Species: ${snapshot.species}`);
    lines.push(`Duration: ${snapshot.duration}`);
    lines.push(`Kills (session): ${snapshot.killsSession}`);
    lines.push(`Total kills (species): ${snapshot.totalKills}`);
    lines.push(`Pace: ${fmtRate(snapshot.killsPerHour)} kills/hr (${fmtRate(snapshot.killsPerMin)} kills/min)`);
    if (snapshot.fur) lines.push(`Fur: ${snapshot.fur}`);
    lines.push(`Started: ${fmtDateTime(snapshot.startedDisplay) || "—"}`);
    lines.push(`Ended: ${fmtDateTime(snapshot.endedDisplay) || "—"}`);
    if (snapshot.trophiesAdded > 0) lines.push(`Trophies added: ${snapshot.trophiesAdded}`);

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: do nothing
      setCopied(false);
    }
  }

  function handleReportIssue() {
    if (!snapshot) return;

    const ua = (() => {
      try {
        return navigator.userAgent || "unknown";
      } catch {
        return "unknown";
      }
    })();

    const subject = "Great One Grind — Beta Issue Report";
    const body = [
      "What happened (expected vs actual):",
      "",
      "",
      "Steps to reproduce:",
      "1)",
      "2)",
      "3)",
      "",
      "Attach a screenshot/screen recording if possible.",
      "",
      "---- Session context (auto) ----",
      `Species: ${snapshot.species}`,
      `Duration: ${snapshot.duration}`,
      `Kills (session): ${snapshot.killsSession}`,
      `Total kills (species): ${snapshot.totalKills}`,
      `Pace: ${fmtRate(snapshot.killsPerHour)} kills/hr`,
      snapshot.fur ? `Fur: ${snapshot.fur}` : "Fur: —",
      `Ended: ${fmtDateTime(snapshot.endedDisplay) || "—"}`,
      "",
      "---- Device (auto) ----",
      ua,
      "",
    ].join("\n");

    openMailto("carnley87@gmail.com", subject, body);
  }

  useEffect(() => {
    const onEvent = (e: Event) => {
      // Priority 1: event detail
      try {
        const ce = e as CustomEvent;
        const detail = (ce && (ce as any).detail) as Summary | undefined;
        if (detail && typeof detail === "object") {
          setSummary(detail);
          setOpen(true);
          return;
        }
      } catch {
        // ignore
      }

      // Priority 2: fallback to storage ONLY when the event fires
      const stored = loadFromStorage();
      if (stored) {
        setSummary(stored);
        setOpen(true);
      }
    };

    window.addEventListener(SUMMARY_EVENT, onEvent as any);

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeAndClear();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener(SUMMARY_EVENT, onEvent as any);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open || !snapshot) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={closeAndClear}
      role="dialog"
      aria-modal="true"
      aria-label="Session outcomes modal"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-white truncate">{snapshot.outcomeTitle}</div>

              {snapshot.obtainedHint ? (
                <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                  Obtained
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/70">
                  Ended
                </span>
              )}
            </div>

            <div className="mt-0.5 text-xs text-white/60 leading-relaxed">{snapshot.outcomeSub}</div>
          </div>

          <button
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            onClick={closeAndClear}
            title="Close"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="mt-3 space-y-2 text-sm">
          {/* Species */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Species</div>
            <div className="font-semibold text-white truncate">{snapshot.species}</div>
          </div>

          {/* Core stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Duration</div>
              <div className="font-semibold text-white">{snapshot.duration}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Kills (session)</div>
              <div className="font-semibold text-white">{pretty(snapshot.killsSession)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Total kills (species)</div>
            <div className="font-semibold text-white">{pretty(snapshot.totalKills)}</div>
          </div>

          {/* Pace */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Pace (kills/hr)</div>
              <div className="font-semibold text-white">{fmtRate(snapshot.killsPerHour)}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Kills / min</div>
              <div className="font-semibold text-white">{fmtRate(snapshot.killsPerMin)}</div>
            </div>
          </div>

          {/* Optional fur */}
          {snapshot.fur ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Fur</div>
              <div className="font-semibold text-white">{snapshot.fur}</div>
            </div>
          ) : null}

          {/* Timestamps */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/60">Time</div>
            <div className="mt-1 space-y-1 text-xs text-white/75">
              <div>
                <span className="text-white/60">Started:</span>{" "}
                <span className="text-white/85">{fmtDateTime(snapshot.startedDisplay) || "—"}</span>
              </div>
              <div>
                <span className="text-white/60">Ended:</span>{" "}
                <span className="text-white/85">{fmtDateTime(snapshot.endedDisplay) || "—"}</span>
              </div>
            </div>
          </div>

          {/* “Saved” note (UI-only) */}
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-white/80">
            <span className="font-medium text-emerald-200">Saved:</span>{" "}
            <span className="text-white/75">
              This session should appear in <span className="text-white/85">History</span>. If it doesn’t, refresh and try again.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            onClick={handleCopy}
            title="Copy session outcomes"
          >
            {copied ? "Copied ✅" : "Copy Summary"}
          </button>

          <button
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            onClick={handleReportIssue}
            title="Email a bug report"
          >
            Report Issue
          </button>

          <button
            className="col-span-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            onClick={closeAndClear}
            title="Continue grinding"
          >
            Continue
          </button>
        </div>

        <div className="mt-2 text-center text-[11px] text-white/45">
          Tip: press ESC or click outside to close
        </div>
      </div>
    </div>
  );
}
