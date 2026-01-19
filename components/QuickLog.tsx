import React, { useState, useRef, useMemo } from 'react';
import { Medal } from '../types';
import { MEDAL_COLORS, DEFAULT_FURS, HORN_MAP, DEFAULT_HORNS } from '../constants';

interface QuickLogProps {
  store: any;
}

const QuickLog: React.FC<QuickLogProps> = ({ store }) => {
  const { state, logTrophy, undoLast } = store;
  const lastUsedSpecies = state.species.find((s: any) => s.lastUsed) || state.species[0];

  const [selectedSpeciesId, setSelectedSpeciesId] = useState(lastUsedSpecies?.id);
  const [selectedMedal, setSelectedMedal] = useState<Medal>(Medal.BRONZE);

  // Value states
  const [furType, setFurType] = useState('Common');
  const [hornType, setHornType] = useState('Medium');

  // Custom toggle states
  const [customFurMode, setCustomFurMode] = useState(false);
  const [customHornMode, setCustomHornMode] = useState(false);
  const [customFur, setCustomFur] = useState('');
  const [customHorn, setCustomHorn] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // FIX: No FUR_MAP usage
  const availableFurs = useMemo(() => DEFAULT_FURS, []);
  const availableHorns = useMemo(
    () => (HORN_MAP as any)?.[selectedSpeciesId] || DEFAULT_HORNS,
    [selectedSpeciesId]
  );

  const handleSave = (imageUri?: string) => {
    logTrophy({
      speciesId: selectedSpeciesId,
      medal: selectedMedal,
      furType: customFurMode ? (customFur || 'Custom') : furType,
      hornType: customHornMode ? (customHorn || 'Custom') : hornType,
      imageUrl: imageUri,
    });

    setCustomFur('');
    setCustomHorn('');
    setCustomFurMode(false);
    setCustomHornMode(false);
  };

  const triggerPhoto = () => {
    if (state.hardcoreMode) {
      handleSave();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="p-4 space-y-6 flex flex-col items-center">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => handleSave(ev.target?.result as string);
            reader.readAsDataURL(file);
          }
        }}
        className="hidden"
      />

      {/* Species */}
      <div className="w-full space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Species
        </label>
        <select
          value={selectedSpeciesId}
          onChange={(e) => {
            setSelectedSpeciesId(e.target.value);
            setFurType('Common');
            setHornType('Medium');
            setCustomFurMode(false);
            setCustomHornMode(false);
          }}
          className="w-full bg-[#1E293B] border border-white/10 rounded-xl p-4 text-lg font-bold text-white appearance-none outline-none focus:border-emerald-500 transition-all shadow-inner"
        >
          {state.species.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Medal */}
      <div className="w-full space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Medal
        </label>
        <div className="w-full grid grid-cols-5 gap-1.5">
          {[Medal.BRONZE, Medal.SILVER, Medal.GOLD, Medal.DIAMOND, Medal.FABLED].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMedal(m)}
              className={`py-3 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                selectedMedal === m
                  ? `${MEDAL_COLORS[m]} border-white/40 scale-105 shadow-lg`
                  : 'bg-slate-800/50 border-white/5 text-slate-500'
              }`}
            >
              {m === Medal.FABLED ? 'G.O' : m.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Fur */}
      <div className="w-full space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Fur Type
        </label>

        {customFurMode ? (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={customFur}
              onChange={(e) => setCustomFur(e.target.value)}
              placeholder="Enter Custom Fur..."
              className="flex-1 bg-slate-900 border border-emerald-500 rounded-xl p-3 text-sm font-bold text-white outline-none"
            />
            <button
              onClick={() => setCustomFurMode(false)}
              className="px-4 bg-slate-800 rounded-xl text-slate-400 text-xs font-bold uppercase"
            >
              X
            </button>
          </div>
        ) : (
          <select
            value={furType}
            onChange={(e) => {
              if (e.target.value === 'CUSTOM_ENTRY') {
                setCustomFurMode(true);
              } else {
                setFurType(e.target.value);
              }
            }}
            className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-sm font-bold text-slate-300 appearance-none outline-none focus:border-emerald-500"
          >
            {availableFurs.map((f: string) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value="CUSTOM_ENTRY">+ Custom...</option>
          </select>
        )}
      </div>

      {/* Horn */}
      <div className="w-full space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Horn/Rack
        </label>

        {customHornMode ? (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={customHorn}
              onChange={(e) => setCustomHorn(e.target.value)}
              placeholder="Enter Custom Horn..."
              className="flex-1 bg-slate-900 border border-indigo-500 rounded-xl p-3 text-sm font-bold text-white outline-none"
            />
            <button
              onClick={() => setCustomHornMode(false)}
              className="px-4 bg-slate-800 rounded-xl text-slate-400 text-xs font-bold uppercase"
            >
              X
            </button>
          </div>
        ) : (
          <select
            value={hornType}
            onChange={(e) => {
              if (e.target.value === 'CUSTOM_ENTRY') {
                setCustomHornMode(true);
              } else {
                setHornType(e.target.value);
              }
            }}
            className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-sm font-bold text-slate-300 appearance-none outline-none focus:border-indigo-500"
          >
            {availableHorns.map((h: string) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
            <option value="CUSTOM_ENTRY">+ Custom...</option>
          </select>
        )}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3 pt-4">
        <div className="flex gap-2">
          <button
            onClick={triggerPhoto}
            className="flex-1 py-5 rounded-2xl bg-emerald-600 text-2xl font-bold text-white uppercase tracking-widest shadow-xl active:scale-95 transition-all border-b-4 border-emerald-800"
          >
            {state.hardcoreMode ? 'SAVE KILL' : 'PHOTO & SAVE'}
          </button>

          <button
            onClick={undoLast}
            className="px-6 py-5 rounded-2xl bg-slate-800 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center text-slate-500 hover:text-red-400 active:bg-red-950/20 transition-all border border-white/5"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickLog;
