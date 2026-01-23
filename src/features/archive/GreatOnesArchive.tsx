import React, { useMemo, useState } from "react";

// ✅ root store
import { useHunterStore } from "../../../store";

// ✅ session history lives in src/utils
import { readSessionHistory } from "../../utils/sessionHistory";

/* ---------------- helpers ---------------- */

function pretty(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
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

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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

/* ---------------- types ---------------- */

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

/* ---------------- small UI bits ---------------- */

function Pill(props: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide " +
        (props.dim ? "opacity-70" : "")
      }
    >
      {props.children}
    </span>
  );
}

function IconChevron(props: { open: boolean }) {
  return (
    <span className={"inline-block transition-transform " + (props.open ? "rotate-180" : "")}>
      ▾
    </span>
  );
}

/* ---------------- component ---------------- */

export default function GreatOnesArchive() {
  const grinds = useHunterStore((s) => s.grinds);
  const isPro = useHunterStore((s) => s.isPro);

  const [openId, setOpenId] = useState<string | null>(null);

  const [speciesFilter, setSpeciesFilter] = useState<string>("All");
  const [fromYmd, setFromYmd] = useState<string>("");
  const [toYmd, setToYmd] = useState<string>("");

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

    return allSessions.filter((s) => {
      const ts =
        safeNum(s.endedAt) ||
        safeNum(s.endAt) ||
        safeNum(s.startedAt) ||
        safeNum(s.startAt) ||
        0;

      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;

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
  }, [allSessions, fromYmd, toYmd, speciesFilter]);

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
      exportedAt: Date.now(),
      filters: { speciesFilter, fromYmd, toYmd },
      sessions: filtered,
    };
    downloadFile(
      `greatonegrind_archive_${Date.now()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
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
              kills: safeNum(b?.kills),
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Archive</h2>
        <div className="text-xs opacity-70">
          {isPro ? (
            <span className="inline-flex items-center gap-2">
              <Pill>PRO</Pill>
              <span>Enabled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Pill dim>FREE</Pill>
              <span>Read-only</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white/5 p-3">
          <div className="text-xs opacity-70">Sessions (filtered)</div>
          <div className="text-2xl font-semibold">{pretty(totals.sessions)}</div>
        </div>
        <div className="rounded-2xl border bg-white/5 p-3">
          <div className="text-xs opacity-70">Total Kills</div>
          <div className="text-2xl font-semibold">{pretty(totals.totalKills)}</div>
          <div className="text-xs opacity-70 mt-1">
            Pace:{" "}
            {totals.totalKills > 0 ? (
              <span className="font-medium">{pretty(totals.pace)} / hour</span>
            ) : (
              <span className="opacity-70">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white/5 p-4 space-y-3">
        <div className="font-semibold">Filters</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-xs opacity-70">Species</div>
            <select
              className="w-full rounded-xl border bg-black/20 p-2"
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
            >
              {speciesOptions.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-xs opacity-70">From</div>
            <input
              type="date"
              className="w-full rounded-xl border bg-black/20 p-2"
              value={fromYmd}
              onChange={(e) => setFromYmd(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs opacity-70">To</div>
            <input
              type="date"
              className="w-full rounded-xl border bg-black/20 p-2"
              value={toYmd}
              onChange={(e) => setToYmd(e.target.value)}
            />
          </div>
        </div>

        {isPro ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              className="rounded-xl border px-3 py-2 text-sm hover:bg-white/10"
              onClick={exportJson}
            >
              Export JSON
            </button>
            <button
              className="rounded-xl border px-3 py-2 text-sm hover:bg-white/10"
              onClick={exportCsv}
            >
              Export CSV
            </button>
            <div className="text-xs opacity-70">Exports use your current filters.</div>
          </div>
        ) : (
          <div className="rounded-xl border bg-black/20 p-3 text-xs opacity-80">
            <span className="font-semibold">PRO Export</span> (CSV / JSON) is locked.
            Go to the <span className="font-semibold">Upgrade</span> tab and enable{" "}
            <span className="font-semibold">PRO Test</span> (UI-only).
          </div>
        )}
      </div>

      {/* List */}
      <div className="rounded-2xl border bg-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Sessions</div>
          <div className="text-xs opacity-70">
            Showing {pretty(filtered.length)} of {pretty(allSessions.length)}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm opacity-70">
            No sessions match your filters yet. Try clearing the date range or switching species to{" "}
            <span className="font-medium">All</span>.
          </div>
        ) : (
          <div className="space-y-3">
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
                <div key={id} className="rounded-xl border bg-white/5 p-3">
                  <button
                    className="w-full text-left"
                    onClick={() => setOpenId(isOpen ? null : id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{active}</div>
                        <div className="text-xs opacity-70">
                          {fmtDate(ts)} • {formatDuration(ms)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{pretty(kills)}</div>
                          <div className="text-[11px] opacity-70">kills</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {kills > 0 ? pretty(p) : "—"}
                          </div>
                          <div className="text-[11px] opacity-70">/hr</div>
                        </div>

                        <div className="inline-flex items-center gap-2 text-xs opacity-80">
                          <span className="font-medium">{isOpen ? "Hide" : "Details"}</span>
                          <IconChevron open={isOpen} />
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs opacity-70">
                        Day: <span className="font-medium">{toYmd(ts) || "—"}</span>
                      </div>

                      {breakdown.length > 0 ? (
                        <div className="rounded-xl border bg-black/20 p-3">
                          <div className="text-xs opacity-70 mb-2">
                            Per-species breakdown
                          </div>
                          <div className="space-y-1">
                            {breakdown.map((b) => (
                              <div key={b.species} className="flex justify-between text-sm">
                                <span className="opacity-90">{b.species}</span>
                                <span className="font-medium">{pretty(b.kills)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm opacity-70">
                          No per-species breakdown recorded for this session.
                        </div>
                      )}

                      <div className="text-xs opacity-70">
                        Archive is <span className="font-semibold">read-only</span>.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
