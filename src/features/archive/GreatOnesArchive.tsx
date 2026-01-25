import React, { useEffect, useMemo, useState } from "react";

// ✅ root store
import { useHunterStore } from "../../../store";

// ✅ session history lives in src/utils
import { readSessionHistory } from "../../utils/sessionHistory";

/**
 * GreatOnesArchive (read-only)
 * - UI polish + grinder-friendly archive browsing
 * - NO store/session mutation
 * - Export buttons remain PRO-gated (UI-only)
 */

type SpeciesRow = { species: string; kills: number };

type SessionLike = {
  startedAt?: number;
  startAt?: number;
  endedAt?: number;
  endAt?: number;
  durationMs?: number;
  totalKills?: number;
  activeSpecies?: string;
  species?: string;
  speciesBreakdown?: SpeciesRow[];
};

type SortMode = "newest" | "oldest" | "kills_desc" | "kills_asc";
type WindowMode = "all" | "24h" | "7d" | "30d";
type Density = "comfortable" | "compact";

/* ---------------- helpers ---------------- */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pretty(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(ts: number) {
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
    return "";
  }
}

function toYmd(ts: number) {
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function pace(kills: number, ms: number) {
  if (!ms || ms <= 0) return 0;
  return (kills / ms) * 3600000;
}

function windowMs(w: WindowMode) {
  if (w === "24h") return 24 * 60 * 60 * 1000;
  if (w === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (w === "30d") return 30 * 24 * 60 * 60 * 1000;
  return Infinity;
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

function toCsvValue(v: any) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

/* ---------------- small UI bits ---------------- */

function Pill(props: { children: React.ReactNode; tone?: "pro" | "free" | "muted" }) {
  const tone = props.tone || "muted";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        tone === "pro"
          ? "border-amber-500/20 bg-amber-500/20 text-amber-200"
          : tone === "free"
          ? "border-white/10 bg-black/20 text-white/75"
          : "border-white/10 bg-black/20 text-white/70"
      )}
    >
      {props.children}
    </span>
  );
}

function Chip(props: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const clickable = !!props.onClick;
  return (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      disabled={!clickable}
      className={cx(
        "rounded-full border px-2.5 py-1 text-xs transition",
        props.active ? "border-white/20 bg-white/15 text-white" : "border-white/10 bg-black/20 text-white/80",
        clickable ? "hover:bg-white/10" : "cursor-default opacity-80"
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
  className?: string;
  title?: string;
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      title={props.title}
      className={cx(
        "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/20",
        props.className
      )}
    >
      {props.children}
    </select>
  );
}

function Toggle(props: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.checked)}
      className={cx(
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm",
        props.checked ? "border-white/20 bg-white/10" : "border-white/10 bg-black/20 hover:bg-white/5"
      )}
      title={props.hint}
    >
      <span className="font-medium text-white/85">{props.label}</span>
      <span
        className={cx(
          "inline-flex h-6 w-11 items-center rounded-full border transition",
          props.checked ? "border-emerald-500/25 bg-emerald-500/20" : "border-white/10 bg-white/5"
        )}
      >
        <span
          className={cx(
            "ml-1 h-4 w-4 rounded-full bg-white transition",
            props.checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}

function IconChevron(props: { open: boolean }) {
  return <span className={cx("inline-block transition-transform", props.open ? "rotate-180" : "")}>▾</span>;
}

function BadgeStat(props: { label: string; value: string; tone?: "soft" | "hard" }) {
  const tone = props.tone || "soft";
  return (
    <span
      className={cx(
        "rounded-full border px-2 py-1 text-xs",
        tone === "hard" ? "border-red-500/15 bg-red-500/10 text-red-100" : "border-white/10 bg-black/20 text-white/80"
      )}
    >
      <span className="font-semibold">{props.value}</span> <span className="opacity-80">{props.label}</span>
    </span>
  );
}

/* ---------------- component ---------------- */

export default function GreatOnesArchive() {
  const grinds = useHunterStore((s) => s.grinds);
  const isPro = useHunterStore((s) => s.isPro);
  const hardcoreMode = useHunterStore((s) => (s as any).hardcoreMode); // read-only visual cue if present

  const [openId, setOpenId] = useState<string | null>(null);

  // UI prefs (safe localStorage)
  const [speciesFilter, setSpeciesFilter] = useState<string>("All");
  const [fromYmd, setFromYmd] = useState<string>("");
  const [toYmd, setToYmd] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [windowFilter, setWindowFilter] = useState<WindowMode>("all");
  const [density, setDensity] = useState<Density>("comfortable");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("greatonegrind_archive_ui_v2");
      if (!raw) return;
      const v = JSON.parse(raw);
      if (typeof v?.speciesFilter === "string") setSpeciesFilter(v.speciesFilter);
      if (typeof v?.fromYmd === "string") setFromYmd(v.fromYmd);
      if (typeof v?.toYmd === "string") setToYmd(v.toYmd);
      if (typeof v?.query === "string") setQuery(v.query);
      if (v?.sort && ["newest", "oldest", "kills_desc", "kills_asc"].includes(v.sort)) setSort(v.sort);
      if (v?.window && ["all", "24h", "7d", "30d"].includes(v.window)) setWindowFilter(v.window);
      if (v?.density && ["comfortable", "compact"].includes(v.density)) setDensity(v.density);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "greatonegrind_archive_ui_v2",
        JSON.stringify({ speciesFilter, fromYmd, toYmd, query, sort, window: windowFilter, density })
      );
    } catch {
      // ignore
    }
  }, [speciesFilter, fromYmd, toYmd, query, sort, windowFilter, density]);

  const allSessions: SessionLike[] = useMemo(() => {
    const list = readSessionHistory();
    return Array.isArray(list) ? (list.filter(Boolean) as SessionLike[]) : [];
  }, []);

  const speciesOptions = useMemo(() => {
    const set = new Set<string>();

    for (const g of grinds as any[]) {
      if (g?.species) set.add(String(g.species));
    }

    for (const s of allSessions) {
      const sp = String(s.activeSpecies || s.species || "");
      if (sp) set.add(sp);
      if (Array.isArray(s.speciesBreakdown)) {
        for (const b of s.speciesBreakdown) {
          if (b?.species) set.add(String(b.species));
        }
      }
    }

    const list = Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return ["All", ...list];
  }, [grinds, allSessions]);

  const filtered = useMemo(() => {
    const fromTs = fromYmd ? new Date(`${fromYmd}T00:00:00`).getTime() : 0;
    const toTs = toYmd ? new Date(`${toYmd}T23:59:59`).getTime() : 0;

    const wms = windowMs(windowFilter);
    const cutoff = Number.isFinite(wms) ? Date.now() - wms : 0;

    const q = query.trim().toLowerCase();

    let list = allSessions.filter((s) => {
      const ts =
        safeNum(s.endedAt) ||
        safeNum(s.endAt) ||
        safeNum(s.startedAt) ||
        safeNum(s.startAt) ||
        0;

      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (cutoff && ts < cutoff) return false;

      if (speciesFilter !== "All") {
        const sp = String(s.activeSpecies || s.species || "");
        if (sp === speciesFilter) return true;

        if (Array.isArray(s.speciesBreakdown)) {
          return s.speciesBreakdown.some((b) => String(b?.species || "") === speciesFilter);
        }
        return false;
      }

      return true;
    });

    if (q) {
      list = list.filter((s) => {
        const sp = String(s.activeSpecies || s.species || "").toLowerCase();
        const day = toYmd(
          safeNum(s.endedAt) || safeNum(s.endAt) || safeNum(s.startedAt) || safeNum(s.startAt) || 0
        ).toLowerCase();
        return sp.includes(q) || day.includes(q);
      });
    }

    list.sort((a, b) => {
      const ta = safeNum(a.endedAt) || safeNum(a.endAt) || safeNum(a.startedAt) || safeNum(a.startAt) || 0;
      const tb = safeNum(b.endedAt) || safeNum(b.endAt) || safeNum(b.startedAt) || safeNum(b.startAt) || 0;

      const ka = safeNum(a.totalKills);
      const kb = safeNum(b.totalKills);

      if (sort === "newest") return tb - ta;
      if (sort === "oldest") return ta - tb;
      if (sort === "kills_desc") return kb - ka || (tb - ta);
      if (sort === "kills_asc") return ka - kb || (tb - ta);
      return tb - ta;
    });

    return list;
  }, [allSessions, fromYmd, toYmd, speciesFilter, query, sort, windowFilter]);

  const totals = useMemo(() => {
    let sessions = filtered.length;
    let totalKills = 0;
    let totalMs = 0;

    for (const s of filtered) {
      totalKills += safeNum(s.totalKills);
      totalMs += safeNum(s.durationMs);
    }

    const p = pace(totalKills, totalMs);
    return { sessions, totalKills, totalMs, pace: p };
  }, [filtered]);

  function exportJson() {
    const payload = {
      kind: "archive_export_v1",
      exportedAt: Date.now(),
      filters: { speciesFilter, fromYmd, toYmd, query, sort, windowFilter, density },
      sessions: filtered,
    };
    downloadFile(`greatonegrind_archive_${Date.now()}.json`, JSON.stringify(payload, null, 2), "application/json");
  }

  function exportCsv() {
    const headers = [
      "timestamp",
      "date",
      "activeSpecies",
      "durationMs",
      "duration",
      "totalKills",
      "paceKillsPerHour",
      "speciesBreakdown",
    ];

    const rows = filtered.map((s) => {
      const ts =
        safeNum(s.endedAt) ||
        safeNum(s.endAt) ||
        safeNum(s.startedAt) ||
        safeNum(s.startAt) ||
        0;

      const ms = safeNum(s.durationMs);
      const kills = safeNum(s.totalKills);
      const p = pace(kills, ms);

      const sp = String(s.activeSpecies || s.species || "");
      const breakdown = Array.isArray(s.speciesBreakdown)
        ? JSON.stringify(
            s.speciesBreakdown.map((b) => ({
              species: String(b?.species || ""),
              kills: safeNum((b as any)?.kills),
            }))
          )
        : "[]";

      return [
        toCsvValue(ts),
        toCsvValue(fmtDate(ts)),
        toCsvValue(sp),
        toCsvValue(ms),
        toCsvValue(formatDuration(ms)),
        toCsvValue(kills),
        toCsvValue(Math.round(p)),
        toCsvValue(breakdown),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    downloadFile(`greatonegrind_archive_${Date.now()}.csv`, csv, "text/csv");
  }

  const showingAll =
    speciesFilter === "All" &&
    !fromYmd &&
    !toYmd &&
    query.trim() === "" &&
    sort === "newest" &&
    windowFilter === "all" &&
    density === "comfortable";

  const clearFilters = () => {
    setSpeciesFilter("All");
    setFromYmd("");
    setToYmd("");
    setQuery("");
    setSort("newest");
    setWindowFilter("all");
    setDensity("comfortable");
  };

  const wrap = cx(
    "space-y-4 rounded-2xl border p-4",
    hardcoreMode ? "border-red-500/15 bg-red-500/5" : "border-white/10 bg-white/5"
  );

  const card = cx(
    "rounded-2xl border bg-white/5",
    hardcoreMode ? "border-red-500/15" : "border-white/10"
  );

  const rowPad = density === "compact" ? "p-2.5" : "p-3";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">Great One Tracker</h2>
          <div className="mt-0.5 text-sm text-white/60">
            Read-only archive of ended sessions. Filter, search, and export (PRO).
          </div>
        </div>

        <div className="text-xs opacity-70 shrink-0">
          {isPro ? (
            <span className="inline-flex items-center gap-2">
              <Pill tone="pro">PRO</Pill>
              <span>Enabled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Pill tone="free">FREE</Pill>
              <span>Read-only</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cx(card, "p-3")}>
          <div className="text-xs text-white/60">Sessions (filtered)</div>
          <div className="mt-0.5 text-2xl font-semibold">{pretty(totals.sessions)}</div>
          <div className="mt-1 text-xs text-white/45">
            Total time: <span className="font-semibold text-white/70">{formatDuration(totals.totalMs)}</span>
          </div>
        </div>

        <div className={cx(card, "p-3")}>
          <div className="text-xs text-white/60">Total Kills</div>
          <div className="mt-0.5 text-2xl font-semibold">{pretty(totals.totalKills)}</div>
          <div className="text-xs text-white/45 mt-1">
            Pace:{" "}
            {totals.totalKills > 0 ? (
              <span className="font-semibold text-white/70">{pretty(totals.pace)} / hour</span>
            ) : (
              <span className="opacity-70">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={wrap}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold">Filters</div>
          {!showingAll ? (
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              onClick={clearFilters}
              title="Reset all filters"
            >
              Clear Filters
            </button>
          ) : (
            <span className="text-xs text-white/50">Tip: Use filters to compare routes</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-xs text-white/60 mb-1">Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search species or day (YYYY-MM-DD)…"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-white/20"
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-white/60 mb-1">Species</div>
            <Select value={speciesFilter} onChange={setSpeciesFilter}>
              {speciesOptions.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-white/60 mb-1">Sort</div>
            <Select value={sort} onChange={(v) => setSort(v as SortMode)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="kills_desc">Kills (high → low)</option>
              <option value="kills_asc">Kills (low → high)</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-white/60 mb-1">Window</div>
            <Select value={windowFilter} onChange={(v) => setWindowFilter(v as WindowMode)}>
              <option value="all">All time</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </Select>
          </div>

          <div className="md:col-span-4">
            <div className="text-xs text-white/60 mb-1">From</div>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={fromYmd}
              onChange={(e) => setFromYmd(e.target.value)}
            />
          </div>

          <div className="md:col-span-4">
            <div className="text-xs text-white/60 mb-1">To</div>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
              value={toYmd}
              onChange={(e) => setToYmd(e.target.value)}
            />
          </div>

          <div className="md:col-span-4">
            <div className="text-xs text-white/60 mb-1">Density</div>
            <div className="grid grid-cols-2 gap-2">
              <Toggle checked={density === "compact"} onChange={(v) => setDensity(v ? "compact" : "comfortable")} label="Compact" hint="Tighter rows" />
              <Toggle checked={density === "comfortable"} onChange={(v) => setDensity(v ? "comfortable" : "compact")} label="Comfort" hint="More spacing" />
            </div>
          </div>
        </div>

        {/* Export / upsell */}
        {isPro ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm hover:bg-white/10" onClick={exportJson}>
              Export JSON
            </button>
            <button className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm hover:bg-white/10" onClick={exportCsv}>
              Export CSV
            </button>
            <div className="text-xs text-white/55">Exports use your current filters.</div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/80">
            <span className="font-semibold text-white/90">PRO Export</span> (CSV / JSON) is locked. Go to the{" "}
            <span className="font-semibold text-white/90">Upgrade</span> tab and enable{" "}
            <span className="font-semibold text-white/90">PRO Test</span> (UI-only).
          </div>
        )}
      </div>

      {/* List */}
      <div className={cx(card, "p-4 space-y-3")}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Sessions</div>
          <div className="text-xs text-white/55">
            Showing <span className="font-semibold text-white/80">{pretty(filtered.length)}</span> of{" "}
            <span className="font-semibold text-white/80">{pretty(allSessions.length)}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <div className="font-semibold text-white/85">No sessions match your filters.</div>
            <div className="mt-1">
              Try clearing the date range, switching species to <span className="font-semibold">All</span>, or widening the time window.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s, idx) => {
              const ts =
                safeNum(s.endedAt) ||
                safeNum(s.endAt) ||
                safeNum(s.startedAt) ||
                safeNum(s.startAt) ||
                0;

              const id = `${ts}_${idx}`;
              const ms = safeNum(s.durationMs);
              const kills = safeNum(s.totalKills);
              const p = pace(kills, ms);

              const active = String(s.activeSpecies || s.species || "Unknown");

              const breakdown: SpeciesRow[] = Array.isArray(s.speciesBreakdown)
                ? s.speciesBreakdown
                    .map((b) => ({
                      species: String((b as any)?.species || ""),
                      kills: safeNum((b as any)?.kills),
                    }))
                    .filter((b) => b.species)
                : [];

              const isOpen = openId === id;

              return (
                <div key={id} className={cx("rounded-xl border bg-white/5", hardcoreMode ? "border-red-500/15" : "border-white/10")}>
                  <button
                    type="button"
                    className={cx("w-full text-left", rowPad)}
                    onClick={() => setOpenId(isOpen ? null : id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{active}</div>
                        <div className="text-xs text-white/60">
                          {fmtDate(ts)} • {formatDuration(ms)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                        <BadgeStat label="kills" value={pretty(kills)} tone={hardcoreMode ? "hard" : "soft"} />
                        <BadgeStat label="/hr" value={kills > 0 ? pretty(p) : "—"} tone={hardcoreMode ? "hard" : "soft"} />

                        <span className="inline-flex items-center gap-2 text-xs text-white/75">
                          <span className="font-medium">{isOpen ? "Hide" : "Details"}</span>
                          <IconChevron open={isOpen} />
                        </span>
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className={cx("border-t", hardcoreMode ? "border-red-500/10" : "border-white/10", density === "compact" ? "px-2.5 pb-2.5" : "px-3 pb-3")}>
                      <div className="pt-2.5 space-y-2">
                        <div className="text-xs text-white/60">
                          Day: <span className="font-semibold text-white/85">{toYmd(ts) || "—"}</span>
                        </div>

                        {breakdown.length > 0 ? (
                          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="text-xs text-white/60 mb-2">Per-species breakdown</div>
                            <div className="space-y-1">
                              {breakdown.map((b) => (
                                <div key={b.species} className="flex justify-between text-sm">
                                  <span className="text-white/85">{b.species}</span>
                                  <span className="font-semibold text-white/90">{pretty(b.kills)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-white/70">
                            No per-species breakdown recorded for this session.
                          </div>
                        )}

                        <div className="text-xs text-white/55">
                          Archive is <span className="font-semibold">read-only</span>.
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[11px] text-white/45">
        Tip: The Archive is a read-only view of session history. For logging, always use TOP Start/End on the Grinds screen.
      </div>
    </div>
  );
}
