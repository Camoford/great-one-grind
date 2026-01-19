import React, { useState, useRef, useEffect } from 'react';
import { RESERVES } from '../constants';
import { MapTiles } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
}

/* =========================
   IndexedDB helpers (big storage)
   ========================= */
const DB_NAME = 'hunterslog-assets';
const STORE_NAME = 'mapTiles';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: Blob) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(key: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbClearAll() {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* =========================
   Component
   ========================= */
const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, store }) => {
  const { state, importState, setCustomMapTile, clearCustomMap, getShareableLink } = store;

  const [syncCode, setSyncCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeUpload, setActiveUpload] = useState<{ resId: string; tile: keyof MapTiles } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [usage, setUsage] = useState(0);

  // Feedback mail link (no backend)
  const FEEDBACK_EMAIL = 'everydaylife9960@gmail.com';
  const SUBJECT = encodeURIComponent('Great One Grind — Beta Feedback');
  const BODY = encodeURIComponent(
    `Device (PC / Android / iPhone):
Browser (Chrome / Safari / Edge):
What happened?
What did you expect?

Steps to reproduce:
1)
2)
3)

(Optional) Screenshot link:`
  );
  const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${SUBJECT}&body=${BODY}`;

  useEffect(() => {
    // localStorage usage ONLY (won't count IndexedDB)
    const total = JSON.stringify(localStorage).length;
    setUsage(Math.min(100, Math.round((total / (5 * 1024 * 1024)) * 100)));
  }, [state, isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUpload) return;

    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;

      img.onload = async () => {
        try {
          // Resize on canvas (compression)
          const canvas = document.createElement('canvas');
          const MAX = 2000;

          let w = img.width;
          let h = img.height;

          if (w > h) {
            if (w > MAX) {
              h = Math.round(h * (MAX / w));
              w = MAX;
            }
          } else {
            if (h > MAX) {
              w = Math.round(w * (MAX / h));
              h = MAX;
            }
          }

          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);

          // Convert to Blob (much smaller than base64)
          const blob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
              (b) => {
                if (!b) reject(new Error('Failed to create blob'));
                else resolve(b);
              },
              'image/jpeg',
              0.8
            );
          });

          // Save blob in IndexedDB
          const key = `tile:${activeUpload.resId}:${String(activeUpload.tile)}`;
          await idbSet(key, blob);

          // Store ONLY the key in state (tiny)
          setCustomMapTile(activeUpload.resId, activeUpload.tile, key);

          setActiveUpload(null);
        } catch (err) {
          console.error(err);
          alert('Upload failed. Try a smaller image.');
        } finally {
          setIsCompressing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
    };

    reader.readAsDataURL(file);
  };

  const handleCopyLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    alert('Shareable Deep Link Copied! Send this URL to your tester.');
  };

  const handleClearAllTiles = async () => {
    const ok = confirm('This will remove ALL uploaded map images. Continue?');
    if (!ok) return;

    try {
      await idbClearAll();

      if (RESERVES && Array.isArray(RESERVES)) {
        for (const r of RESERVES) {
          if (r?.id) clearCustomMap(r.id);
        }
      }
      alert('All uploaded map images cleared.');
    } catch (e) {
      console.error(e);
      alert('Failed to clear images.');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex flex-col">
            <h2 className="oswald text-xl font-bold uppercase tracking-tight text-white italic">Tactical Assets</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full ${usage > 85 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usage}%` }} />
              </div>
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{usage}% Storage Used</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 text-2xl">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-10">
          <div className="space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full py-5 bg-emerald-600 rounded-2xl text-[10px] font-bold text-white uppercase tracking-[0.2em] shadow-xl border-b-4 border-emerald-800 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>🔗</span> Copy Shareable Link
            </button>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest text-center">Generates a URL with your current maps and stats</p>
          </div>

          {/* NEW: Feedback button */}
          <div className="space-y-3">
            <a
              href={mailto}
              className="w-full py-5 bg-slate-800 rounded-2xl text-[10px] font-bold text-white uppercase tracking-[0.2em] shadow-xl border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-200"
            >
              <span>✉️</span> Send Feedback
            </a>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest text-center">
              Opens your email app with a pre-filled beta feedback template
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Share your progress with other hunters</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleClearAllTiles}
              className="w-full py-4 bg-slate-800 rounded-2xl text-[10px] font-bold text-white/90 uppercase tracking-[0.2em] border border-white/10 active:scale-95 transition-all"
            >
              🧹 Clear All Uploaded Map Images
            </button>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest text-center">
              Clears uploaded map images (IndexedDB) to free space
            </p>
          </div>
        </div>
      </div>

      {isCompressing && (
        <div className="fixed inset-0 z-[400] bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm">
            Compressing image…
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;
