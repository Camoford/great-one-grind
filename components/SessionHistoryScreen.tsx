import React, { useMemo } from "react";
import { getSessionHistory } from "../utils/sessionHistory";

export default function SessionHistoryScreen() {
  const sessions = useMemo(() => {
    try {
      return getSessionHistory();
    } catch {
      return [];
    }
  }, []);

  if (!sessions.length) {
    return (
      <div className="mx-auto max-w-2xl px-2 py-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
          <div className="text-base font-semibold">Session History</div>
          <div className="mt-2 text-sm text-slate-400">
            No sessions recorded yet.
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Start a session, log some kills, then end the session.
          </div>
        </div>
      </div>
    );
  }

  const list = sessions.slice().reverse();

  return (
    <div className="mx-auto max-w-2xl px-2 py-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Session History</h2>
        <div className="text-xs text-slate-400">{list.length} sessions</div>
      </div>

      <div className="mt-3 space-y-2">
        {list.map((s: any, idx: number) => {
          const started = s.startedAt ? new Date(s.startedAt) : null;
          const ended = s.endedAt ? new Date(s.endedAt) : null;

          const durationMs =
            typeof s.durationMs === "number"
              ? s.durationMs
              : started && ended
              ? Math.max(0, ended.getTime() - started.getTime())
              : 0;

          const mins = Math.max(0, Math.round(durationMs / 60000));
          const kills =
            typeof s.kills === "number"
              ? s.kills
              : typeof s.sessionKills === "number"
              ? s.sessionKills
              : 0;

          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {started ? started.toLocaleString() : "Unknown start time"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Duration: {mins} min • Kills: {kills}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  #{list.length - idx}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
