
export interface Species {
  id: string;
  name: string;
  defaultMap: string;
  lastUsed: boolean;
}

export interface MedalStats {
  attemptsSinceLastDiamond: number;
  killsSinceLastRare: number;
  totalGrindKills: number;
  fabled: number;
  diamond: number;
  gold: number;
}

export interface Trophy {
  id: string;
  speciesId: string;
  medal: Medal;
  furType: string;
  hornType: string;
  imageUrl?: string;
}

export interface MapTiles {
  nw?: string;
  ne?: string;
  sw?: string;
  se?: string;
}

export interface GrindNoteZone {
  id: string;
  label: string;
  time: string;
  coords: string;
  active: boolean;
  notes: string;
  type: ZoneType;
}

export interface GrindNoteSession {
  id: string;
  date: string;
  killsAdded: number;
  notes: string;
}

export interface Session {
  sessionId: string;
  date: string; // YYYY-MM-DD
  kills: number;
  notes: string;
}

export interface Strategy {
  reservesUsed: string[];
  zonesFarmed: string;
  zonesSkipped: string;
  drinkTimes: string;
  lakeRotationOrder: string;
  changesBeforeGO: string;
  lessonsLearned: string;
  finalThoughts: string;
}

export interface Milestones {
  m500: boolean;
  m1000: boolean;
  m2500: boolean;
  personalBest: boolean;
  greatOneSpawned: boolean;
}

export interface GrindStats {
  totalKills: number;
  totalSessions: number;
  daysGrinding: number;
  averageKillsPerSession: number;
  averageKillsPerDay: number;
  longestDryStreakKills: number;
  personalBestSessionKills: number;
  intensityScore: number;
}

export interface Grind {
  grindId: string;
  speciesId: string; // References INITIAL_SPECIES
  active: boolean;
  obtained: boolean;
  createdAt: string; // YYYY-MM-DD
  obtainedAt: string | null; // YYYY-MM-DD
  reservePrimary: string;
  sessions: Session[];
  stats: GrindStats;
  strategy: Strategy;
  milestones: Milestones;
}

export interface AppState {
  grinds: Grind[];
  species: Species[];
  medals: Record<string, MedalStats>;
  trophies: Trophy[];
  grindNotes: Record<string, {
    defaultReserveId: string;
    zones: GrindNoteZone[];
    sessions: GrindNoteSession[];
  }>;
  greatOnes: Record<string, {
    obtained: boolean;
    kills: number;
    fursFound: string[];
  }>;
  hardcoreMode: boolean;
  comparisonEnabled: boolean;
  isPremium: boolean;
  lastUpdated: number;
  activeReserveId?: string;
  customMapTiles?: Record<string, MapTiles>;
}

// Keep existing Enums for compatibility in parts of UI if needed, 
// though the new model is the primary driver.
export enum Medal {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  DIAMOND = 'Diamond',
  FABLED = 'Great One'
}

export enum ZoneType {
  DRINK = 'Drink',
  FEED = 'Feed',
  REST = 'Rest',
  WATCH = 'Watch',
  OUTPOST = 'Outpost',
  LOOKOUT = 'Lookout',
  TENT = 'Tent',
  POI = 'POI',
  RARE_ANIMAL = 'Rare Animal',
  FARMING = 'Farming',
  TROPHY_ITEM = 'Trophy',
  GRIND_ZONE = 'Grind Zone',
  HIGH_TRAFFIC = 'High Traffic'
}
