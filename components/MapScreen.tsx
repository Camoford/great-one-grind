
import React, { useState, useRef, useEffect } from 'react';
import { ZoneType, Zone, MapTiles } from '../types';
import { RESERVES, PIN_COLORS } from '../constants';

interface MapScreenProps { store: any; }

const MapScreen: React.FC<MapScreenProps> = ({ store }) => {
  const { state, updateZone, deleteZone, setActiveReserve } = store;
  const activeId = state.activeReserveId || 'layton';
  const [filterType, setFilterType] = useState<ZoneType | 'ALL'>('ALL');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const reserve = RESERVES.find(r => r.id === activeId);
  const tiles = state.customMapTiles?.[activeId] as MapTiles;
  const hasTiles = tiles && Object.values(tiles).some(v => !!v);

  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, [activeId]);

  const handleMapClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (rect.width)) * 100;
    const y = ((e.clientY - rect.top) / (rect.height)) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    updateZone({ id: Math.random().toString(36).substr(2, 9), name: `P${state.zones.length}`, type: filterType === 'ALL' ? ZoneType.DRINK : filterType, reserveId: activeId, x, y });
  };

  const onStart = (e: any) => { setIsPanning(true); const c = e.touches ? e.touches[0] : e; setLastPos({ x: c.clientX, y: c.clientY }); };
  const onMove = (e: any) => { if (!isPanning) return; const c = e.touches ? e.touches[0] : e; setOffset(p => ({ x: p.x + (c.clientX - lastPos.x), y: p.y + (c.clientY - lastPos.y) })); setLastPos({ x: c.clientX, y: c.clientY }); };

  return (
    <div className="relative h-full flex flex-col bg-black overflow-hidden select-none">
      <div className="z-50 bg-[#0F172A]/90 backdrop-blur-xl p-4 border-b border-white/5 shadow-2xl">
        <select value={activeId} onChange={(e) => setActiveReserve(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm font-bold text-white appearance-none outline-none focus:border-emerald-500">
          {RESERVES.map(r => <option key={r.id} value={r.id}>{r.name} {state.customMapTiles[r.id] ? '★' : ''}</option>)}
        </select>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 custom-scrollbar">
          {['ALL', ...Object.values(ZoneType)].map(t => (
            <button key={t} onClick={() => setFilterType(t as any)} className={`whitespace-nowrap px-4 py-2 rounded-lg text-[8px] font-bold uppercase border transition-all ${filterType === t ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-slate-500 border-white/5'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative touch-none overflow-hidden" onMouseDown={onStart} onMouseMove={onMove} onMouseUp={() => setIsPanning(false)} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={() => setIsPanning(false)} onClick={handleMapClick}>
        <div ref={gridRef} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', transition: isPanning ? 'none' : 'transform 0.1s' }} className="relative">
          {hasTiles ? (
            <div className="grid grid-cols-2 grid-rows-2 w-[1600px] h-[1600px] bg-slate-900 border border-white/10">
              {['nw', 'ne', 'sw', 'se'].map(t => (
                <div key={t} className="w-full h-full border border-white/5 flex items-center justify-center">
                  {tiles[t as keyof MapTiles] ? <img src={tiles[t as keyof MapTiles]} className="w-full h-full object-cover" style={{ imageRendering: '-webkit-optimize-contrast' } as any} /> : <span className="text-[8px] text-slate-700 font-bold uppercase">{t} Empty</span>}
                </div>
              ))}
            </div>
          ) : (
            <img src={reserve?.mapUrl} className="w-[100vw] h-auto block opacity-40 grayscale" style={{ imageRendering: '-webkit-optimize-contrast' } as any} />
          )}

          {state.zones.filter((z: Zone) => z.reserveId === activeId && (filterType === 'ALL' || z.type === filterType)).map((z: Zone) => (
            <div key={z.id} className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center shadow-2xl active:scale-150 transition-transform ${PIN_COLORS[z.type]}`} style={{ left: `${z.x}%`, top: `${z.y}%` }} onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteZone(z.id); }}>
              <span className="text-xs">📍</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-50">
        <button onClick={() => setScale(p => Math.min(10, p + 1.5))} className="w-14 h-14 bg-slate-900/90 rounded-2xl border border-white/10 text-white font-bold shadow-2xl">＋</button>
        <button onClick={() => { setScale(1); setOffset({x:0, y:0}); }} className="w-14 h-14 bg-emerald-600/90 rounded-2xl border border-white/20 text-white text-[10px] font-bold shadow-2xl">CENTER</button>
        <button onClick={() => setScale(p => Math.max(0.1, p - 1.5))} className="w-14 h-14 bg-slate-900/90 rounded-2xl border border-white/10 text-white font-bold shadow-2xl">－</button>
      </div>
    </div>
  );
};

export default MapScreen;
