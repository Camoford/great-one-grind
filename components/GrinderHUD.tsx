import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHunterStore } from "../store";

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function nextMilestone(kills: number) {
  const milestones = [25, 50, 100, 250, 500, 1000, 2000, 5000, 10000];
  for (const m of milestones) {
    if (kills < m) return m;
  }
  return kills + 1000;
}

export default function GrinderHUD() {
  const grinds = useHunterStore((s) => s.grinds);

  const [activeId, setActiveId] = useState<string>("");
  const [startTs, setStartTs] = useState<number>(() => Date.now());
  const [startKills, setStartKills] = useState<number>(0);

  // tick timer UI
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Default active grind
  useEffect(() => {
    if (!activeId && grinds[0]?.id) {
      setActiveId(grinds[0].id);
    }
  }, [activeId, grinds]);

  const active = useMemo(() => grinds.find((g) => g.id === activeId), [grinds, activeId]);

  // When switching grind, reset session counters
  const lastActiveRef = useRef<string>("");
  useEffect(() => {
    if (!active) return;
    if (lastActiveRef.current !== active.id) {
      lastActiveRef.current = active.id;
      setStartTs(Date.now());
      setStartKills(active.kills || 0);
    }
  }, [active]);

  const elapsedMs = Date.now() - startTs;
  const gained = Math.max(0, (active?.kills || 0) - startKills);

  const hours = elapsedMs / (1000 * 60 * 60);
  const pace = hours > 0 ? gained / hours : 0;

  const nm = nextMilestone(active?.kills || 0);
  const toNext = Math.max(0, nm - (active?.kills || 0));

  if (!grinds.length) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-400">Active Grind</div>
          <select
            className="mt-1 rounded bg-black border border-slate-700 px-2 py-1 text-sm"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
          >
            {grinds.map((g) => (
              <option key={g.id} value={g.id}>
                {g.species}
              </option>
            ))}
          </select>
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-400">Session Time</div>
          <div className="text-lg font-semibold">{formatTime(elapsedMs)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-black border border-slate-800 p-2">
          <div className="text-xs text-slate-400">Gained</div>
          <div className="text-lg font-semibold">{gained}</div>
        </div>

        <div className="rounded-lg bg-black border border-slate-800 p-2">
          <div className="text-xs text-slate-400">Pace</div>
          <div className="text-lg font-semibold">{pace.toFixed(1)}/hr</div>
        </div>

        <div className="rounded-lg bg-black border border-slate-800 p-2">
          <div className="text-xs text-slate-400">Next</div>
          <div className="text-lg font-semibold">{nm}</div>
          <div className="text-[11px] text-slate-500">{toNext} to go</div>
        </div>
      </div>
    </div>
  );
}
