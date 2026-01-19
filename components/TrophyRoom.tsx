
import React, { useState } from 'react';
import { Trophy, Medal } from '../types';

const FALLBACK_MEDAL_COLORS: Record<string, string> = {
  [Medal.DIAMOND]: '#3B82F6',
  [Medal.GOLD]: '#FACC15',
  [Medal.SILVER]: '#9CA3AF',
  [Medal.BRONZE]: '#D97706',
  [Medal.FABLED]: '#A855F7',
  None: '#6B7280',
};

interface TrophyRoomProps {
  store: any;
}

const TrophyRoom: React.FC<TrophyRoomProps> = ({ store }) => {
  const { state, deleteTrophy } = store;
  const [selected, setSelected] = useState<Trophy | null>(null);

  const trophies: Trophy[] = state.trophies || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white">Trophy Gallery</h2>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          {trophies.length} saved
        </span>
      </div>

      {trophies.length === 0 ? (
        <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 text-center">
          <p className="text-sm text-slate-300 font-bold">No trophies yet</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Log a kill and save a photo to start your gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {trophies
            .slice()
            .reverse()
            .map((t: Trophy) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/40 text-left"
              >
                <div className="aspect-square bg-slate-800/40">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt="trophy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                      No Photo
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-white truncate">
                      {t.speciesName || 'Unknown'}
                    </p>
                    <span
                      className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border border-white/10"
                      style={{
                        backgroundColor: FALLBACK_MEDAL_COLORS[t.medal as any] || '#111827',
                        color: 'white',
                      }}
                    >
                      {t.medal === Medal.FABLED ? 'G.O' : String(t.medal).substring(0, 3)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-bold truncate">
                    Fur: {t.furType || '—'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold truncate">
                    Horn: {t.hornType || '—'}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div>
                <p className="text-sm font-extrabold text-white">{selected.speciesName || 'Unknown'}</p>
                <p className="text-[11px] text-slate-500 font-bold">
                  {selected.medal === Medal.FABLED ? 'Great One' : selected.medal}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-extrabold"
              >
                Close
              </button>
            </div>

            <div className="aspect-square bg-slate-800/40">
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt="trophy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-bold">
                  No Photo
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg border border-white/10"
                  style={{
                    backgroundColor: FALLBACK_MEDAL_COLORS[selected.medal as any] || '#111827',
                    color: 'white',
                  }}
                >
                  {selected.medal === Medal.FABLED ? 'G.O' : String(selected.medal).substring(0, 3)}
                </span>

                <p className="text-xs text-slate-300 font-bold">
                  Fur: <span className="text-white">{selected.furType || '—'}</span>
                </p>
              </div>

              <p className="text-xs text-slate-300 font-bold">
                Horn: <span className="text-white">{selected.hornType || '—'}</span>
              </p>

              <button
                onClick={() => {
                  deleteTrophy(selected.id);
                  setSelected(null);
                }}
                className="w-full py-3 rounded-2xl bg-red-600 text-white font-extrabold uppercase tracking-widest text-xs"
              >
                Delete Trophy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrophyRoom;
