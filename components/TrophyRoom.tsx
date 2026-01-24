// components/TrophyRoom.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function fmtDate(ts: any) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return "";
  try {
    return new Date(n).toLocaleString();
  } catch {
    return "";
  }
}

type TrophyLike = {
  id?: string;
  species?: string;
  fur?: string;
  killsAtObtained?: number;
  obtainedAt?: number;
};

export default function TrophyRoom() {
  const trophies = useHunterStore((s: any) => (Array.isArray(s.trophies) ? (s.trophies as TrophyLike[]) : []));
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return trophies;

    return trophies.filter((t) => {
      const species = safeStr(t.species).toLowerCase();
      const fur = safeStr(t.fur).toLowerCase();
      return species.includes(query) || fur.includes(query);
    });
  }, [trophies, q]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-24">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-white">Trophies</div>
            <div className="mt-0.5 text-sm text-white/60">
              Your obtained Great Ones and notable trophies.
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            Total: <span className="font-semibold text-white">{pretty(trophies.length)}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search species or fur..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
          />
          {q.trim() ? (
            <button
              onClick={() => setQ("")}
              className="shrink-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm hover:bg-white/10"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          No trophies found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t, idx) => {
            const species = safeStr(t.species).trim() || "Unknown";
            const fur = safeStr(t.fur).trim();
            const kills = Number.isFinite(Number(t.killsAtObtained)) ? Number(t.killsAtObtained) : 0;
            const when = fmtDate((t as any).obtainedAt);

            return (
              <div
                key={(t.id || "") + "-" + idx}
                className="rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{species}</div>
                    <div className="mt-0.5 text-xs text-white/50">
                      {when ? when : "Date unknown"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                      {pretty(kills)} kills
                    </span>
                    {fur ? (
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                        Fur: {fur}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
