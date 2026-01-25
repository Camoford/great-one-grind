// components/GrindsList.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore, type Grind } from "../store";
import SessionHUD from "./SessionHUD";
import GrinderHUD from "./GrinderHUD";

type SortMode = "pinned" | "kills_desc" | "kills_asc" | "name_asc";

function pretty(n: number) {
  return new Intl.NumberFormat().format(n);
}

export default function GrindsList() {
  const grinds = useHunterStore((s) => s.grinds);
  const hardcoreMode = useHunterStore((s) => s.hardcoreMode);

  const incKills = useHunterStore((s) => s.incKills);
  const resetKills = useHunterStore((s) => s.resetKills);

  const [sort, setSort] = useState<SortMode>("pinned");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...grinds];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) => g.species.toLowerCase().includes(q));
    }

    switch (sort) {
      case "kills_desc":
        list.sort((a, b) => b.kills - a.kills);
        break;
      case "kills_asc":
        list.sort((a, b) => a.kills - b.kills);
        break;
      case "name_asc":
        list.sort((a, b) => a.species.localeCompare(b.species));
        break;
      default:
        list.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }

    return list;
  }, [grinds, search, sort]);

  const hasAnyGrinds = grinds.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="p-3 space-y-3 text-neutral-100">
      <SessionHUD />

      {/* Sticky controls (DARK-SAFE) */}
      <div className="sticky top-0 z-10 -mx-3 px-3 pt-2 pb-2 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500"
            placeholder="Search species…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-neutral-100"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="pinned">Pinned</option>
            <option value="kills_desc">Kills ↓</option>
            <option value="kills_asc">Kills ↑</option>
            <option value="name_asc">Name A–Z</option>
          </select>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
          <div>{filtered.length} shown</div>
          <div>{hardcoreMode ? "Hardcore: ON" : "Hardcore: OFF"}</div>
        </div>
      </div>

      {/* EMPTY STATES (UI-only) */}
      {!hasAnyGrinds ? (
        <EmptyStateNoGrinds
          hardcoreMode={hardcoreMode}
          onClear={() => {
            setSearch("");
            setSort("pinned");
          }}
        />
      ) : !hasResults ? (
        <EmptyStateNoResults
          search={search}
          onClearSearch={() => setSearch("")}
          onResetAll={() => {
            setSearch("");
            setSort("pinned");
          }}
        />
      ) : null}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((g) => (
          <GrindCard
            key={g.id}
            grind={g}
            hardcoreMode={hardcoreMode}
            incKills={incKills}
            resetKills={resetKills}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Empty States ---------------- */

function EmptyShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-neutral-100 leading-tight">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-neutral-300/80 leading-relaxed">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function EmptyStateNoGrinds({
  hardcoreMode,
  onClear,
}: {
  hardcoreMode: boolean;
  onClear: () => void;
}) {
  return (
    <EmptyShell
      title="No grinds yet"
      subtitle="Your grind list is empty on this device. This can happen on first install, after clearing site data, or on a new browser."
    >
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-200">
            Quick Fix
          </div>
          <div className="mt-2 space-y-2 text-sm text-neutral-200/90 leading-relaxed">
            <div>
              • Open <span className="font-semibold">Settings</span> and restore a
              backup if you have one.
            </div>
            <div>
              • If you’re a first-time user, you should see default grinds after
              the next update or your first seed (depending on your build).
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
              Layout
            </div>
            <div className="text-[11px] text-neutral-500">
              {hardcoreMode ? "Hardcore ON" : "Hardcore OFF"}
            </div>
          </div>
          <div className="mt-2 text-sm text-neutral-200/85 leading-relaxed">
            Once grinds appear, you’ll get quick-add buttons and grinder insights
            per species.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onClear}
            className="rounded-xl border border-white/10 bg-black/35 py-3 text-sm font-semibold text-neutral-100 active:scale-[0.99]"
          >
            Clear Filters
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-semibold text-neutral-200 active:scale-[0.99]"
          >
            Refresh
          </button>
        </div>

        <div className="text-[11px] text-neutral-500">
          Tip: If your list ever disappears, don’t panic — restoring your backup is
          the fastest recovery.
        </div>
      </div>
    </EmptyShell>
  );
}

function EmptyStateNoResults({
  search,
  onClearSearch,
  onResetAll,
}: {
  search: string;
  onClearSearch: () => void;
  onResetAll: () => void;
}) {
  const q = search.trim();
  return (
    <EmptyShell
      title="No matches"
      subtitle={
        q
          ? `Nothing matches “${q}”. Try clearing search or switching sort.`
          : "No items to show with current filters."
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onClearSearch}
          className="rounded-xl border border-white/10 bg-black/35 py-3 text-sm font-semibold text-neutral-100 active:scale-[0.99]"
        >
          Clear Search
        </button>
        <button
          onClick={onResetAll}
          className="rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-semibold text-neutral-200 active:scale-[0.99]"
        >
          Reset Filters
        </button>
      </div>
    </EmptyShell>
  );
}

/* ---------------- Grind Card ---------------- */

function GrindCard({
  grind,
  hardcoreMode,
  incKills,
  resetKills,
}: {
  grind: Grind;
  hardcoreMode: boolean;
  incKills: (id: string, delta: number) => void;
  resetKills: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4 space-y-2.5 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate text-neutral-100">
            {grind.species}
          </div>

          <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
            <span>Total: {pretty(grind.kills)}</span>
            <span className="text-neutral-600">•</span>
            <span>{hardcoreMode ? "Hardcore layout" : "Simple layout"}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] text-neutral-400">Kills</div>
          <div className="text-lg font-bold leading-none text-neutral-100">
            {pretty(grind.kills)}
          </div>
        </div>
      </div>

      {/* Insights (DARK-SAFE wrapper) */}
      <div className="rounded-xl border border-white/10 bg-black/25 p-2 sm:p-3">
        <GrinderHUD species={grind.species} />
      </div>

      {/* Buttons */}
      {!hardcoreMode ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-2 sm:p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300 mb-2">
            Add Kills
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[1, 10, 50, 100].map((n) => (
              <PrimaryBtn
                key={n}
                label={`+${n}`}
                onClick={() => incKills(grind.id, n)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* ADD KILLS — dominant */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-2 sm:p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-200">
                Add Kills
              </div>
              <div className="text-[11px] text-neutral-500">Main</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[1, 10, 50, 100].map((n) => (
                <PrimaryBtn
                  key={n}
                  label={`+${n}`}
                  onClick={() => incKills(grind.id, n)}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {[500, 1000].map((n) => (
                <PowerBtn
                  key={n}
                  label={`+${n}`}
                  onClick={() => incKills(grind.id, n)}
                />
              ))}
            </div>
          </div>

          {/* FIX MISTAKE — tucked away */}
          <details className="rounded-xl border border-white/10 bg-black/15 overflow-hidden">
            <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Fix Mistake
                </span>
                <span className="text-[11px] text-neutral-500">(tap)</span>
              </div>
              <span className="text-[12px] text-neutral-500">▼</span>
            </summary>

            <div className="px-3 pb-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {[-1, -10, -50, -100].map((n) => (
                  <MutedBtn
                    key={n}
                    label={`${n}`}
                    onClick={() => incKills(grind.id, n)}
                  />
                ))}
              </div>
            </div>
          </details>

          {/* Reset */}
          <button
            onClick={() => resetKills(grind.id)}
            className="w-full rounded-xl border border-white/10 bg-black/15 py-3 text-xs font-semibold text-neutral-300 active:scale-[0.99]"
          >
            Reset Kills
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Buttons ---------------- */

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/35 py-3 text-sm font-extrabold text-neutral-100 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}

function PowerBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/50 py-3 text-sm font-black text-neutral-100 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}

function MutedBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-black/20 py-3 text-sm font-semibold text-neutral-200 opacity-90 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}
