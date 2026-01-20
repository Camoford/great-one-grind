import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

type SortMode = "newest" | "oldest" | "kills_desc" | "kills_asc" | "species_az";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return "";
  }
}

export default function TrophyRoom() {
  const trophies = useHunterStore((s) => s.trophies);
  const grinds = useHunterStore((s) => s.grinds);

  const speciesOptions = useMemo(() => {
    const list = Array.from(new Set(grinds.map((g) => g.species)));
    list.sort((a, b) => a.localeCompare(b));
    return list;
  }, [grinds]);

  const [speciesFilter, setSpeciesFilter] = useState<string>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState<string>("");
  const [showCount, setShowCount] = useState<number>(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = trophies.slice();

    if (speciesFilter !== "ALL") {
      list = list.filter((t) => t.species === speciesFilter);
    }

    if (q) {
      list = list.filter((t) => {
        const s = `${t.species} ${t.fur} ${t.killsAtObtained}`.toLowerCase();
        return s.includes(q);
      });
    }

    switch (sortMode) {
      case "newest":
        list.sort((a, b) => b.obtainedAt - a.obtainedAt);
        break;
      case "oldest":
        list.sort((a, b) => a.obtainedAt - b.obtainedAt);
        break;
      case "kills_desc":
        list.sort((a, b) => (b.killsAtObtained || 0) - (a.killsAtObtained || 0));
        break;
      case "kills_asc":
        list.sort((a, b) => (a.killsAtObtained || 0) - (b.killsAtObtained || 0));
        break;
      case "species_az":
        list.sort((a, b) => a.species.localeCompare(b.species));
        break;
    }

    return list;
  }, [trophies, speciesFilter, sortMode, search]);

  const visible = useMemo(() => filtered.slice(0, showCount), [filtered, showCount]);

  const total = trophies.length;
  const shown = visible.length;
  const remaining = Math.max(0, filtered.length - shown);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Trophy Room</h2>
            <p className="text-sm text-slate-400 mt-1">
              Compact trophy log built for grinders (supports 100s+ trophies).
            </p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <div>
              Total: <span className="text-white font-semibold">{total}</span>
            </div>
            <div>
              Showing: <span className="text-white font-semibold">{shown}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-slate-400 mb-1">Filter Species</div>
            <select
              className="w-full rounded bg-black border border-slate-700 p-2 text-sm"
              value={speciesFilter}
              onChange={(e) => {
                setSpeciesFilter(e.target.value);
                setShowCount(20);
                setExpandedId(null);
              }}
            >
              <option value="ALL">All species</option>
              {speciesOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-1">Sort</div>
            <select
              className="w-full rounded bg-black border border-slate-700 p-2 text-sm"
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as SortMode);
                setExpandedId(null);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="kills_desc">Kills (high → low)</option>
              <option value="kills_asc">Kills (low → high)</option>
              <option value="species_az">Species (A → Z)</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-1">Search</div>
            <input
              className="w-full rounded bg-black border border-slate-700 p-2 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowCount(20);
                setExpandedId(null);
              }}
              placeholder="Search (species, fur, kills)…"
            />
          </div>
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 text-center text-slate-400">
          No trophies yet. When you hit ✅ Obtained, your Great One gets logged here.
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-400 border-b border-slate-800 bg-black/40">
            <div className="col-span-4">Species</div>
            <div className="col-span-3">Fur</div>
            <div className="col-span-2 text-right">Kills</div>
            <div className="col-span-2 text-right">Date</div>
            <div className="col-span-1 text-right">More</div>
          </div>

          {/* Rows */}
          <div>
            {visible.map((t) => {
              const expanded = expandedId === t.id;
              return (
                <div key={t.id} className="border-b border-slate-800">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-4 font-semibold truncate">{t.species}</div>
                    <div className="col-span-3 truncate text-slate-200">{t.fur || "Unknown"}</div>
                    <div className="col-span-2 text-right font-semibold">
                      {t.killsAtObtained ?? 0}
                    </div>
                    <div className="col-span-2 text-right text-slate-300">{fmt(t.obtainedAt)}</div>
                    <div className="col-span-1 text-right">
                      <button
                        className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
                        onClick={() => setExpandedId(expanded ? null : t.id)}
                      >
                        {expanded ? "−" : "+"}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="px-3 pb-3 text-sm text-slate-300">
                      <div className="rounded-lg bg-black border border-slate-800 p-3">
                        <div>
                          <span className="text-slate-400">Species:</span>{" "}
                          <span className="text-white font-semibold">{t.species}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Fur:</span>{" "}
                          <span className="text-white font-semibold">{t.fur || "Unknown"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Kills at obtained:</span>{" "}
                          <span className="text-white font-semibold">{t.killsAtObtained ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Obtained:</span>{" "}
                          <span className="text-white font-semibold">{new Date(t.obtainedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer / pagination */}
          <div className="flex items-center justify-between gap-3 px-3 py-3 bg-black/30">
            <div className="text-xs text-slate-400">
              Showing <span className="text-slate-200">{shown}</span> of{" "}
              <span className="text-slate-200">{filtered.length}</span>
            </div>

            <div className="flex gap-2">
              {showCount > 20 && (
                <button
                  className="text-xs px-3 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  onClick={() => {
                    setShowCount(20);
                    setExpandedId(null);
                  }}
                >
                  Show less
                </button>
              )}

              {remaining > 0 && (
                <button
                  className="text-xs px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 font-semibold"
                  onClick={() => setShowCount((c) => c + 20)}
                >
                  Show 20 more ({remaining} left)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
