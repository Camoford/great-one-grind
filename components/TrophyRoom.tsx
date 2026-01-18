
import React, { useState } from 'react';
import { Trophy, Medal } from '../types';
import { MEDAL_COLORS } from '../constants';

interface TrophyRoomProps { store: any; }

const TrophyRoom: React.FC<TrophyRoomProps> = ({ store }) => {
  const { state } = store;
  const [filterSpeciesId, setFilterSpeciesId] = useState('ALL');
  const [filterMedal, setFilterMedal] = useState<'ALL' | Medal>('ALL');

  const filteredTrophies = state.trophies.filter((t: Trophy) => {
    const speciesMatch = filterSpeciesId === 'ALL' || t.speciesId === filterSpeciesId;
    const medalMatch = filterMedal === 'ALL' || t.medal === filterMedal;
    return speciesMatch && medalMatch;
  });

  return (
    <div className="p-4 space-y-6 flex flex-col h-full bg-[#0F172A]">
      {/* 2D: Filter Row */}
      <div className="grid grid-cols-2 gap-3">
        <select 
          value={filterSpeciesId}
          onChange={(e) => setFilterSpeciesId(e.target.value)}
          className="bg-slate-800 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white uppercase outline-none"
        >
          <option value="ALL">All Species</option>
          {state.species.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select 
          value={filterMedal}
          onChange={(e) => setFilterMedal(e.target.value as any)}
          className="bg-slate-800 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white uppercase outline-none"
        >
          <option value="ALL">All Medals</option>
          {Object.values(Medal).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* 2D: Trophy Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto custom-scrollbar pb-24">
        {filteredTrophies.length > 0 ? filteredTrophies.map((trophy: Trophy) => {
          const species = state.species.find((s: any) => s.id === trophy.speciesId);
          return (
            <div key={trophy.id} className="bg-slate-800 rounded-2xl border border-white/5 overflow-hidden shadow-xl group active:scale-95 transition-all">
              <div className="aspect-square relative">
                <img 
                  src={trophy.imageUrl || `https://picsum.photos/seed/${trophy.id}/400/400`} 
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all" 
                />
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase oswald ${MEDAL_COLORS[trophy.medal]}`}>
                  {trophy.medal}
                </div>
              </div>
              <div className="p-3 space-y-1">
                <h4 className="text-[10px] font-bold text-white uppercase truncate">{species?.name}</h4>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{trophy.furType}</p>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-2 py-20 text-center opacity-30">
            <span className="oswald text-xl uppercase font-bold tracking-[0.2em]">Zero Harvests</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrophyRoom;
