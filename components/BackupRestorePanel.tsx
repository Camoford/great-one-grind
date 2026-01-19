// components/BackupRestorePanel.tsx
import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

function formatLastBackup(ts: number | null) {
  if (!ts) return "Never";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "Unknown";
  }
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function BackupRestorePanel() {
  // Use any so we don't fight store typing yet.
  // Next step we will ensure store.ts provides these fields properly.
  const exportBackup = useHunterStore((s: any) => s.exportBackup);
  const importBackup = useHunterStore((s: any) => s.importBackup);
  const factoryReset = useHunterStore((s: any) => s.factoryReset);
  const lastBackupAt = useHunterStore((s: any) => s.lastBackupAt);
  const markBackupNow = useHunterStore((s: any) => s.markBackupNow);

  const [text, setText] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "err"; msg: string }>({
    type: "idle",
    msg: "",
  });

  const lastBackupLabel = useMemo(
    () => formatLastBackup((lastBackupAt ?? null) as number | null),
    [lastBackupAt]
  );

  const onExportCopy = async () => {
    try {
      const payload = exportBackup();
      await navigator.clipboard.writeText(payload);
      markBackupNow?.();
      setStatus({ type: "ok", msg: "Backup copied to clipboard." });
    } catch {
      setStatus({ type: "err", msg: "Could not copy. Try Export Download instead." });
    }
  };

  const onExportDownload = () => {
    try {
      const payload = exportBackup();
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadTextFile(`greatonegrind-backup-${stamp}.json`, payload);
      markBackupNow?.();
      setStatus({ type: "ok", msg: "Backup downloaded." });
    } catch {
      setStatus({ type: "err", msg: "Export download failed." });
    }
  };

  const onImport = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setStatus({ type: "err", msg: "Paste your backup JSON first." });
      return;
    }
    const res = importBackup(trimmed);
    if (res?.ok) {
      setStatus({ type: "ok", msg: "Restore successful." });
      setText("");
    } else {
      setStatus({ type: "err", msg: res?.error || "Restore failed." });
    }
  };

  const onFactoryReset = () => {
    const ok = window.confirm(
      "Factory Reset will permanently delete your data on this device.\n\nAre you sure you want to continue?"
    );
    if (!ok) return;
    factoryReset?.();
    setText("");
    setStatus({ type: "ok", msg: "Factory Reset complete." });
  };

  // If store backup functions are not wired yet, show a helpful message instead of crashing.
  const missing = !exportBackup || !importBackup || !factoryReset;

  if (missing) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100">
        <div className="text-sm font-semibold text-white">Backup / Restore</div>
        <div className="text-xs text-white/60 mt-2">
          Backup features aren’t wired in <span className="text-white/80">store.ts</span> yet.
          Next step: add <span className="text-white/80">exportBackup / importBackup / factoryReset / lastBackupAt</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Backup / Restore</div>
          <div className="text-xs text-white/60 mt-1">
            Phase 1: Manual export/import for this device.
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase tracking-widest text-white/50">Last Backup</div>
          <div className="text-xs text-white/80 mt-1">{lastBackupLabel}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onExportCopy}
          className="rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20"
        >
          Export Backup (Copy)
        </button>

        <button
          onClick={onExportDownload}
          className="rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20"
        >
          Export Backup (Download)
        </button>
      </div>

      <div className="mt-4">
        <div className="text-xs text-white/70 mb-2">Paste backup JSON here to restore:</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          className="w-full rounded-xl bg-black/30 border border-white/10 p-3 text-xs text-white/90 outline-none focus:border-white/20"
          placeholder='{"version":1,"...":"..."}'
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onImport}
          className="rounded-xl bg-sky-500/15 border border-sky-500/25 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/20"
        >
          Import Restore
        </button>

        <button
          onClick={onFactoryReset}
          className="rounded-xl bg-red-500/15 border border-red-500/25 px-3 py-2 text-sm text-red-100 hover:bg-red-500/20"
        >
          Factory Reset
        </button>
      </div>

      {status.msg ? (
        <div
          className={[
            "mt-3 text-xs rounded-xl px-3 py-2 border",
            status.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100"
              : status.type === "err"
              ? "bg-red-500/10 border-red-500/20 text-red-100"
              : "bg-white/5 border-white/10 text-white/80",
          ].join(" ")}
        >
          {status.msg}
        </div>
      ) : null}
    </div>
  );
}
