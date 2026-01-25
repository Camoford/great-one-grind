// src/features/archive/GreatOnesArchive.tsx
// Archive Polish — READ-ONLY
// Clean, defensive, grinder-friendly archive view
// No mutations, no store writes, no side effects

import React, { useMemo, useState } from "react";

// ✅ CORRECT RELATIVE PATHS
import { useHunterStore } from "../../../store";
import { readSessionHistory } from "../../utils/sessionHistory";

/* ---------------- helpers ---------------- */

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDateTime(ts: number) {
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    const min = pad2(d.getMinutes());
    return `${mm}/${dd}/${yyyy} ${h}:${min} ${ampm}`;
  } catch {
    return "";
  }
}

/* ---------------- component ---------------- */

type Row = {
  species: string;
  killsAtObtained: number;
  obtainedAt: number;
};

export default function GreatOnesArchive() {
  const trophies = useHunterStore((s) => s.trophies);

  // READ-ONLY fallback context
  useMemo(() => readSessionHistory(), []);

  const rows: Row[] = useMemo(() => {
    return trophies
      .filter((t) => t.obtainedAt)
      .map((t) => ({
        species: t.species,
        killsAtObtained: t.killsAtObtained ?? 0,
        obtainedAt: t.obtainedAt!,
      }))
      .sort((a, b) => b.obtainedAt - a.obtainedAt);
  }, [trophies]);

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.species.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Great Ones Archive</h2>
        <span className="text-xs opacity-60">
          Read-only • {pretty(filtered.length)} total
        </span>
      </div>

      <input
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="Search species…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="text-sm opacity-60">No archived Great Ones found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded border p-3"
            >
              <div>
                <div className="font-medium">{r.species}</div>
                <div className="text-xs opacity-60">
                  Obtained {formatDateTime(r.obtainedAt)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold">
                  {pretty(r.killsAtObtained)}
                </div>
                <div className="text-xs opacity-60">kills</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
