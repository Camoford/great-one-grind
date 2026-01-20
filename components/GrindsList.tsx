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

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setFur = useHunterStore((s) => s.setFur);
  const addTrophy = useHunterStore((s) => s.addTrophy);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [customFurById, setCustomFurById] = useState<Record<string, string>>({});

  const handleObtained = (id: string) => {
    const grind = grinds.find((g) => g.id === id);
    if (!grind) return;

    const fur = (grind.fur || customFurById[id] || "Unknown").trim();

    addTrophy({
      species: grind.species,
      fur,
      killsAtObtained: grind.kills,
      obtainedAt: Date.now(),
    });

    setKills(id, 0);
    setFur(id, undefined);

    setCustomFurById((p) => {
      const copy = { ...p };
      delete copy[id];
      return copy;
    });

    setConfirmingId(null);
  };

  const sorted = useMemo(() => grinds, [grinds]);

  if (!sorted.length) {
    return <div className="text-center text-slate-400 mt-10">No active grinds found.</div>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((grind) => {
        const options = getFursForSpecies(grind.species);
        const selectedValue = options.includes(grind.fur || "") ? (grind.fur || "") : "";

        return (
          <div
            key={grind.id}
            className="rounded-xl bg-slate-900 p-4 shadow-md border border-slate-800"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">{grind.species}</h3>
                <p className="text-sm text-slate-400">
                  Kills: {grind.kills}
                  {grind.fur ? ` • Fur: ${grind.fur}` : ""}
                </p>

                <div className="mt-3 space-y-2">
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
                    Use the dropdown for standard furs, or type a custom fur.
                  </div>
                </div>
              </div>

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
