import React, { useEffect, useMemo, useState } from "react";
import { MedalStats, Species } from "../types";

interface GrindScreenProps {
  store: any;
}

/** ✅ Your Great One species list (names must match your store's species names) */
const GREAT_ONE_NAMES = [
  "Whitetail Deer",
  "Red Deer",
  "Fallow Deer",
  "Moose",
  "Black Bear",
  "Mule Deer",
  "Gray Wolf",
  "Wild Boar",
  "Red Fox",
  "Ring-necked Pheasant",
] as const;

const GREAT_ONE_NAME_SET = new Set<string>(GREAT_ONE_NAMES);

/** ✅ Fur types per Great One (from your screenshot)
    Note: You didn't include Gray Wolf + Ring-necked Pheasant fur types in the screenshot,
    so I left placeholders you can fill later. */
const FUR_TYPES_BY_SPECIES: Record<string, string[]> = {
  "Whitetail Deer": ["Fabled Brown", "Fabled Piebald", "Fabled Tan"],

  "Moose": [
    "Fabled Ash",
    "Fabled Birch",
    "Fabled Oak",
    "Fabled Speckled",
    "Fabled Spruce",
    "Fabled Two Tone",
  ],

  "Fallow Deer": ["Golden", "Hooded", "Painted", "Silver", "Spotted"],

  "Black Bear": ["Chestnut", "Cream", "Glacier", "Spirit", "Spotted"],

  "Wild Boar": [
    "Fabled Ash",
    "Fabled Stitch",
    "Fabled Smolder",
    "Fabled Cinder",
    "Fabled Butterscotch",
    "Other / Unknown",
  ],

  "Red Deer": ["Fabled Spotted"],

  "Tahr": ["Fabled Birch", "Fabled Spruce"],

  "Red Fox": ["Fire Fox"],

  "Mule Deer": [
    "Milky Way",
    "Dripple Drizzle",
    "Cobweb Enigma",
    "Dusky Drift",
    "Petal Puff",
    "Cinnamon Stripes",
  ],

  // ✅ Add these when you have their fur lists:
  "Gray Wolf": ["Other / Unknown"],
  "Ring-necked Pheasant": ["Other / Unknown"],
};

/** Local storage for fur completion / trophies */
const FUR_STORAGE_KEY = "greatonegrind.greatone_furs.v1";

/** Data shape: { [speciesName]: { [furType]: count } } */
type FurCounts = Record<string, Record<string, number>>;

function loadFurCounts(): FurCounts {
  try {
    const raw = localStorage.getItem(FUR_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as FurCounts;
  } catch {
    return {};
  }
}

function saveFurCounts(data: FurCounts) {
  try {
    localStorage.setItem(FUR_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const GrindScreen: React.FC<GrindScreenProps> = ({ store }) => {
  const { state, updateMedalCount, resetMedalHistory } = store;

  const [filterSpecies, setFilterSpecies] = useState("ALL");

  /** ✅ Fur tracker state */
  const [furCounts, setFurCounts] = useState<FurCounts>({});
  const [furPick, setFurPick] = useState<Record<string, string>>({}); // per speciesId (UI selection)

  useEffect(() => {
    setFurCounts(loadFurCounts());
  }, []);

  useEffect(() => {
    saveFurCounts(furCounts);
  }, [furCounts]);

  const handleInlineEdit = (speciesId: string, field: string, current: number) => {
    const newVal = prompt(`Enter new value for ${field}:`, current.toString());
    if (newVal !== null) {
      const parsed = parseInt(newVal, 10);
      if (!isNaN(parsed)) {
        updateMedalCount(speciesId, field, parsed);
      }
    }
  };

  /** ✅ Only show Great One species from your store species list */
  const greatOneSpecies = useMemo(() => {
    const list: Species[] = Array.isArray(state?.species) ? state.species : [];
    return list.filter((s: Species) => GREAT_ONE_NAME_SET.has(s.name));
  }, [state?.species]);

  const filteredSpecies =
    filterSpecies === "ALL"
      ? greatOneSpecies
      : greatOneSpecies.filter((s: Species) => s.id === filterSpecies);

  /** ✅ Log a Great One (fur type) + increment store fabled count (optional) */
  const logGreatOne = (species: Species) => {
    const speciesName = species.name;
    const pick = furPick[species.id] || "";
    if (!pick) {
      alert("Pick a fur type first.");
      return;
    }

    setFurCounts((prev) => {
      const next = { ...prev };
      const perSpecies = { ...(next[speciesName] || {}) };
      perSpecies[pick] = (perSpecies[pick] || 0) + 1;
      next[speciesName] = perSpecies;
      return next;
    });

    // Optional: also bump store fabled / GO total by 1 if you want.
    // If your store uses "fabled" for Great Ones, this makes it match.
    // Comment out if you don't want this side effect.
    try {
      updateMedalCount(species.id, "fabled", (state.medals?.[species.id]?.fabled || 0) + 1);
    } catch {
      // ignore if store doesn't allow this
    }
  };

  const resetFurForSpecies = (speciesName: string) => {
    if (!confirm(`Reset fur progress for ${speciesName}?`)) return;
    setFurCounts((prev) => {
      const next = { ...prev };
      delete next[speciesName];
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 bg-[#0F172A] min-h-full">
      <div className="text-center space-y-1">
        <h2 className="oswald text-2xl font-bold text-white uppercase tracking-tight italic">
          Grind Command
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Great One Fur Completion + Kill Counters
        </p>
      </div>

      {/* Filter dropdown */}
      <div className="w-full">
        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-slate-400 outline-none mb-6"
        >
          <option value="ALL">Show All Great Ones</option>
          {greatOneSpecies.map((s: Species) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredSpecies.map((s: Species) => {
          const stats: MedalStats = state.medals?.[s.id];
          if (!stats) return null;

          const speciesName = s.name;
          const furList = FUR_TYPES_BY_SPECIES[speciesName] || [];
          const counts = furCounts[speciesName] || {};

          const completed = furList.length
            ? furList.filter((f) => (counts[f] || 0) > 0).length
            : 0;

          const total = furList.length;

          return (
            <div
              key={s.id}
              className="bg-[#1E293B] rounded-2xl p-5 border border-white/5 shadow-xl space-y-5"
            >
              <div className="flex justify-between items-center">
                <span className="oswald text-lg font-bold text-white uppercase tracking-tight">
                  {s.name}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Reset ALL session stats for ${s.name}?`)) resetMedalHistory(s.id);
                  }}
                  className="text-[8px] font-bold text-red-500 uppercase tracking-widest border border-red-500/10 px-2 py-1 rounded-md"
                >
                  Reset Session
                </button>
              </div>

              {/* Inline edits */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() =>
                    handleInlineEdit(
                      s.id,
                      "attemptsSinceLastDiamond",
                      stats.attemptsSinceLastDiamond
                    )
                  }
                  className="bg-slate-900/50 p-3 rounded-xl border border-white/5 active:bg-slate-800 transition-colors cursor-pointer"
                >
                  <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    Last Diamond Gap
                  </label>
                  <div className="text-xl font-mono font-bold text-cyan-400">
                    {stats.attemptsSinceLastDiamond}
                  </div>
                </div>

                <div
                  onClick={() =>
                    handleInlineEdit(s.id, "killsSinceLastRare", stats.killsSinceLastRare)
                  }
                  className="bg-slate-900/50 p-3 rounded-xl border border-white/5 active:bg-slate-800 transition-colors cursor-pointer"
                >
                  <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    Last Rare Gap
                  </label>
                  <div className="text-xl font-mono font-bold text-orange-400">
                    {stats.killsSinceLastRare}
                  </div>
                </div>
              </div>

              {/* ✅ Great One Fur Tracker */}
              <div className="bg-black/20 rounded-xl p-3 space-y-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    Great One Fur Tracker
                  </span>

                  <button
                    onClick={() => resetFurForSpecies(speciesName)}
                    className="text-[8px] font-bold text-red-400 uppercase tracking-widest border border-red-500/10 px-2 py-1 rounded-md"
                  >
                    Reset Furs
                  </button>
                </div>

                {/* Progress */}
                {total > 0 ? (
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400">
                      Completion
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400">
                      {completed}/{total}
                    </span>
                  </div>
                ) : (
                  <div className="text-[9px] font-bold text-slate-500">
                    Fur list not set yet for this species.
                  </div>
                )}

                {/* Pick fur + Log */}
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={furPick[s.id] || ""}
                    onChange={(e) =>
                      setFurPick((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                    className="col-span-2 w-full bg-slate-900 border border-white/10 rounded-xl p-2 text-[11px] font-bold text-slate-300 outline-none"
                  >
                    <option value="">Select fur type…</option>
                    {furList.map((fur) => (
                      <option key={fur} value={fur}>
                        {fur}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => logGreatOne(s)}
                    className="w-full rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-[11px] font-bold py-2"
                  >
                    Log G.O
                  </button>
                </div>

                {/* Checklist */}
                {furList.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {furList.map((fur) => {
                      const c = counts[fur] || 0;
                      const done = c > 0;
                      return (
                        <div
                          key={fur}
                          className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-lg px-2 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${done ? "text-emerald-400" : "text-slate-600"}`}>
                              {done ? "✓" : "•"}
                            </span>
                            <span className={`text-[10px] font-bold ${done ? "text-slate-200" : "text-slate-500"}`}>
                              {fur}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {c}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Session Breakdown */}
              <div className="bg-black/20 rounded-xl p-3 space-y-3">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center block">
                  Active Session Breakdown
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <BreakdownBox label="BRZ" value={stats.currentGrindBreakdown?.bronze || 0} color="text-amber-700" />
                  <BreakdownBox label="SLV" value={stats.currentGrindBreakdown?.silver || 0} color="text-slate-400" />
                  <BreakdownBox label="GLD" value={stats.currentGrindBreakdown?.gold || 0} color="text-amber-500" />
                  <BreakdownBox label="DIA" value={stats.currentGrindBreakdown?.diamond || 0} color="text-cyan-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <StatBox label="All-Time Dia" value={stats.diamond} color="text-emerald-500" />
                <StatBox label="G.O Total" value={stats.fabled} color="text-red-500" />
                <StatBox label="Total Kills" value={stats.totalGrindKills} color="text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Efficiency Heat
          </span>
          <span className="text-[9px] font-bold text-emerald-500 uppercase">Status: Optimal</span>
        </div>
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full bg-blue-500/50" style={{ width: "15%" }}></div>
          <div className="h-full bg-emerald-500" style={{ width: "60%" }}></div>
          <div className="h-full bg-red-500 animate-pulse" style={{ width: "25%" }}></div>
        </div>
      </div>
    </div>
  );
};

const BreakdownBox = ({ label, value, color }: any) => (
  <div className="flex flex-col items-center p-1 rounded-lg bg-slate-900/80 border border-white/5">
    <span className={`text-xs font-mono font-bold ${color}`}>{value}</span>
    <span className="text-[6px] font-bold text-slate-600 uppercase">{label}</span>
  </div>
);

const StatBox = ({ label, value, color }: any) => (
  <div className="flex flex-col items-center p-2 rounded-lg bg-black/40 border border-white/5">
    <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
    <span className="text-[7px] font-bold text-slate-600 uppercase mt-0.5">{label}</span>
  </div>
);

export default GrindScreen;

