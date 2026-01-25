// components/SessionHistoryScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  readSessionHistory,
  SESSION_HISTORY_EVENT,
  type SessionHistoryEntry,
} from "../src/utils/sessionHistory";

// ✅ Great One Tracker screen (we mount it under this tab)
// (This is read-only; it also contains the Session Archive as a sub-tab.)
import GreatOnesArchive from "../src/features/archive/GreatOnesArchive";

type ViewMode = "history" | "tracker";
type SortMode = "newest" | "oldest" | "kills_desc" | "kills_asc";
type TimeWindow = "all" | "24h" | "7d" | "30d";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

function fmtDateTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function SegButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      className={cx(
        "rounded-xl border px-3 py-2 text-sm transition",
        props.active
          ? "border-white/15 bg-white/15 text-white"
          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
      )}
    >
      {props.children}
    </button>
  );
}

function Chip(props: { active?: boolean; onClick?: () => void; children: React.ReactNode; title?: string }) {
  const clickable = !!props.onClick;
  return (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      disabled={!clickable}
      className={cx(
        "rounded-full border px-2.5 py-1 text-xs transition",
        clickable ? "hover:bg-white/10" : "",
        props.active ? "border-white/20 bg-white/15 text-white" : "border-white/10 bg-black/20 text-white/80",
        !clickable ? "cursor-default" : ""
      )}
    >
      {props.children}
    </button>
  );
}

function Select(props: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      title={props.title}
      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20"
    >
      {props.children}
    </select>
  );
}

function nowMs() {
  return Date.now();
}

function windowMs(w: TimeWindow) {
  if (w === "24h") return 24 * 60 * 60 * 1000;
  if (w === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (w === "30d") return 30 * 24 * 60 * 60 * 1000;
  return Infinity;
}

export default function SessionHistoryScreen() {
  const [mode, setMode] = useState<ViewMode>("history");
  const [items, setItems] = useState<SessionHistoryEntry[]>(() => readSessionHistory());

  // UI prefs (read-only; safe localStorage)
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [windowFilter, setWindowFilter] = useState<TimeWindow>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");

  // Persist UI prefs (safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("greatonegrind_history_ui_v1");
      if (!raw) return;
      const v = JSON.parse(raw);
      if (typeof v?.query === "string") setQuery(v.query);
      if (v?.sort && ["newest", "oldest", "kills_desc", "kills_asc"].includes(v.sort)) setSort(v.sort);
      if (v?.window && ["all", "24h", "7d", "30d"].includes(v.window)) setWindowFilter(v.window);
      if (typeof v?.species === "string") setSpeciesFilter(v.species);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "greatonegrind_history_ui_v1",
        JSON.stringify({ query, sort, window: windowFilter, species: speciesFilter })
      );
    } catch {
      // ignore
    }
  }, [query, sort, windowFilter, speciesFilter]);

  useEffect(() => {
    const refresh = () => setItems(readSessionHistory());
    refresh();
    window.addEventListener(SESSION_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(SESSION_HISTORY_EVENT, refresh);
  }, []);

  const totalSessions = items.length;

  const allSpecies = useMemo(() => {
    const set = new Set<string>();
    for (const s of items) {
      if (s?.species) set.add(s.species);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];

    // time window
    const wms = windowMs(windowFilter);
    if (Number.isFinite(wms)) {
      const cutoff = nowMs() - wms;
      list = list.filter((s) => (s?.endedAt || 0) >= cutoff);
    }

    // species
    if (speciesFilter !== "all") {
      list = list.filter((s) => s.species === speciesFilter);
    }

    // search
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const sp = (s.species || "").toLowerCase();
        const note = ((s as any)?.note || "").toLowerCase();
        return sp.includes(q) || note.includes(q);
      });
    }

    // sort
    list.sort((a, b) => {
      const ta = a?.endedAt || 0;
      const tb = b?.endedAt || 0;
      if (sort === "newest") return tb - ta;
      if (sort === "oldest") return ta - tb;

      const ka = a?.killsThisSession || 0;
      const kb = b?.killsThisSession || 0;
      if (sort === "kills_desc") return kb - ka || (tb - ta);
      if (sort === "kills_asc") return ka - kb || (tb - ta);
      return tb - ta;
    });

    return list;
  }, [items, query, sort, windowFilter, speciesFilter]);

  const totals = useMemo(() => {
    let kills = 0;
    let diamonds = 0;
    let rares = 0;
    let durationMs = 0;

    for (const s of filtered) {
      kills += s.killsThisSession || 0;
      diamonds += s.diamondsThisSession || 0;
      rares += s.raresThisSession || 0;
      durationMs += s.durationMs || 0;
    }

    return { kills, diamonds, rares, durationMs };
  }, [filtered]);

  const clearFilters = () => {
    setQuery("");
    setSort("newest");
    setWindowFilter("all");
    setSpeciesFilter("all");
  };

  const showingAll = query.trim() === "" && sort === "newest" && windowFilter === "all" && speciesFilter === "all";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 pb-24">
      {/* Top switch (History / Great One Tracker) */}
      <div className="flex flex-wrap items-center gap-2">
        <SegButton active={mode === "history"} onClick={() => setMode("history")}>
          History
        </SegButton>
        <SegButton active={mode === "tracker"} onClick={() => setMode("tracker")}>
          Great One Tracker
        </SegButton>

        <div className="ml-auto text-xs text-white/55">
          {mode === "history" ? (
            <span>
              Tip: End sessions from the <span className="text-white/80 font-semibold">Grinds</span> screen
            </span>
          ) : (
            <span className="text-white/65">Read-only progress view</span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {mode === "tracker" ? (
        <GreatOnesArchive />
      ) : (
        <>
          {/* ✅ Beta clarity banner */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/75">
            <span className="font-semibold text-white/90">Logging tip:</span> Use the{" "}
            <span className="font-semibold text-white/90">TOP Start / End</span> on the Grinds screen to log{" "}
            <span className="font-semibold text-white/90">History + Stats</span> (kills, diamonds, rares).
          </div>

          {/* Header + controls */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-white">Session History</div>
                <div className="mt-1 text-sm text-white/60">Updates instantly when you end a session.</div>
              </div>

              {!showingAll ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  title="Reset search, sort, and filters"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search species (or notes, if present)…"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-white/20"
                />
              </div>

              <div className="sm:col-span-3">
                <Select value={sort} onChange={(v) => setSort(v as SortMode)} title="Sort sessions">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="kills_desc">Kills (high → low)</option>
                  <option value="kills_asc">Kills (low → high)</option>
                </Select>
              </div>

              <div className="sm:col-span-3">
                <Select value={windowFilter} onChange={(v) => setWindowFilter(v as TimeWindow)} title="Time window">
                  <option value="all">All time</option>
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </Select>
              </div>

              {/* Species chips */}
              <div className="sm:col-span-12">
                <div className="flex flex-wrap gap-2">
                  <Chip active={speciesFilter === "all"} onClick={() => setSpeciesFilter("all")}>
                    All species
                  </Chip>
                  {allSpecies.slice(0, 10).map((sp) => (
                    <Chip key={sp} active={speciesFilter === sp} onClick={() => setSpeciesFilter(sp)} title={`Filter: ${sp}`}>
                      {sp}
                    </Chip>
                  ))}
                  {allSpecies.length > 10 ? (
                    <Select value={speciesFilter} onChange={(v) => setSpeciesFilter(v)} title="More species">
                      <option value="all">More… (choose)</option>
                      {allSpecies.map((sp) => (
                        <option key={sp} value={sp}>
                          {sp}
                        </option>
                      ))}
                    </Select>
                  ) : null}
                </div>
                <div className="mt-2 text-xs text-white/45">
                  Showing <span className="font-semibold text-white/70">{pretty(filtered.length)}</span> of{" "}
                  <span className="font-semibold text-white/70">{pretty(totalSessions)}</span> sessions
                </div>
              </div>
            </div>

            {/* Totals (for filtered) */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/60">Sessions</div>
                <div className="mt-0.5 font-semibold">{pretty(filtered.length)}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/60">Kills</div>
                <div className="mt-0.5 font-semibold">{pretty(totals.kills)}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/60">Diamonds</div>
                <div className="mt-0.5 font-semibold">{pretty(totals.diamonds)}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/60">Rares</div>
                <div className="mt-0.5 font-semibold">{pretty(totals.rares)}</div>
              </div>
            </div>

            <div className="mt-2 text-xs text-white/45">
              Total time (filtered):{" "}
              <span className="font-semibold text-white/70">{fmtDuration(totals.durationMs)}</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="font-semibold text-white/85">No matches.</div>
              <div className="mt-1">
                Try clearing filters, changing the time window, or ending a new session from the Grinds screen.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s, idx) => (
                <div key={`${s.endedAt}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-white">{s.species}</div>
                      <div className="text-xs text-white/50">{fmtDateTime(s.endedAt)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                        {pretty(s.killsThisSession)} kills
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                        {pretty(s.diamondsThisSession)} diamonds
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                        {pretty(s.raresThisSession)} rares
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/80">
                        {fmtDuration(s.durationMs)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
