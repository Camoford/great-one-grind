// constants.tsx
// Great One species + fur lists (official set used by the app)
// PLUS: exports used by other screens (DEFAULT_SPECIES, RESERVES, PIN_COLORS)

export type GreatOneSpeciesKey =
  | 'Whitetail Deer'
  | 'Black Bear'
  | 'Moose'
  | 'Red Deer'
  | 'Fallow Deer'
  | 'Wild Boar';

export const GREAT_ONE_SPECIES: { key: GreatOneSpeciesKey; furs: string[] }[] = [
  {
    key: 'Whitetail Deer',
    furs: [
      'Fabled Speckled',
      'Fabled Mocha',
      'Fabled Piebald',
      'Fabled Snow',
      'Fabled Smoky',
      'Fabled Fox',
      'Rare Albino',
      'Rare Melanistic',
      'Rare Piebald',
    ],
  },
  {
    key: 'Black Bear',
    furs: [
      'Fabled Cinnamon',
      'Fabled Dark',
      'Fabled Light',
      'Fabled Mixed',
      'Fabled Silver',
      'Fabled Spirit',
      'Rare Albino',
      'Rare Melanistic',
    ],
  },
  {
    key: 'Moose',
    furs: [
      'Fabled Birch',
      'Fabled Dusk',
      'Fabled Glacial',
      'Fabled Hazel',
      'Fabled Oak',
      'Fabled Spotted',
      'Rare Albino',
      'Rare Melanistic',
    ],
  },
  {
    key: 'Red Deer',
    furs: [
      'Fabled Dusky',
      'Fabled Grey',
      'Fabled Molten',
      'Fabled Oat',
      'Fabled Painted',
      'Fabled Shadow',
      'Rare Albino',
      'Rare Melanistic',
    ],
  },
  {
    key: 'Fallow Deer',
    furs: [
      'Fabled Exquisite',
      'Fabled Gilded',
      'Fabled Golden',
      'Fabled Hooded',
      'Fabled Shadow',
      'Fabled Snowdrop',
      'Rare Albino',
      'Rare Melanistic',
      'Rare Piebald',
    ],
  },
  {
    key: 'Wild Boar',
    furs: [
      'Fabled Bronze',
      'Fabled Chocolate',
      'Fabled Gold',
      'Fabled Pearl',
      'Fabled Ruby',
      'Fabled Shadow',
      'Rare Albino',
      'Rare Melanistic',
    ],
  },
];

// ✅ Store expects DEFAULT_SPECIES to exist.
// Use the "key" values above and keep this stable.
export const DEFAULT_SPECIES: GreatOneSpeciesKey[] = GREAT_ONE_SPECIES.map((s) => s.key);

// ---------------------------
// Map support exports (minimal)
// ---------------------------

export type Reserve = { id: string; name: string };

export const RESERVES: Reserve[] = [
  { id: 'layton', name: 'Layton Lake District' },
  { id: 'hirschfelden', name: 'Hirschfelden Hunting Reserve' },
  { id: 'medved', name: 'Medved-Taiga National Park' },
  { id: 'vurhonga', name: 'Vurhonga Savanna' },
  { id: 'parque', name: 'Parque Fernando' },
  { id: 'yukon', name: 'Yukon Valley' },
  { id: 'cuatro', name: 'Cuatro Colinas' },
  { id: 'silver', name: 'Silver Ridge Peaks' },
  { id: 'teawaroa', name: 'Te Awaroa' },
  { id: 'rancho', name: 'Rancho del Arroyo' },
  { id: 'mississippi', name: 'Mississippi Acres Preserve' },
  { id: 'revontuli', name: 'Revontuli Coast' },
  { id: 'newengland', name: 'New England Mountains' },
  { id: 'emerald', name: 'Emerald Coast' },
];

export const PIN_COLORS: string[] = [
  '#22c55e',
  '#3b82f6',
  '#f97316',
  '#a855f7',
  '#ef4444',
  '#eab308',
  '#14b8a6',
  '#64748b',
];

export const PIN_COLOR_OPTIONS = PIN_COLORS;
