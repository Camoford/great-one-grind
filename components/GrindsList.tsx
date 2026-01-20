import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

const GREAT_ONE_SPECIES = [
  "Whitetail Deer",
  "Moose",
  "Fallow Deer",
  "Black Bear",
  "Wild Boar",
  "Red Deer",
  "Tahr",
  "Red Fox",
  "Mule Deer",
] as const;

// Quick-add presets (optimized for grinders)
const ADD_ROW_PRIMARY = [+1, +10, +50, +100] as const;
const ADD_ROW_SECONDARY = [-1, -10, -50, -100] as const;

// Hardcore milestone ladder (expand later)
const MILESTONES = [100, 250, 500, 1000, 2000, 5000, 10000] as const;

const FUR_COMMON = ["Normal"];
const FUR_RARE_GENERIC = ["Albino", "Melanistic", "Leucistic", "Piebald", "Dilute"];
const FUR_RARE_NAMED = [
  "Dusky",
  "Spirit",
  "Blonde",
  "Silver",
  "Crested",
  "Mocha",
  "Two Tone",
  "Spotted",
  "Painted",
  "Hooded",
  "Golden",
  "Chestnut",
  "Glacier",
];
const FUR_GREAT_ONE_FABLED = [
  "Fabled Chestnut",
  "Fabled Glacier",
  "Fabled Spirit",
  "Fabled Spotted",
  "Fabled Ash",
  "Fabled Birch",
  "Fabled Oak",
  "Fabled Speckled",
  "Fabled Spruce",
  "Fabled Two Tone",
  "Fabled Brown",
  "Fabled Piebald",
  "Fabled Tan",
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function nextMilestone(kills: number) {
  for (const m of MILESTONES) if (kills < m) return m;
  return null;
}

function progressToNext(kills: number) {
  const next = nextMilestone(kills);
  if (!next) return { next: null as number | null, pct: 100, remaining: 0, prev: MILESTONES[MILESTONES.length - 1] };
  const prev = [...MILESTONES].reverse().find((m) => m <= kills) ?? 0;
  const span = next - prev || next;
  const done = kills - prev;
  const pct = clamp(Math.round((done / span) * 100), 0, 100);
  return { next, pct, remaining: clamp(next - kills, 0, 1_000_000_000), prev };
}

function Pill({
  children,
  onClick,
  active,
  subtle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-emerald-600/60 bg-emerald-900/20 text-emerald-200"
          : subtle
          ? "border-slate-800 bg-slate-950/20 text-slate-300 hover:bg-slate-900/40"
          : "border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setObtained = useHunterStore((s) => s.setObtained);
  const setFur = useHunterStore((s) => s.setFur);

  // Premium feel: Simple (clean) by default; Hardcore reveals everything
  const [hardcoreMode, setHardcoreMode] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);

  const pinned = useMemo(() => {
    const bySpecies = new Map<string, typeof grinds[number]>();
    for (const g of grinds) bySpecies.set(g.species, g);
    return GREAT_ONE_SPECIES.map((sp) => bySpecies.get(sp)).filter(Boolean) as typeof grinds;
  }, [grinds]);

  const totalKills = useMemo(() => pinned.reduce((sum, g) => sum + (g.kills || 0), 0), [pinned]);
  const obtainedCount = useMemo(() => pinned.filter((g) => g.obtained).length, [pinned]);

  const furOptions = useMemo(() => {
    const merged = [...FUR_COMMON, ...FUR_RARE_GENERIC, ...FUR_RARE_NAMED, ...FUR_GREAT_ONE_FABLED];
    return Array.from(new Set(merged));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">Grinds</div>
          <div className="text-sm text-slate-400">
            Clean by default. Flip <span className="text-slate-200 font-semibold">Hardcore Mode</span> for max speed tools.
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-2">
          <span className="text-xs text-slate-400">Mode</span>
          <button
            type="button"
            onClick={() => setHardcoreMode((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs ${
              hardcoreMode
                ? "border-emerald-600/60 bg-emerald-900/20 text-emerald-200"
                : "border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
            }`}
          >
            {hardcoreMode ? "Hardcore ✅" : "Simple ✨"}
          </button>

          <button
            type="button"
            onClick={() => setShowMilestones((v) => !v)}
            className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
            title="Show/hide milestone chips"
          >
            Milestones
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">ACTIVE GRINDS</div>
          <div className="mt-1 text-2xl font-semibold">{pinned.length}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">TOTAL KILLS TRACKED</div>
          <div className="mt-1 text-2xl font-semibold">{totalKills}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">OBTAINED</div>
          <div className="mt-1 text-2xl font-semibold">
            {obtainedCount} <span className="text-sm text-slate-400">/ {pinned.length}</span>
          </div>
        </div>
      </div>

      {/* Species cards */}
      <div className="space-y-3">
        {pinned.map((g) => {
          const kills = g.kills ?? 0;
          const prog = progressToNext(kills);

          return (
            <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex flex-col gap-3">
                {/* Top row */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold">{g.species}</div>
                    <div className="text-sm text-slate-400">Kills: {kills}</div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      className="rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                      value={g.fur ?? ""}
                      onChange={(e) => setFur(g.id, e.target.value)}
                    >
                      <option value="">Fur: —</option>
                      {furOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <button
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        g.obtained
                          ? "border-emerald-600/60 bg-emerald-900/20 text-emerald-200"
                          : "border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
                      }`}
                      onClick={() => setObtained(g.id, !g.obtained)}
                      type="button"
                    >
                      {g.obtained ? "✅ Obtained" : "⬜ Not yet"}
                    </button>
                  </div>
                </div>

                {/* Next Target (clean) */}
                <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Next Target</div>
                      <div className="text-xs text-slate-400">
                        {prog.next ? `Hit ${prog.next} kills to clear the next milestone.` : "All milestones cleared ✅"}
                      </div>
                    </div>

                    {prog.next ? (
                      <div className="text-sm text-slate-200">
                        <span className="font-semibold">Next: {prog.next}</span>{" "}
                        <span className="text-slate-400">({prog.remaining} to go)</span>
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-200 font-semibold">Max cleared ✅</div>
                    )}
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950/60">
                    <div className="h-full bg-emerald-600/60" style={{ width: `${prog.pct}%` }} />
                  </div>

                  {/* Milestone chips hidden by default */}
                  {(showMilestones || hardcoreMode) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {MILESTONES.map((m) => (
                        <Pill key={m} active={kills >= m} subtle={!hardcoreMode}>
                          {kills >= m ? "✅ " : ""}
                          {m}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Add (compact + premium) */}
                <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Quick Add</div>
                      <div className="text-xs text-slate-400">
                        Simple shows the most-used buttons. Hardcore reveals the full toolkit.
                      </div>
                    </div>

                    {/* Direct input always available */}
                    <input
                      className="w-28 rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                      value={String(kills)}
                      inputMode="numeric"
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/[^\d]/g, ""));
                        setKills(g.id, clamp(Number.isFinite(n) ? n : 0, 0, 10_000_000));
                      }}
                    />
                  </div>

                  {/* Primary row */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ADD_ROW_PRIMARY.map((delta) => (
                      <button
                        key={delta}
                        className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-800"
                        onClick={() => setKills(g.id, clamp(kills + delta, 0, 10_000_000))}
                        type="button"
                      >
                        +{delta}
                      </button>
                    ))}
                  </div>

                  {/* Secondary row: hidden unless Hardcore */}
                  {hardcoreMode && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ADD_ROW_SECONDARY.map((delta) => (
                        <button
                          key={delta}
                          className="rounded-lg border border-slate-800 bg-slate-950/20 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/40"
                          onClick={() => setKills(g.id, clamp(kills + delta, 0, 10_000_000))}
                          type="button"
                        >
                          {delta}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hardcore-only extra: one-tap “big moves” */}
                {hardcoreMode && (
                  <div className="rounded-xl border border-slate-800 bg-black/30 p-3">
                    <div className="text-xs text-slate-400 mb-2">Hardcore extras</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm hover:bg-slate-800"
                        onClick={() => setKills(g.id, clamp(kills + 500, 0, 10_000_000))}
                        type="button"
                      >
                        +500
                      </button>
                      <button
                        className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm hover:bg-slate-800"
                        onClick={() => setKills(g.id, clamp(kills + 1000, 0, 10_000_000))}
                        type="button"
                      >
                        +1000
                      </button>
                      <button
                        className="rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/40"
                        onClick={() => setKills(g.id, 0)}
                        type="button"
                        title="Reset kills for this species (does not factory reset app)"
                      >
                        Reset Kills
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
