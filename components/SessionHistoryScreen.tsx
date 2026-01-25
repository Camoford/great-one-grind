// components/SessionHistoryScreen.tsx
// Session History + Great One Tracker (READ-ONLY)
// Fix: Great One Tracker lost species/dropdowns because wrong view was wired.
// This file owns the "History / Great One Tracker" toggle.
// - Restores Tracker view with species + dropdowns (read-only)
// - Keeps History view intact (read-only)
// - Adds Codex modal (single image): /codex/great-one-codex.png
// - NO store writes, NO mutations, NO side effects

import React, { useEffect, useMemo, useState } from "react";
import { useHunterStore } from "../store";
import { readSessionHistory } from "../src/utils/sessionHistory";

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

function safeArray(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

function getFurFromTrophy(t: any): string | null {
  const v =
    t?.fur ??
    t?.furName ??
    t?.furType ??
    t?.furVariation ??
    t?.variant ??
    t?.variation ??
    null;
  if (!v) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ---------------- types ---------------- */

type TrackerRow = {
  species: string;
  obtainedCount: number;
  lastObtainedAt: number | null;
  bestKills: number | null;
  avgKills: number | null;
  furOptions: string[];
};

type HistoryRow = {
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  killsThisSession?: number;
  species?: string;
};

/* ---------------- component ---------------- */

export default function SessionHistoryScreen() {
  // Store (read-only)
  const trophies = useHunterStore((s: any) => safeArray(s?.trophies));
  const grinds = useHunterStore((s: any) => safeArray(s?.grinds));

  // Local history (read-only)
  const historyRaw = useMemo(() => safeArray(readSessionHistory()), []);

  // Tabs
  const [tab, setTab] = useState<"history" | "tracker">("history");

  // Shared search box (acts on current tab)
  const [search, setSearch] = useState("");

  // Tracker filters
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [furFilter, setFurFilter] = useState<string>("");

  // Codex modal
  const [codexOpen, setCodexOpen] = useState(false);
  const CODEX_SRC = "/codex/great-one-codex.png";

  // Default species list (your pinned Great Ones)
  const defaultSpecies = useMemo(
    () => [
      "Whitetail Deer",
      "Moose",
      "Fallow Deer",
      "Black Bear",
      "Wild Boar",
      "Red Deer",
      "Tahr",
      "Red Fox",
      "Mule Deer",
    ],
    []
  );

  // Build species list: defaults + anything seen in grinds/trophies (defensive)
  const allSpecies: string[] = useMemo(() => {
    const set = new Set<string>();
    for (const s of defaultSpecies) set.add(s);

    for (const g of grinds) {
      const sp = String(g?.species ?? "").trim();
      if (sp) set.add(sp);
    }
    for (const t of trophies) {
      const sp = String(t?.species ?? "").trim();
      if (sp) set.add(sp);
    }

    const extras: string[] = [];
    for (const s of set) {
      if (!defaultSpecies.includes(s)) extras.push(s);
    }
    extras.sort((a, b) => a.localeCompare(b));

    return [...defaultSpecies, ...extras];
  }, [defaultSpecies, grinds, trophies]);

  // Keep selected species valid if list changes
  useEffect(() => {
    if (!selectedSpecies) return;
    if (!allSpecies.includes(selectedSpecies)) setSelectedSpecies("");
  }, [allSpecies, selectedSpecies]);

  /* ---------- Great One Tracker rows ---------- */

  const trackerRows: TrackerRow[] = useMemo(() => {
    const bySpecies: Record<string, any[]> = {};
    for (const t of trophies) {
      const sp = String(t?.species ?? "").trim();
      if (!sp) continue;
      if (!bySpecies[sp]) bySpecies[sp] = [];
      bySpecies[sp].push(t);
    }

    return allSpecies.map((sp) => {
      const list = bySpecies[sp] || [];

      let obtainedCount = 0;
      let lastObtainedAt: number | null = null;

      const killsList: number[] = [];
      const furSet = new Set<string>();

      for (const t of list) {
        const obtainedAt = typeof t?.obtainedAt === "number" ? t.obtainedAt : null;
        if (obtainedAt) {
          obtainedCount += 1;
          if (!lastObtainedAt || obtainedAt > lastObtainedAt) lastObtainedAt = obtainedAt;
        }

        const k = typeof t?.killsAtObtained === "number" ? t.killsAtObtained : null;
        if (k !== null && Number.isFinite(k)) killsList.push(Math.max(0, Math.floor(k)));

        const fur = getFurFromTrophy(t);
        if (fur) furSet.add(fur);
      }

      const bestKills =
        killsList.length > 0 ? Math.min(...killsList.filter((n) => Number.isFinite(n))) : null;

      const avgKills =
        killsList.length > 0
          ? Math.round(killsList.reduce((a, b) => a + b, 0) / killsList.length)
          : null;

      const furOptions = Array.from(furSet).sort((a, b) => a.localeCompare(b));

      return {
        species: sp,
        obtainedCount,
        lastObtainedAt,
        bestKills,
        avgKills,
        furOptions,
      };
    });
  }, [allSpecies, trophies]);

  const filteredTracker = useMemo(() => {
    let list = [...trackerRows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.species.toLowerCase().includes(q));
    }

    if (selectedSpecies) {
      list = list.filter((r) => r.species === selectedSpecies);
    }

    if (furFilter.trim()) {
      const q = furFilter.toLowerCase();
      list = list.filter((r) => r.furOptions.some((f) => f.toLowerCase().includes(q)));
    }

    // Sort: obtained first, then alpha
    list.sort((a, b) => {
      const ao = a.obtainedCount > 0 ? 1 : 0;
      const bo = b.obtainedCount > 0 ? 1 : 0;
      if (ao !== bo) return bo - ao;
      return a.species.localeCompare(b.species);
    });

    return list;
  }, [trackerRows, search, selectedSpecies, furFilter]);

  /* ---------- Session History rows ---------- */

  const historyRows: HistoryRow[] = useMemo(() => {
    // We keep this defensive because your history format has evolved.
    // We try to render what we can safely.
    return historyRaw.map((x: any) => ({
      startedAt: typeof x?.startedAt === "number" ? x.startedAt : undefined,
      endedAt: typeof x?.endedAt === "number" ? x.endedAt : undefined,
      durationMs: typeof x?.durationMs === "number" ? x.durationMs : undefined,
      killsThisSession:
        typeof x?.killsThisSession === "number"
          ? x.killsThisSession
          : typeof x?.kills === "number"
          ? x.kills
          : undefined,
      species: typeof x?.species === "string" ? x.species : undefined,
    }));
  }, [historyRaw]);

  const filteredHistory = useMemo(() => {
    let list = [...historyRows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => (r.species || "").toLowerCase().includes(q));
    }

    // Newest first (endedAt if possible, else startedAt)
    list.sort((a, b) => {
      const at = (a.endedAt ?? a.startedAt ?? 0) || 0;
      const bt = (b.endedAt ?? b.startedAt ?? 0) || 0;
      return bt - at;
    });

    return list;
  }, [historyRows, search]);

  /* ---------------- UI ---------------- */

  return (
    <div className="p-4 space-y-4">
      {/* Top bar / subtitle (matches what you see in screenshot) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-white/60">Read-only progress view</div>
        </div>

        {tab === "tracker" ? (
          <button
            type="button"
            onClick={() => setCodexOpen(true)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 hover:bg-white/10"
            title="Open Great One Codex"
          >
            Codex
          </button>
        ) : null}
      </div>

      {/* Toggle pills */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("history")}
          className={
            tab === "history"
              ? "rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm"
              : "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm opacity-80 hover:bg-white/10"
          }
        >
          History
        </button>

        <button
          type="button"
          onClick={() => setTab("tracker")}
          className={
            tab === "tracker"
              ? "rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm"
              : "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm opacity-80 hover:bg-white/10"
          }
        >
          Great One Tracker
        </button>

        <div className="ml-auto text-xs text-white/60">
          {tab === "history"
            ? `Read-only • ${pretty(filteredHistory.length)} total`
            : `Read-only • ${pretty(filteredTracker.length)} species`}
        </div>
      </div>

      {/* Shared search */}
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/40"
        placeholder={tab === "history" ? "Search species..." : "Search species..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Tracker filters */}
      {tab === "tracker" ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90"
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            title="Filter by species"
          >
            <option value="">All species</option>
            {allSpecies.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/40"
            placeholder="Filter by fur/variant (if recorded)..."
            value={furFilter}
            onChange={(e) => setFurFilter(e.target.value)}
          />

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSpecies("");
              setFurFilter("");
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            title="Clear filters"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Body */}
      {tab === "history" ? (
        filteredHistory.length === 0 ? (
          <div className="text-sm text-white/60">No session history found.</div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((r, i) => (
              <div
                key={`${r.startedAt ?? 0}-${r.endedAt ?? 0}-${i}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-white/90">
                    {r.species || "Session"}
                  </div>
                  <div className="text-xs text-white/60">
                    {r.endedAt ? `Ended ${formatDateTime(r.endedAt)}` : r.startedAt ? `Started ${formatDateTime(r.startedAt)}` : ""}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-white/90">
                    {typeof r.killsThisSession === "number" ? pretty(r.killsThisSession) : "-"}
                  </div>
                  <div className="text-xs text-white/60">kills</div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredTracker.length === 0 ? (
        <div className="text-sm text-white/60">No species match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredTracker.map((r) => (
            <div
              key={r.species}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="flex gap-3 p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-semibold text-white/80">
                  {initials(r.species)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white/90">
                        {r.species}
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/60">
                        {r.obtainedCount > 0 && r.lastObtainedAt
                          ? `Last obtained: ${formatDateTime(r.lastObtainedAt)}`
                          : "Not obtained yet"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-white/60">Obtained</div>
                      <div className="text-base font-semibold text-white/90">
                        {pretty(r.obtainedCount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
                      <div className="text-[10px] text-white/60">Best kills</div>
                      <div className="text-sm font-semibold text-white/90">
                        {r.bestKills === null ? "-" : pretty(r.bestKills)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
                      <div className="text-[10px] text-white/60">Avg kills</div>
                      <div className="text-sm font-semibold text-white/90">
                        {r.avgKills === null ? "-" : pretty(r.avgKills)}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown restored */}
                  <div className="mt-2">
                    <select
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90"
                      defaultValue=""
                      title="Fur/variant options recorded from trophies"
                    >
                      <option value="">
                        {r.furOptions.length > 0
                          ? "Fur/variant (recorded) - select"
                          : "Fur/variant (none recorded yet)"}
                      </option>
                      {r.furOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 px-3 py-2 text-[11px] text-white/60">
                Tip: Add trophies via Quick Log to populate fur/variant history here.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Codex Modal (ONE image) */}
      {codexOpen ? (
        <div className="fixed inset-0 z-[400]">
          <button
            type="button"
            aria-label="Close codex"
            onClick={() => setCodexOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative z-[410] flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white/90">Great One Codex</div>
                  <div className="text-[11px] text-white/60">
                    Read-only image reference • Scroll to view full
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCodexOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
                  title="Close"
                >
                  X
                </button>
              </div>

              <div className="max-h-[80vh] overflow-auto p-3">
                <img
                  src={CODEX_SRC}
                  alt="Great One Codex"
                  className="h-auto w-full rounded-2xl border border-white/10"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = "none";
                  }}
                />
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                  If you see this message but no image: put your PNG at{" "}
                  <span className="font-mono text-white/80">public/codex/great-one-codex.png</span>.
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] text-white/60">
                  Tip: Use browser zoom (Ctrl + / Ctrl -) to view closer.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
