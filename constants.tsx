
import { Species, Medal, ZoneType } from "./types";

/* ======================================================
   Reserves
   ====================================================== */
export interface Reserve {
  id: string;
  name: string;
  mapUrl: string;
  thumbnailUrl: string;
}

export const RESERVES: Reserve[] = [
  {
    id: "hirschfelden",
    name: "Hirschfelden Hunting Reserve",
    mapUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "layton",
    name: "Layton Lake District",
    mapUrl:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "medved",
    name: "Medved-Taiga National Park",
    mapUrl:
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "vurhonga",
    name: "Vurhonga Savanna",
    mapUrl:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "parque-fernando",
    name: "Parque Fernando",
    mapUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "yukon",
    name: "Yukon Valley",
    mapUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "cuatro-colinas",
    name: "Cuatro Colinas Game Reserve",
    mapUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "silver-ridge",
    name: "Silver Ridge Peaks",
    mapUrl:
      "https://images.unsplash.com/photo-1439337153520-7082a56a81f4?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1439337153520-7082a56a81f4?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "te-awaroa",
    name: "Te Awaroa National Park",
    mapUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "rancho-del-arroyo",
    name: "Rancho del Arroyo",
    mapUrl:
      "https://images.unsplash.com/photo-1464273539145-66236b32527f?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1464273539145-66236b32527f?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "mississippi",
    name: "Mississippi Acres Preserve",
    mapUrl:
      "https://images.unsplash.com/photo-1437332713235-fd61ccbc3677?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1437332713235-fd61ccbc3677?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "revontuli",
    name: "Revontuli Coast",
    mapUrl:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "new-england",
    name: "New England Mountains",
    mapUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "emerald-coast",
    name: "Emerald Coast",
    mapUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "sundarpatan",
    name: "Sundarpatan",
    mapUrl:
      "https://images.unsplash.com/photo-1454496522485-0a924d6049ec?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1454496522485-0a924d6049ec?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "salzwiesen",
    name: "Salzwiesen Park",
    mapUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "askiy-ridge",
    name: "Askiy Ridge Hunting Preserve",
    mapUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=20&w=200",
  },
  {
    id: "torr-nan-sithean",
    name: "Tòrr nan Sithean",
    mapUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=20&w=200",
  },
];

/* ======================================================
   Initial Species
   ====================================================== */
export const INITIAL_SPECIES: Species[] = [
  { id: "1", name: "Whitetail Deer", defaultMap: "layton", lastUsed: true },
  { id: "2", name: "Red Deer", defaultMap: "te-awaroa", lastUsed: false },
  { id: "3", name: "Fallow Deer", defaultMap: "salzwiesen", lastUsed: false },
  { id: "4", name: "Moose", defaultMap: "medved", lastUsed: false },
  { id: "5", name: "Black Bear", defaultMap: "layton", lastUsed: false },
  { id: "6", name: "Mule Deer", defaultMap: "plains", lastUsed: false },
  { id: "7", name: "Gray Wolf", defaultMap: "askiy-ridge", lastUsed: false },
  { id: "8", name: "Wild Boar", defaultMap: "cuatro-colinas", lastUsed: false },
  { id: "9", name: "Red Fox", defaultMap: "torr-nan-sithean", lastUsed: false },
  { id: "10", name: "Ring-necked Pheasant", defaultMap: "mississippi", lastUsed: false },
];

/* ======================================================
   Pin Colors & Icons (unchanged)
   ====================================================== */
export const PIN_COLORS: Record<ZoneType, string> = {
  [ZoneType.DRINK]: "bg-blue-500",
  [ZoneType.FEED]: "bg-emerald-500",
  [ZoneType.REST]: "bg-indigo-500",
  [ZoneType.WATCH]: "bg-amber-500",
  [ZoneType.OUTPOST]: "bg-white",
  [ZoneType.LOOKOUT]: "bg-slate-200",
  [ZoneType.TENT]: "bg-white",
  [ZoneType.POI]: "bg-orange-500",
  [ZoneType.RARE_ANIMAL]: "bg-red-600",
  [ZoneType.FARMING]: "bg-green-600",
  [ZoneType.TROPHY_ITEM]: "bg-yellow-600",
  [ZoneType.GRIND_ZONE]: "bg-red-600",
  [ZoneType.HIGH_TRAFFIC]: "bg-yellow-500",
};
