// components/SessionHistoryScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { readSessionHistory, SESSION_HISTORY_EVENT, type SessionHistoryEntry } from "../src/utils/sessionHistory";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

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

function fmtDateTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function SessionHistoryScreen() {
  const [items, setItems] = useState<SessionHistoryEntry[]>(() => readSessionHistory());

  useEffect(() => {
    const refresh = () => setItems(readSessionHistory());
    window.addEventListener(SESSION_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(SESSION_HISTORY_EVENT, refresh);
  }, []);

  const totalSessions = items.length;

  const totals = useMemo(() => {
    let kills = 0;
    let diamonds = 0;
    let rares = 0;
    let durationMs = 0;

    for (const s of items) {
      kills += s.killsThisSession || 0;
      diamonds += s.diamondsThisSession || 0;
      rares += s.raresThisSession || 0;
      durationMs += s.durationMs || 0;
    }

    return { kills, diamonds, rares, durationMs };
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-24">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-lg font-semibold text-white">Session History</div>
        <div className="mt-1 text-sm text-white/60">Updates instantly when you end a session.</div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-white/60">Sessions</div>
            <div className="mt-0.5 font-semibold">{pretty(totalSessions)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-white/60">Kills</div>
            <div className="mt-0.5 font-semibold">{pretty(totals.kills)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-white/60">Diamonds</div>
            <div className="mt-0.5 font-semibold">{pretty(totals.diamonds)}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-white/60">Rares</div>
            <div className="mt-0.5 font-semibold">{pretty(totals.rares)}</div>
          </div>
        </div>

        <div className="mt-2 text-xs text-white/45">
          Total time: <span className="font-semibold text-white/70">{fmtDuration(totals.durationMs)}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          No sessions logged yet. Start a session, add kills, then End.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s, idx) => (
            <div key={`${s.endedAt}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{s.species}</div>
                  <div className="text-xs text-white/50">{fmtDateTime(s.endedAt)}</div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                    {pretty(s.killsThisSession)} kills
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                    {pretty(s.diamondsThisSession)} diamonds
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                    {pretty(s.raresThisSession)} rares
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                    {fmtDuration(s.durationMs)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
