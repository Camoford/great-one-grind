
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

export interface Species {
  id: string;
  name: string;
  defaultMap: string;
  lastUsed: boolean;
}

export interface MedalBreakdown {
  bronze: number;
  silver: number;
  gold: number;
  diamond: number;
}

export interface MedalStats {
  speciesId: string;
  bronze: number;
  silver: number;
  gold: number;
  diamond: number;
  fabled: number;
  attemptsSinceLastDiamond: number;
  killsSinceLastRare: number;
  totalGrindKills: number; 
  currentGrindBreakdown: MedalBreakdown;
}

export interface Trophy {
  id: string;
  speciesId: string;
  medal: Medal;
  furType: string;
  hornType: string;
  killDate: number;
  mapId?: string;
  imageUrl?: string;
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  reserveId: string;
  x: number; 
  y: number;
}

export type MapTiles = {
  nw?: string;
  ne?: string;
  sw?: string;
  se?: string;
};

export interface AppState {
  species: Species[];
  medals: Record<string, MedalStats>;
  trophies: Trophy[];
  zones: Zone[];
  lastHistory: Trophy | null;
  customMapUrls: Record<string, string>; 
  customMapTiles: Record<string, MapTiles>; 
  hardcoreMode: boolean;
  activeReserveId: string;
  lastUpdated: number;
}
