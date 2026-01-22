// components/GrindScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { MedalStats, Species } from "../types";
import { useHunterStore } from "../store";

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

/** ✅ Fur types per Great One
    Note: You didn't include Gray Wolf + Ring-necked Pheasant fur types in the screenshot,
    so I left placeholders you can fill later. */
const FUR_TYPES_BY_SPECIES: Record<string, string[]> = {
  "Whitetail Deer": ["Fabled Brown", "Fabled Piebald", "Fabled Tan"],

  Moose: [
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

  Tahr: ["Fabled Birch", "Fabled Spruce"],

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

/** Local storage for fur completion / trophies (DO NOT touch session/persistence systems) */
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

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

const GrindScreen: React.FC<GrindScreenProps> = ({ store }) => {
  const { state, updateMedalCount, resetMedalHistory } = store;

  // ✅ Hardcore mode from the store (VISUAL ONLY usage here)
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);

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

  // Elite, subtle frame (NO functional changes)
  const screenBg = "p-6 space-y-6 min-h-full";
  const screenFrame = hardcoreMode
    ? "bg-[#0B1224]"
    : "bg-[#0F172A]";

  const topCard = hardcoreMode
    ? "rounded-2xl border border-orange-400/20 bg-gradient-to-b from-orange-500/10 via-black/40 to-black/30 p-4"
    : "rounded-2xl border border-white/10 bg-white/5 p-4";

  const badge = hardcoreMode
    ? "rounded-full border border-orange-400/30 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-widest"
    : "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/80 uppercase tracking-widest";

  return (
    <div className={`${screenBg} ${screenFrame}`}>
      {/* Elite header strip (Hardcore-only emphasis, visual only) */}
      <div className={topCard}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="oswald text-2xl font-bold text-white uppercase tracking-tight italic">
              Grind Command
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Great One Fur Completion + Kill Counters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={badge}>
              {hardcoreMode ? "⚔️ HARDCORE • deep end" : "🧊 CASUAL • simple"}
            </span>
          </div>
        </div>

        {/* Visual “identity” line — zero taps */}
        {hardcoreMode && (
          <div className="mt-3 text-xs text-orange-100/70">
            Elite flow enabled. Clean reps. No wasted motion.
          </div>
        )}
      </div>

      {/* Filter dropdown */}
      <div className="w-full">
        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          className={`w-full rounded-xl p-3 text-xs font-bold outline-none mb-2 border ${
            hardcoreMode
              ? "bg-slate-950 border-orange-400/15 text-slate-300"
              : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <option value="ALL">Show All Great Ones</option>
          {greatOneSpecies.map((s: Species) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Optional subtle callout for Hardcore */}
        {hardcoreMode && (
          <div className="text-[10px] text-orange-100/60 font-bold uppercase tracking-widest">
            Hardcore overlay active • visual accents only
          </div>
        )}
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

          const completionPct =
            total > 0 ? clamp01(completed / total) : 0;

          const cardClass = hardcoreMode
            ? "bg-[#121C33] rounded-2xl p-5 border border-orange-400/10 shadow-xl space-y-5"
            : "bg-[#1E293B] rounded-2xl p-5 border border-white/5 shadow-xl space-y-5";

          return (
            <div key={s.id} className={cardClass}>
              <div className="flex justify-between items-center">
                <span className="oswald text-lg font-bold text-white uppercase tracking-tight">
                  {s.name}
                </span>

                <div className="flex items-center gap-2">
                  {hardcoreMode && (
                    <span className="text-[8px] font-bold text-orange-200/80 uppercase tracking-widest border border-orange-400/15 bg-orange-500/10 px-2 py-1 rounded-md">
                      elite
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Reset ALL session stats for ${s.name}?`)) resetMedalHistory(s.id);
                    }}
                    className="text-[8px] font-bold text-red-500 uppercase tracking-widest border border-red-500/10 px-2 py-1 rounded-md"
                  >
                    Reset Session
                  </button>
                </div>
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
                  className={`p-3 rounded-xl border active:bg-slate-800 transition-colors cursor-pointer ${
                    hardcoreMode
                      ? "bg-slate-950/60 border-orange-400/10"
                      : "bg-slate-900/50 border-white/5"
                  }`}
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
                  className={`p-3 rounded-xl border active:bg-slate-800 transition-colors cursor-pointer ${
                    hardcoreMode
                      ? "bg-slate-950/60 border-orange-400/10"
                      : "bg-slate-900/50 border-white/5"
                  }`}
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
              <div
                className={`rounded-xl p-3 space-y-3 border ${
                  hardcoreMode
                    ? "bg-black/30 border-orange-400/10"
                    : "bg-black/20 border-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                      Great One Fur Tracker
                    </span>

                    {/* Completion bar (visual only) */}
                    {total > 0 && (
                      <div className="mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400">
                            Completion
                          </span>
                          <span
                            className={`text-[9px] font-bold ${
                              hardcoreMode ? "text-orange-200" : "text-emerald-400"
                            }`}
                          >
                            {completed}/{total}
                          </span>
                        </div>
                        <div
                          className={`mt-2 h-2 w-full rounded-full overflow-hidden border ${
                            hardcoreMode
                              ? "bg-black/60 border-orange-400/10"
                              : "bg-slate-900 border-white/10"
                          }`}
                        >
                          <div
                            className={`h-full ${
                              hardcoreMode ? "bg-orange-500/60" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.round(completionPct * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {total === 0 && (
                      <div className="text-[9px] font-bold text-slate-500">
                        Fur list not set yet for this species.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => resetFurForSpecies(speciesName)}
                    className="text-[8px] font-bold text-red-400 uppercase tracking-widest border border-red-500/10 px-2 py-1 rounded-md"
                  >
                    Reset Furs
                  </button>
                </div>

                {/* Pick fur + Log */}
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={furPick[s.id] || ""}
                    onChange={(e) =>
                      setFurPick((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                    className={`col-span-2 w-full rounded-xl p-2 text-[11px] font-bold outline-none border ${
                      hardcoreMode
                        ? "bg-slate-950 border-orange-400/15 text-slate-200"
                        : "bg-slate-900 border-white/10 text-slate-300"
                    }`}
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
                    className={`w-full rounded-xl text-[11px] font-bold py-2 border ${
                      hardcoreMode
                        ? "bg-orange-500/15 border-orange-400/25 text-orange-100 hover:bg-orange-500/20"
                        : "bg-emerald-500/20 border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/25"
                    }`}
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
                          className={`flex items-center justify-between rounded-lg px-2 py-2 border ${
                            hardcoreMode
                              ? "bg-slate-950/60 border-orange-400/10"
                              : "bg-slate-900/60 border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs ${
                                done
                                  ? hardcoreMode
                                    ? "text-orange-300"
                                    : "text-emerald-400"
                                  : "text-slate-600"
                              }`}
                            >
                              {done ? "✓" : "•"}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                done ? "text-slate-200" : "text-slate-500"
                              }`}
                            >
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
                  <BreakdownBox
                    label="BRZ"
                    value={stats.currentGrindBreakdown?.bronze || 0}
                    color="text-amber-700"
                  />
                  <BreakdownBox
                    label="SLV"
                    value={stats.currentGrindBreakdown?.silver || 0}
                    color="text-slate-400"
                  />
                  <BreakdownBox
                    label="GLD"
                    value={stats.currentGrindBreakdown?.gold || 0}
                    color="text-amber-500"
                  />
                  <BreakdownBox
                    label="DIA"
                    value={stats.currentGrindBreakdown?.diamond || 0}
                    color="text-cyan-400"
                  />
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
