import React, { useState } from "react";
import { useHunterStore } from "../store";

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const setKills = useHunterStore((s) => s.setKills);
  const setFur = useHunterStore((s) => s.setFur);
  const addTrophy = useHunterStore((s) => s.addTrophy);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleObtained = (id: string) => {
    const grind = grinds.find((g) => g.id === id);
    if (!grind) return;

    // Prevent duplicate trophies
    addTrophy({
      species: grind.species,
      fur: grind.fur || "Unknown",
      killsAtObtained: grind.kills,
      obtainedAt: Date.now(),
    });

    // Reset kills after obtaining (grinder default)
    setKills(id, 0);

    // Clear fur selection after trophy
    setFur(id, undefined);

    setConfirmingId(null);
  };

  if (!grinds.length) {
    return (
      <div className="text-center text-slate-400 mt-10">
        No active grinds found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grinds.map((grind) => (
        <div
          key={grind.id}
          className="rounded-xl bg-slate-900 p-4 shadow-md border border-slate-800"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{grind.species}</h3>
              <p className="text-sm text-slate-400">
                Kills: {grind.kills}
                {grind.fur ? ` • Fur: ${grind.fur}` : ""}
              </p>
            </div>

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
      ))}
    </div>
  );
}
