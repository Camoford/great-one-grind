import React, { useMemo } from "react";
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

// Grinder-friendly quick adds
const QUICK_ADDS = [-100, -50, -10, -1, +1, +10, +50, +100] as const;

// Hardcore challenge milestones (you can expand later)
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
  // Great One (Black Bear)
  "Fabled Chestnut",
  "Fabled Glacier",
  "Fabled Spirit",
  "Fabled Spotted",

  // Great One (Moose)
  "Fabled Ash",
  "Fabled Birch",
  "Fabled Oak",
  "Fabled Speckled",
  "Fabled Spruce",
  "Fabled Two Tone",

  // Great One (Whitetail)
  "Fabled Brown",
  "Fabled Piebald",
  "Fabled Tan",
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function nextMilestone(kills: number) {
  for (const m of MILESTONES) {
    if (kills < m) return m;
  }
  return null;
}

function progressToNext(kills: number) {
  const next = nextMilestone(kills);
  if (!next) return { next: null as number | null, pct: 100, remaining: 0 };
  const prev = [...MILESTONES].reverse().find((m) => m <= kills) ?? 0;
  const span = next - prev || next;
  const done = kills - prev;
  const pct = clamp(Math.round((done / span) * 100), 0, 100);
  return { next, pct, remaining: clamp(next - kills, 0, 1_000_000_000) };
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setObtained = useHunterStore((s) => s.setObtained);
  const setFur = useHunterStore((s) => s.setFur);

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
      <div>
        <div className="text-xl font-semibold">Grinds</div>
        <div className="text-sm text-slate-400">
          Hardcore grinder mode: fast adds, milestones, and Great One tracking (9 pinned species).
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

      {/* List */}
      <div className="space-y-3">
        {pinned.map((g) => {
          const kills = g.kills ?? 0;
          const prog = progressToNext(kills);

          return (
            <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex flex-col gap-3">
                {/* Header row */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold">{g.species}</div>
                    <div className="text-sm text-slate-400">Kills: {kills}</div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    {/* Fur */}
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

                    {/* Obtained */}
                    <button
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        g.obtained
                          ? "border-emerald-600 bg-emerald-900/20 text-emerald-200"
                          : "border-slate-700 bg-slate-900 hover:bg-slate-800"
                      }`}
                      onClick={() => setObtained(g.id, !g.obtained)}
                    >
                      {g.obtained ? "✅ Obtained" : "⬜ Not yet"}
                    </button>
                  </div>
                </div>

                {/* Grinder buttons */}
                <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
                  <div className="mb-2 text-xs text-slate-400">Quick Add (hardcore grinders)</div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ADDS.map((delta) => (
                      <button
                        key={delta}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                        onClick={() => {
                          const next = clamp(kills + delta, 0, 10_000_000);
                          setKills(g.id, next);
                        }}
                      >
                        {delta > 0 ? `+${delta}` : `${delta}`}
                      </button>
                    ))}

                    {/* Direct input */}
                    <input
                      className="ml-auto w-28 rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                      value={String(kills)}
                      inputMode="numeric"
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/[^\d]/g, ""));
                        setKills(g.id, clamp(Number.isFinite(n) ? n : 0, 0, 10_000_000));
                      }}
                    />
                  </div>
                </div>

                {/* Challenge panel */}
                <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Challenges</div>
                      <div className="text-xs text-slate-400">
                        Milestones + Great One status. More challenges coming (rare fur, diamonds, zones).
                      </div>
                    </div>

                    {prog.next ? (
                      <div className="text-sm text-slate-200">
                        Next: <span className="font-semibold">{prog.next}</span>{" "}
                        <span className="text-slate-400">({prog.remaining} to go)</span>
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-200 font-semibold">Max milestone cleared ✅</div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950/60">
                    <div
                      className="h-full bg-emerald-600/60"
                      style={{ width: `${prog.pct}%` }}
                    />
                  </div>

                  {/* Milestone chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MILESTONES.map((m) => {
                      const done = kills >= m;
                      return (
                        <span
                          key={m}
                          className={`rounded-full border px-3 py-1 text-xs ${
                            done
                              ? "border-emerald-600/60 bg-emerald-900/20 text-emerald-200"
                              : "border-slate-700 bg-slate-900/40 text-slate-300"
                          }`}
                        >
                          {done ? "✅ " : ""}{m}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
