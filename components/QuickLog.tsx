import React, { useMemo, useState } from "react";
import { useHunterStore } from "../store";

/**
 * Quick Log v5 (Grinder-first)
 * - Species dropdown prioritizes ONLY Great One grind species
 * - Still allows Custom...
 * - Fur dropdown is clean (no placeholders) + includes Great One fabled options
 */

const GREAT_ONE_SPECIES = [
  "Whitetail Deer",
  "Moose",
  "Fallow Deer",
  "Black Bear",
  "Wild Boar",
  "Red Deer",
  "Tahr",
  "Red Fox",
  "Mule Deer",
];

const FUR_COMMON = ["Normal"];

const FUR_RARE_GENERIC = [
  "Albino",
  "Melanistic",
  "Leucistic",
  "Piebald",
  "Dilute",
];

const FUR_RARE_NAMED = [
  "Dusky",
  "Spirit",
  "Blonde",
  "Silver",
  "Crested",
  "Mocha",
  "Two Tone",
  "Spotted",
  "Painted",
  "Hooded",
  "Golden",
  "Chestnut",
  "Glacier",
];

const FUR_GREAT_ONE_FABLED = [
  // Great One (Black Bear)
  "Fabled Chestnut",
  "Fabled Glacier",
  "Fabled Spirit",
  "Fabled Spotted",

  // Great One (Moose)
  "Fabled Ash",
  "Fabled Birch",
  "Fabled Oak",
  "Fabled Speckled",
  "Fabled Spruce",
  "Fabled Two Tone",

  // Great One (Whitetail)
  "Fabled Brown",
  "Fabled Piebald",
  "Fabled Tan",
];

const DEFAULT_HORNS = [
  "None",
  "Small Rack",
  "Medium Rack",
  "Large Rack",
  "Typical",
  "Non-Typical",
  "Legendary",
];

const DEFAULT_MAPS = [
  "Layton Lake",
  "Hirschfelden",
  "Medved-Taiga",
  "Vurhonga Savannah",
  "Parque Fernando",
  "Yukon Valley",
  "Cuatro Colinas",
  "Silver Ridge Peaks",
  "Te Awaroa",
  "Rancho del Arroyo",
  "Mississippi Acres",
  "Revontuli Coast",
  "New England Mountains",
  "Emerald Coast",
  "Sundarpatan",
  "Unknown",
];

function SelectRow(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  customValue: string;
  onCustomChange: (v: string) => void;
  placeholder?: string;
}) {
  const {
    label,
    value,
    onChange,
    options,
    customValue,
    onCustomChange,
    placeholder,
  } = props;

  const isCustom = value === "__custom__";

  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-widest text-slate-400">
        {label}
      </div>

      <select
        className="w-full p-2 rounded bg-slate-800 border border-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {placeholder ?? "Select..."}
        </option>

        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}

        <option value="__custom__">Custom...</option>
      </select>

      {isCustom ? (
        <input
          className="w-full p-2 rounded bg-slate-800 border border-slate-700"
          placeholder={`Type custom ${label.toLowerCase()}...`}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}

function SpeciesSelectRow(props: {
  value: string;
  onChange: (v: string) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  optionsGreatOne: string[];
  optionsLearned: string[];
}) {
  const {
    value,
    onChange,
    customValue,
    onCustomChange,
    optionsGreatOne,
    optionsLearned,
  } = props;

  const isCustom = value === "__custom__";

  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-widest text-slate-400">
        Species
      </div>

      <select
        className="w-full p-2 rounded bg-slate-800 border border-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Select species...
        </option>

        <optgroup label="Great One Grinds">
          {optionsGreatOne.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </optgroup>

        {optionsLearned.length ? (
          <optgroup label="Recently Used">
            {optionsLearned.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </optgroup>
        ) : null}

        <option value="__custom__">Custom...</option>
      </select>

      {isCustom ? (
        <input
          className="w-full p-2 rounded bg-slate-800 border border-slate-700"
          placeholder="Type custom species..."
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}

function FurSelectRow(props: {
  value: string;
  onChange: (v: string) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
}) {
  const { value, onChange, customValue, onCustomChange } = props;
  const isCustom = value === "__custom__";

  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-widest text-slate-400">
        Fur
      </div>

      <select
        className="w-full p-2 rounded bg-slate-800 border border-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Select fur...
        </option>

        <optgroup label="Common">
          {FUR_COMMON.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </optgroup>

        <optgroup label="Rare (Generic)">
          {FUR_RARE_GENERIC.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </optgroup>

        <optgroup label="Rare (Named)">
          {FUR_RARE_NAMED.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </optgroup>

        <optgroup label="Great One (Fabled)">
          {FUR_GREAT_ONE_FABLED.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </optgroup>

        <option value="__custom__">Custom...</option>
      </select>

      {isCustom ? (
        <input
          className="w-full p-2 rounded bg-slate-800 border border-slate-700"
          placeholder="Type custom fur..."
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}

export default function QuickLog() {
  const addHarvest = useHunterStore((s) => s.addHarvest);
  const incrementGrind = useHunterStore((s) => s.incrementGrind);
  const grinds = useHunterStore((s) => s.grinds);

  const recentSpecies = useMemo(() => {
    const fromGrinds = (grinds ?? [])
      .map((g) => g.species)
      .filter(Boolean);

    // Remove any that are already in Great One list
    const filtered = fromGrinds.filter(
      (s) => !GREAT_ONE_SPECIES.includes(s)
    );

    // Unique + sort
    return Array.from(new Set(filtered)).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [grinds]);

  const [species, setSpecies] = useState("");
  const [speciesCustom, setSpeciesCustom] = useState("");

  const [fur, setFur] = useState("Normal");
  const [furCustom, setFurCustom] = useState("");

  const [horn, setHorn] = useState("None");
  const [hornCustom, setHornCustom] = useState("");

  const [map, setMap] = useState("Unknown");
  const [mapCustom, setMapCustom] = useState("");

  const [isGreatOne, setIsGreatOne] = useState(false);

  function finalValue(selected: string, custom: string, fallback: string) {
    if (selected === "__custom__") {
      const trimmed = custom.trim();
      return trimmed.length ? trimmed : fallback;
    }
    const trimmed = selected.trim();
    return trimmed.length ? trimmed : fallback;
  }

  function handleSave() {
    const finalSpecies = finalValue(species, speciesCustom, "");
    if (!finalSpecies) {
      alert("Please select a species (or choose Custom... and type one).");
      return;
    }

    const finalFur = finalValue(fur, furCustom, "Normal");
    const finalHorn = finalValue(horn, hornCustom, "None");
    const finalMap = finalValue(map, mapCustom, "Unknown");

    const harvest = {
      id: crypto.randomUUID(),
      species: finalSpecies,
      fur: finalFur,
      horn: finalHorn,
      map: finalMap,
      date: new Date().toISOString(),
      isGreatOne,
    };

    addHarvest(harvest);
    incrementGrind(finalSpecies);

    // Fast reset after save
    setIsGreatOne(false);
    setFur("Normal");
    setHorn("None");
    setMap(finalMap);

    setSpeciesCustom("");
    setFurCustom("");
    setHornCustom("");
    setMapCustom("");

    alert("Logged!");
  }

  return (
    <div className="p-4 space-y-4 text-slate-100">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quick Log</h2>
        <div className="text-xs text-slate-400">
          Great One species are pinned at the top for grinding.
          Use{" "}
          <span className="text-slate-200 font-semibold">Custom...</span>{" "}
          if you need anything else.
        </div>
      </div>

      <SpeciesSelectRow
        value={species}
        onChange={setSpecies}
        customValue={speciesCustom}
        onCustomChange={setSpeciesCustom}
        optionsGreatOne={GREAT_ONE_SPECIES}
        optionsLearned={recentSpecies}
      />

      <FurSelectRow
        value={fur}
        onChange={setFur}
        customValue={furCustom}
        onCustomChange={setFurCustom}
      />

      <SelectRow
        label="Horn"
        value={horn}
        onChange={setHorn}
        options={DEFAULT_HORNS}
        customValue={hornCustom}
        onCustomChange={setHornCustom}
        placeholder="Select horn..."
      />

      <SelectRow
        label="Map"
        value={map}
        onChange={setMap}
        options={DEFAULT_MAPS}
        customValue={mapCustom}
        onCustomChange={setMapCustom}
        placeholder="Select map..."
      />

      <label className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          checked={isGreatOne}
          onChange={(e) => setIsGreatOne(e.target.checked)}
        />
        <span className="text-sm">Great One</span>
      </label>

      <button
        onClick={handleSave}
        className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold"
      >
        Save Harvest
      </button>
    </div>
  );
}
