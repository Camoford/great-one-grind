import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

function getFursForSpecies(species: string): string[] {
  const base = ["", "Common", "Piebald", "Albino", "Melanistic", "Leucistic"];

  switch (species) {
    case "Whitetail Deer":
      return [...base, "Red", "Tan", "Grey", "Brown", "Other (type it)"];
    case "Moose":
      return [...base, "Light", "Dark", "Brown", "Other (type it)"];
    case "Fallow Deer":
      return [...base, "Spotted", "Chocolate", "Black", "Other (type it)"];
    case "Black Bear":
      return [...base, "Cinnamon", "Blonde", "Other (type it)"];
    case "Wild Boar":
      return [...base, "Brown Hybrid", "Blackgold", "Other (type it)"];
    case "Red Deer":
      return [...base, "Light", "Dark", "Other (type it)"];
    case "Tahr":
      return [...base, "Grey", "Dark", "Other (type it)"];
    case "Red Fox":
      return [...base, "Cross", "Silver", "Other (type it)"];
    case "Mule Deer":
      return [...base, "Grey", "Brown", "Other (type it)"];
    default:
      return [...base, "Other (type it)"];
  }
}

function nextMilestone(kills: number) {
  const milestones = [25, 50, 100, 250, 500, 1000, 2000, 5000, 10000];
  for (const m of milestones) {
    if (kills < m) return m;
  }
  return kills + 1000;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setFur = useHunterStore((s) => s.setFur);
  const addTrophy = useHunterStore((s) => s.addTrophy);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [customFurById, setCustomFurById] = useState<Record<string, string>>({});

  const sorted = useMemo(() => grinds, [grinds]);

  const bumpKills = (id: string, delta: number) => {
    const g = sorted.find((x) => x.id === id);
    if (!g) return;
    const next = Math.max(0, (g.kills || 0) + delta);
    setKills(id, next);
  };

  const handleObtained = (id: string) => {
    const grind = sorted.find((g) => g.id === id);
    if (!grind) return;

    const fur = (grind.fur || customFurById[id] || "Unknown").trim();

    addTrophy({
      species: grind.species,
      fur,
      killsAtObtained: grind.kills,
      obtainedAt: Date.now(),
    });

    // Grinder default reset
    setKills(id, 0);
    setFur(id, undefined);

    // clear custom fur after obtain
    setCustomFurById((p) => {
      const copy = { ...p };
      delete copy[id];
      return copy;
    });

    setConfirmingId(null);
  };

  if (!sorted.length) {
    return <div className="text-center text-slate-400 mt-10">No active grinds found.</div>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((grind) => {
        const options = getFursForSpecies(grind.species);

        const selectedValue = options.includes(grind.fur || "") ? (grind.fur || "") : "";
        const kills = grind.kills || 0;

        const nm = nextMilestone(kills);
        const prev = nm === 25 ? 0 : nm === 50 ? 25 : nm === 100 ? 50 : nm === 250 ? 100 : nm === 500 ? 250 : nm === 1000 ? 500 : nm === 2000 ? 1000 : nm === 5000 ? 2000 : nm === 10000 ? 5000 : nm - 1000;
        const span = Math.max(1, nm - prev);
        const progress = clamp(((kills - prev) / span) * 100, 0, 100);

        return (
          <div
            key={grind.id}
            className="rounded-xl bg-slate-900 p-4 shadow-md border border-slate-800"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold">{grind.species}</h3>

                <div className="mt-1 flex items-center gap-3 text-sm text-slate-300">
                  <div>
                    Kills: <span className="text-white font-semibold">{kills}</span>
                  </div>
                  {grind.fur ? (
                    <div className="text-slate-400">
                      Fur: <span className="text-white">{grind.fur}</span>
                    </div>
                  ) : null}
                </div>

                {/* Progress to next milestone */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Next milestone</span>
                    <span>
                      {kills} / {nm} ({Math.max(0, nm - kills)} to go)
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded bg-black border border-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[1, 10, 50, 100].map((n) => (
                    <button
                      key={n}
                      className="px-3 py-1 text-sm rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
                      onClick={() => bumpKills(grind.id, n)}
                    >
                      +{n}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1 text-sm rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
                    onClick={() => bumpKills(grind.id, -1)}
                    title="Undo 1"
                  >
                    -1
                  </button>
                </div>

                {/* Fur Controls */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-slate-400">Fur Type</div>

                  <select
                    className="w-full rounded bg-black border border-slate-700 p-2 text-sm"
                    value={selectedValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        setFur(grind.id, undefined);
                        return;
                      }
                      if (v === "Other (type it)") {
                        setFur(grind.id, undefined);
                        return;
                      }
                      setFur(grind.id, v);
                    }}
                  >
                    <option value="">(none)</option>
                    {options
                      .filter((x) => x !== "")
                      .map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                  </select>

                  <input
                    className="w-full rounded bg-black border border-slate-700 p-2 text-sm"
                    value={customFurById[grind.id] || ""}
                    onChange={(e) =>
                      setCustomFurById((p) => ({ ...p, [grind.id]: e.target.value }))
                    }
                    placeholder="Optional: type custom fur (ex: Spirit, Glacier, etc)"
                  />

                  <div className="text-[11px] text-slate-500">
                    Use dropdown for standard furs, or type a custom fur.
                  </div>
                </div>
              </div>

              {/* Obtained */}
              <div className="shrink-0">
                {confirmingId === grind.id ? (
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm bg-green-600 rounded hover:bg-green-700"
                      onClick={() => handleObtained(grind.id)}
                    >
                      Confirm
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-slate-700 rounded hover:bg-slate-600"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700"
                    onClick={() => setConfirmingId(grind.id)}
                  >
                    ✅ Obtained
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
