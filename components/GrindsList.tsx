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

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setObtained = useHunterStore((s) => s.setObtained);
  const setFur = useHunterStore((s) => s.setFur);

  const pinned = useMemo(() => {
    // Keep display order stable to the 9 Great Ones
    const bySpecies = new Map<string, typeof grinds[number]>();
    for (const g of grinds) bySpecies.set(g.species, g);
    return GREAT_ONE_SPECIES.map((sp) => bySpecies.get(sp)).filter(Boolean) as typeof grinds;
  }, [grinds]);

  const totalKills = useMemo(() => pinned.reduce((sum, g) => sum + (g.kills || 0), 0), [pinned]);
  const obtainedCount = useMemo(() => pinned.filter((g) => g.obtained).length, [pinned]);

  const furOptions = useMemo(() => {
    // One combined list for simplicity (works great in beta)
    const merged = [
      ...FUR_COMMON,
      ...FUR_RARE_GENERIC,
      ...FUR_RARE_NAMED,
      ...FUR_GREAT_ONE_FABLED,
    ];
    // de-dupe
    return Array.from(new Set(merged));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Grinds</div>
        <div className="text-sm text-slate-400">Track kills and mark when you land the Great One.</div>
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
        {pinned.map((g) => (
          <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold">{g.species}</div>
                <div className="text-sm text-slate-400">Kills: {g.kills ?? 0}</div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                {/* Kills controls */}
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                    onClick={() => setKills(g.id, clamp((g.kills || 0) - 1, 0, 10_000_000))}
                    aria-label="Decrease kills"
                  >
                    −
                  </button>

                  <input
                    className="w-28 rounded-lg border border-slate-700 bg-black px-3 py-2 text-sm"
                    value={String(g.kills ?? 0)}
                    inputMode="numeric"
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(/[^\d]/g, ""));
                      setKills(g.id, clamp(Number.isFinite(n) ? n : 0, 0, 10_000_000));
                    }}
                  />

                  <button
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
                    onClick={() => setKills(g.id, clamp((g.kills || 0) + 1, 0, 10_000_000))}
                    aria-label="Increase kills"
                  >
                    +
                  </button>
                </div>

                {/* Fur dropdown */}
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

                {/* Obtained toggle */}
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
          </div>
        ))}
      </div>
    </div>
  );
}
