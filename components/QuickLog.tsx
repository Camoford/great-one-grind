import React, { useState, useRef, useMemo } from 'react';
import { Medal } from '../types';
import { MEDAL_COLORS } from '../constants';

interface QuickLogProps {
  store: any;
}

const FALLBACK_FURS = [
  'Common',
  'Plains',
  'Dark',
  'Light',
  'Piebald',
  'Albino',
  'Melanistic',
  'Leucistic',
];

const FALLBACK_HORNS = ['Small', 'Medium', 'Large', 'Very Large', 'Custom'];

const QuickLog: React.FC<QuickLogProps> = ({ store }) => {
  const { state, logTrophy, undoLast } = store;
  const lastUsedSpecies = state.species.find((s: any) => s.lastUsed) || state.species[0];

  const [selectedSpeciesId, setSelectedSpeciesId] = useState(lastUsedSpecies?.id);
  const [selectedMedal, setSelectedMedal] = useState<Medal>(Medal.BRONZE);

  const [furType, setFurType] = useState('Common');
  const [hornType, setHornType] = useState('Medium');

  const [customFurMode, setCustomFurMode] = useState(false);
  const [customHornMode, setCustomHornMode] = useState(false);
  const [customFur, setCustomFur] = useState('');
  const [customHorn, setCustomHorn] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableFurs = useMemo(() => FALLBACK_FURS, []);
  const availableHorns = useMemo(() => FALLBACK_HORNS, []);

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
          className="w-full bg-[#1E293B] border border-white/10 rounded-xl p-4 text-lg font-bold text-white"
        >
          {state.species.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Medal
        </label>
        <div className="w-full grid grid-cols-5 gap-1.5">
          {[Medal.BRONZE, Medal.SILVER, Medal.GOLD, Medal.DIAMOND, Medal.FABLED].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMedal(m)}
              className={`py-3 rounded-lg text-[9px] font-bold uppercase border ${
                selectedMedal === m
                  ? `${MEDAL_COLORS[m]} border-white/40`
                  : 'bg-slate-800/50 border-white/5 text-slate-500'
              }`}
            >
              {m === Medal.FABLED ? 'G.O' : m.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Fur Type
        </label>
        <select
          value={furType}
          onChange={(e) => setFurType(e.target.value)}
          className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-sm font-bold text-slate-300"
        >
          {availableFurs.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
          Horn/Rack
        </label>
        <select
          value={hornType}
          onChange={(e) => setHornType(e.target.value)}
          className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-sm font-bold text-slate-300"
        >
          {availableHorns.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full flex flex-col gap-3 pt-4">
        <div className="flex gap-2">
          <button
            onClick={triggerPhoto}
            className="flex-1 py-5 rounded-2xl bg-emerald-600 text-2xl font-bold text-white uppercase tracking-widest"
          >
            {state.hardcoreMode ? 'SAVE KILL' : 'PHOTO & SAVE'}
          </button>

          <button
            onClick={undoLast}
            className="px-6 py-5 rounded-2xl bg-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickLog;

