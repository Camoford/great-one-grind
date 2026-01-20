import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

const FUR_OPTIONS = [
  "",
  "Common",
  "Piebald",
  "Albino",
  "Melanistic",
  "Leucistic",
  "Blonde",
  "Red",
  "Dark",
  "Light",
  "Tan",
  "Grey",
  "Brown",
];

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

  const sorted = useMemo(() => grinds, [grinds]);

  if (!sorted.length) {
    return <div className="text-center text-slate-400 mt-10">No active grinds found.</div>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((grind) => {
        const isCustom = !!customFurById[grind.id] && !FUR_OPTIONS.includes(customFurById[grind.id]);
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

                {/* Fur picker */}
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-slate-400">Fur Type</div>
                  <select
                    className="w-full rounded bg-black border border-slate-700 p-2 text-sm"
                    value={FUR_OPTIONS.includes(grind.fur || "") ? (grind.fur || "") : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        setFur(grind.id, undefined);
                        return;
                      }
                      setFur(grind.id, v);
                    }}
                  >
                    <option value="">(none)</option>
                    {FUR_OPTIONS.filter(Boolean).map((f) => (
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
                  {isCustom && (
                    <div className="text-[11px] text-slate-500">
                      Custom fur will be used when you obtain a trophy.
                    </div>
                  )}
                </div>
              </div>

              {/* Obtained confirm */}
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
