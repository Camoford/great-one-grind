// src/features/archive/GreatOnesArchive.tsx
import React, { useMemo, useState } from "react";

// ✅ store.ts is at project root (not inside src)
import { useHunterStore } from "../../../store";

// ✅ sessionHistory wrapper is inside src/utils
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
    return `${yyyy}-${mm}-${dd} ${h}:${min} ${ampm}`;
  } catch {
    return "—";
  }
}

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function safeNumber(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function calcKph(kills: number, durationMs: number) {
  const hours = durationMs > 0 ? durationMs / 3600000 : 0;
  if (hours <= 0) return 0;
  return kills / hours;
}

type SortKey = "newest" | "oldest" | "bestPace" | "mostKills";

function normalize(s: string) {
  return (s || "").toLowerCase().trim();
}

/* ---------------- component ---------------- */

export default function GreatOnesArchive() {
  const isPro = useHunterStore((s: any) => !!s.isPro);
  const isProTest =
    useHunterStore(
      (s: any) => !!(s.proTestMode ?? s.isProTestMode ?? s.testPro ?? s.proTest ?? false)
    ) || false;

  const proEnabled = isPro || isProTest;

  const [query, setQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const rawSessions = useMemo(() => {
    try {
      const data = readSessionHistory();
      return Array.isArray(data) ? data.slice() : [];
    } catch {
      return [];
    }
  }, []);

  const allSpecies = useMemo(() => {
    const set = new Set<string>();
    rawSessions.forEach((s: any) => {
      const sp = String(s?.species ?? s?.grindSpecies ?? s?.targetSpecies ?? "").trim();
      if (sp) set.add(sp);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rawSessions]);

  const sessions = useMemo(() => {
    const q = normalize(query);

    let rows = rawSessions.map((s: any) => {
      const kills = safeNumber(s.kills ?? s.sessionKills ?? s.killsThisSession ?? 0);
      const start = safeNumber(s.startedAt ?? s.start ?? s.startTs ?? 0);
      const end = safeNumber(s.endedAt ?? s.end ?? s.endTs ?? 0);
      const durationMs = Math.max(0, end - start);
      const kph = calcKph(kills, durationMs);

      const species = String(s?.species ?? s?.grindSpecies ?? s?.targetSpecies ?? "—");

      return { kills, start, end, durationMs, kph, species };
    });

    if (speciesFilter !== "All") {
      rows = rows.filter((r) => r.species === speciesFilter);
    }

    if (q) {
      rows = rows.filter((r) =>
        normalize(`${r.species} ${formatDateTime(r.end || r.start)}`).includes(q)
      );
    }

    rows.sort((a, b) => {
      if (sortKey === "oldest") return a.end - b.end;
      if (sortKey === "bestPace") return b.kph - a.kph;
      if (sortKey === "mostKills") return b.kills - a.kills;
      return b.end - a.end;
    });

    return rows;
  }, [rawSessions, query, speciesFilter, sortKey]);

  const totalKills = useMemo(() => sessions.reduce((sum, r) => sum + r.kills, 0), [sessions]);
  const totalMs = useMemo(() => sessions.reduce((sum, r) => sum + r.durationMs, 0), [sessions]);

  return (
    <div className="p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Session History</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
              Great Ones Archive
            </span>
            {proEnabled ? (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">
                PRO {isProTest ? "TEST" : ""}
              </span>
            ) : null}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Read-only history of ended sessions. Filters below are UI-only and do not change your data.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[11px] text-white/50">Sessions</div>
            <div className="text-sm font-semibold tabular-nums">{pretty(sessions.length)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[11px] text-white/50">Kills</div>
            <div className="text-sm font-semibold tabular-nums">{pretty(totalKills)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-[11px] text-white/50">Time</div>
            <div className="text-sm font-semibold tabular-nums">{formatDuration(totalMs)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-xs text-white/60">Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search (species/date)…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
            />
          </div>

          <div>
            <div className="text-xs text-white/60">Species</div>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
            >
              {allSpecies.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-white/60">Sort</div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="bestPace">Best pace</option>
              <option value="mostKills">Most kills</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!sessions.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">No sessions found</div>
            <div className="mt-1 text-sm text-white/60">
              Start a session in Grinder HUD, then end it — it will appear here.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((r, idx) => (
              <div key={`sess_${idx}_${r.end}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{r.species || "Session"}</div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70 tabular-nums">
                        {formatDateTime(r.end || r.start)}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-white/60">
                      Duration: <span className="text-white/80 tabular-nums">{formatDuration(r.durationMs)}</span> • Pace:{" "}
                      <span className="text-white/80 tabular-nums">
                        {r.kph > 0 ? `${pretty(Math.round(r.kph))}/hr` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <div className="text-[11px] text-white/50">Kills</div>
                      <div className="text-sm font-semibold tabular-nums">{pretty(r.kills)}</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <div className="text-[11px] text-white/50">Pace</div>
                      <div className="text-sm font-semibold tabular-nums">
                        {r.kph > 0 ? pretty(Math.round(r.kph)) : "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <div className="text-[11px] text-white/50">Time</div>
                      <div className="text-sm font-semibold tabular-nums">{formatDuration(r.durationMs)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-[11px] text-white/50">
        Notes: filters/search/sort are UI-only. This screen is read-only and does not change your data.
      </div>
    </div>
  );
}
