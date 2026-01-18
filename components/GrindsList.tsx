import React, { useEffect, useMemo, useState } from "react";

type Grind = {
  id: string;
  name: string;
  species: string;
  reserve?: string;
  createdAt: number;
  kills: number;
  obtained: boolean;
};

const STORAGE_KEY = "greatonegrind.grinds.v1";

function uid() {
  // stable enough for local-only IDs
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadGrinds(): Grind[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // minimal validation (no refactor / no schema libs)
    return parsed
      .filter((g) => g && typeof g === "object" && typeof g.id === "string")
      .map((g) => ({
        id: String(g.id),
        name: String(g.name ?? "Untitled Grind"),
        species: String(g.species ?? "Unknown"),
        reserve: g.reserve ? String(g.reserve) : "",
        createdAt: Number(g.createdAt ?? Date.now()),
        kills: Number.isFinite(Number(g.kills)) ? Number(g.kills) : 0,
        obtained: Boolean(g.obtained),
      }));
  } catch {
    return [];
  }
}

function saveGrinds(grinds: Grind[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grinds));
  } catch {
    // ignore write failures (private mode / quota)
  }
}

export default function GrindsList() {
  const [grinds, setGrinds] = useState<Grind[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // create form (tiny, inline)
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSpecies, setNewSpecies] = useState("");
  const [newReserve, setNewReserve] = useState("");

  useEffect(() => {
    setGrinds(loadGrinds());
  }, []);

  useEffect(() => {
    saveGrinds(grinds);
  }, [grinds]);

  const selected = useMemo(
    () => grinds.find((g) => g.id === selectedId) ?? null,
    [grinds, selectedId]
  );

  const totalKills = useMemo(
    () => grinds.reduce((sum, g) => sum + (g.kills || 0), 0),
    [grinds]
  );

  function createGrind() {
    const name = newName.trim();
    const species = newSpecies.trim();
    if (!name || !species) return;

    const g: Grind = {
      id: uid(),
      name,
      species,
      reserve: newReserve.trim(),
      createdAt: Date.now(),
      kills: 0,
      obtained: false,
    };

    setGrinds((prev) => [g, ...prev]);
    setSelectedId(g.id);

    setNewName("");
    setNewSpecies("");
    setNewReserve("");
    setIsCreating(false);
  }

  function updateGrind(id: string, patch: Partial<Grind>) {
    setGrinds((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function deleteGrind(id: string) {
    setGrinds((prev) => prev.filter((g) => g.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Grinds</h2>
          <p className="text-xs text-slate-400">
            Track kills and mark when you finally land the Great One.
          </p>
        </div>

        <button
          onClick={() => setIsCreating((v) => !v)}
          className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 text-sm"
        >
          {isCreating ? "Close" : "Create"}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">
            Active grinds
          </div>
          <div className="text-2xl font-semibold text-slate-100">{grinds.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">
            Total kills tracked
          </div>
          <div className="text-2xl font-semibold text-slate-100">{totalKills}</div>
        </div>
      </div>

      {/* Create panel */}
      {isCreating && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="text-sm font-medium text-slate-200">New grind</div>

          <div className="grid grid-cols-1 gap-3">
            <label className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Grind name
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Whitetail Great One"
                className="w-full rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-slate-100 text-sm outline-none"
              />
            </label>

            <label className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Species
              </div>
              <input
                value={newSpecies}
                onChange={(e) => setNewSpecies(e.target.value)}
                placeholder="e.g., Whitetail Deer"
                className="w-full rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-slate-100 text-sm outline-none"
              />
            </label>

            <label className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Reserve (optional)
              </div>
              <input
                value={newReserve}
                onChange={(e) => setNewReserve(e.target.value)}
                placeholder="e.g., Revontuli Coast"
                className="w-full rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2 text-slate-100 text-sm outline-none"
              />
            </label>
          </div>

          <button
            onClick={createGrind}
            disabled={!newName.trim() || !newSpecies.trim()}
            className="w-full px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-sm disabled:opacity-40"
          >
            Create grind
          </button>
        </div>
      )}

      {/* If nothing yet */}
      {grinds.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
          <div className="text-slate-200 font-medium">No grinds yet</div>
          <div className="text-xs text-slate-400 mt-1">
            Hit <span className="text-slate-200">Create</span> to start tracking kills.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {/* List */}
          {!selected && (
            <>
              {grinds.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className="text-left rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-900/55 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-slate-100 font-medium">{g.name}</div>
                      <div className="text-xs text-slate-400">
                        {g.species}
                        {g.reserve ? ` • ${g.reserve}` : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        Kills
                      </div>
                      <div className="text-lg font-semibold text-slate-100">{g.kills}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </div>
                    <div
                      className={
                        "text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border " +
                        (g.obtained
                          ? "text-emerald-200 border-emerald-500/30 bg-emerald-500/10"
                          : "text-slate-300 border-slate-700 bg-slate-800/20")
                      }
                    >
                      {g.obtained ? "Obtained" : "Grinding"}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Detail */}
          {selected && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-slate-100 font-semibold text-lg">{selected.name}</div>
                  <div className="text-xs text-slate-400">
                    {selected.species}
                    {selected.reserve ? ` • ${selected.reserve}` : ""}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedId(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700 text-slate-200 text-sm"
                >
                  Back
                </button>
              </div>

              {/* Kill counter */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  Kills
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() =>
                      updateGrind(selected.id, { kills: Math.max(0, selected.kills - 1) })
                    }
                    className="px-4 py-3 rounded-2xl bg-slate-800/40 border border-slate-700 text-slate-200 text-lg"
                    aria-label="decrease kills"
                  >
                    –
                  </button>

                  <div className="text-4xl font-bold text-slate-100">{selected.kills}</div>

                  <button
                    onClick={() => updateGrind(selected.id, { kills: selected.kills + 1 })}
                    className="px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 text-lg"
                    aria-label="increase kills"
                  >
                    +
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={selected.obtained}
                      onChange={(e) => updateGrind(selected.id, { obtained: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Obtained
                  </label>

                  <button
                    onClick={() => deleteGrind(selected.id)}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="text-xs text-slate-400">
                Created: {new Date(selected.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
