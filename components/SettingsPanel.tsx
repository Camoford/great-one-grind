// SettingsPanel.tsx
import React, { useMemo, useRef, useState } from "react";
import { APP_VERSION, IS_BETA, APP_NAME } from "../appMeta";

type BackupPayloadV1 = {
  schema: "great-one-grind-backup";
  version: 1;
  meta: {
    appName: string;
    appVersion: string;
    isBeta: boolean;
    exportedAtISO: string;
    origin: string;
    userAgent: string;
  };
  // localStorage snapshot for this origin
  storage: Record<string, string>;
};

function buildBackupPayload(): BackupPayloadV1 {
  const storage: Record<string, string> = {};

  // Snapshot ALL keys for this app's domain.
  // This is safest because we don't need to know your internal key names.
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const v = localStorage.getItem(k);
    if (typeof v === "string") storage[k] = v;
  }

  return {
    schema: "great-one-grind-backup",
    version: 1,
    meta: {
      appName: APP_NAME,
      appVersion: APP_VERSION,
      isBeta: IS_BETA,
      exportedAtISO: new Date().toISOString(),
      origin: window.location.origin,
      userAgent: navigator.userAgent,
    },
    storage,
  };
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

function safeJsonParse(text: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    const value = JSON.parse(text);
    return { ok: true, value };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

function validateBackupPayload(data: any): data is BackupPayloadV1 {
  return (
    data &&
    data.schema === "great-one-grind-backup" &&
    data.version === 1 &&
    data.meta &&
    typeof data.meta.appName === "string" &&
    typeof data.meta.appVersion === "string" &&
    typeof data.meta.isBeta === "boolean" &&
    typeof data.meta.exportedAtISO === "string" &&
    data.storage &&
    typeof data.storage === "object"
  );
}

export default function SettingsPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string>("");

  const estimatedKeys = useMemo(() => localStorage.length, []);
  const handleViewDisclaimer = () => {
    localStorage.removeItem("beta_disclaimer_seen");
    window.location.reload();
  };

  const handleResetApp = () => {
    const confirmed = window.confirm(
      "This will erase ALL app data including grinds, stats, and trophies.\n\nAre you sure you want to continue?"
    );
    if (!confirmed) return;

    localStorage.clear();
    window.location.reload();
  };

  const handleExportBackup = () => {
    const payload = buildBackupPayload();
    const text = JSON.stringify(payload, null, 2);

    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");

    downloadTextFile(`great-one-grind-backup_${stamp}.json`, text);
  };

  const handleCopyBackup = async () => {
    try {
      const payload = buildBackupPayload();
      const text = JSON.stringify(payload);
      await navigator.clipboard.writeText(text);
      setImportStatus("✅ Backup copied to clipboard.");
      setTimeout(() => setImportStatus(""), 2500);
    } catch {
      setImportStatus("❌ Could not copy. Use Export Backup instead.");
      setTimeout(() => setImportStatus(""), 3000);
    }
  };

  const handleClickImport = () => {
    setImportStatus("");
    fileInputRef.current?.click();
  };

  const applyBackup = (payload: BackupPayloadV1) => {
    const confirmed = window.confirm(
      `Importing a backup will OVERWRITE your current data on this device.\n\n` +
        `Backup info:\n` +
        `• App: ${payload.meta.appName}\n` +
        `• Version: ${payload.meta.appVersion}\n` +
        `• Exported: ${payload.meta.exportedAtISO}\n\n` +
        `Continue?`
    );
    if (!confirmed) return;

    // Overwrite current storage with the backup snapshot
    localStorage.clear();
    for (const [k, v] of Object.entries(payload.storage)) {
      localStorage.setItem(k, v);
    }

    // Refresh app to re-hydrate state
    window.location.reload();
  };

  const handleImportFileChosen: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("Reading backup file...");

    try {
      const text = await file.text();
      const parsed = safeJsonParse(text);

      if (!parsed.ok) {
        setImportStatus(`❌ Invalid JSON: ${parsed.error}`);
        return;
      }

      const data = parsed.value;
      if (!validateBackupPayload(data)) {
        setImportStatus("❌ This does not look like a Great One Grind backup file.");
        return;
      }

      setImportStatus("✅ Backup file validated. Importing...");
      applyBackup(data);
    } catch (err: any) {
      setImportStatus(`❌ Import failed: ${err?.message || "Unknown error"}`);
    } finally {
      // allow importing the same file again if needed
      e.target.value = "";
      setTimeout(() => setImportStatus(""), 4000);
    }
  };

  return (
    <div className="space-y-6 px-2">
      <h2 className="text-xl font-semibold">Settings</h2>

      {IS_BETA && (
        <p className="text-sm text-slate-400">
          {APP_NAME} is currently{" "}
          <span className="font-semibold text-amber-300">v{APP_VERSION}</span>. Data may reset between versions.
        </p>
      )}

      {/* Backup / Restore */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Backup & Restore</div>
            <div className="text-xs text-slate-400">
              Protect your grind data. Works across devices & URLs. (Keys detected: {estimatedKeys})
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            onClick={handleExportBackup}
            className="w-full rounded-xl border border-white/10 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            ⬇️ Export Backup
          </button>

          <button
            onClick={handleClickImport}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 text-sm font-semibold hover:bg-slate-800"
          >
            ⬆️ Import Backup
          </button>

          <button
            onClick={handleCopyBackup}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 text-sm font-semibold hover:bg-slate-800"
          >
            📋 Copy Backup
          </button>
        </div>

        {importStatus && <div className="text-xs text-slate-300">{importStatus}</div>}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFileChosen}
          className="hidden"
        />
      </div>

      {/* Send Feedback */}
      <button
        onClick={() =>
          (window.location.href =
            "mailto:feedback@greatonegrind.app?subject=Great%20One%20Grind%20Feedback")
        }
        className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 text-sm font-semibold hover:bg-slate-800"
      >
        📩 Send Feedback
      </button>

      {/* View Beta Disclaimer Again */}
      <button
        onClick={handleViewDisclaimer}
        className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 text-sm font-semibold hover:bg-slate-800"
      >
        ⚠️ View Beta Disclaimer Again
      </button>

      {/* Reset App Data */}
      <button
        onClick={handleResetApp}
        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20"
      >
        🗑 Reset App Data
      </button>
    </div>
  );
}
