
import { Species, Medal, ZoneType } from './types';

export interface Reserve {
  id: string;
  name: string;
  mapUrl: string;
  thumbnailUrl: string;
}

export const RESERVES: Reserve[] = [
  { id: 'layton', name: 'Layton Lake District', mapUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=20&w=200' },
  { id: 'hirschfelden', name: 'Hirschfelden Hunting Reserve', mapUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=20&w=200' },
  { id: 'medved', name: 'Medved-Taiga National Park', mapUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=20&w=200' },
  { id: 'te-awaroa', name: 'Te Awaroa National Park', mapUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=20&w=200' },
  { id: 'sundarpatan', name: 'Sundarpatan Nepal', mapUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=20&w=200' },
  { id: 'yukon', name: 'Yukon Valley', mapUrl: 'https://images.unsplash.com/photo-1505244158428-21d966e6097e?auto=format&fit=crop&q=80&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1505244158428-21d966e6097e?auto=format&fit=crop&q=20&w=200' },
];

export const INITIAL_SPECIES: Species[] = [
  { id: '1', name: 'Whitetail Deer', defaultMap: 'layton', lastUsed: true },
  { id: '2', name: 'Red Deer', defaultMap: 'te-awaroa', lastUsed: false },
  { id: '3', name: 'Black Bear', defaultMap: 'layton', lastUsed: false },
  { id: '4', name: 'Moose', defaultMap: 'medved', lastUsed: false },
  { id: '5', name: 'Fallow Deer', defaultMap: 'te-awaroa', lastUsed: false },
  { id: '6', name: 'Tahr', defaultMap: 'sundarpatan', lastUsed: false },
  { id: '7', name: 'Red Fox', defaultMap: 'hirschfelden', lastUsed: false },
  { id: '8', name: 'Ring-Necked Pheasant', defaultMap: 'hirschfelden', lastUsed: false },
  { id: '9', name: 'Mule Deer', defaultMap: 'yukon', lastUsed: false },
  { id: '10', name: 'Gray Wolf', defaultMap: 'yukon', lastUsed: false },
  { id: '11', name: 'Wild Boar', defaultMap: 'hirschfelden', lastUsed: false },
];

export const GREAT_ONE_FURS: Record<string, string[]> = {
  '1': ["Fabled Brown", "Fabled Tan", "Fabled Piebald"],
  '2': ["Fabled Spotted"],
  '3': ["Fabled Chestnut", "Fabled Glacier", "Fabled Spirit", "Fabled Spotted"],
  '4': ["Fabled Ash", "Fabled Birch", "Fabled Oak", "Fabled Spruce", "Fabled Speckled", "Fabled Two Tone"],
  '5': ["Fabled Golden", "Fabled Hooded", "Fabled Mocha", "Fabled Painted", "Fabled Silver"],
  '6': ["Fabled Variant"],
  '7': ["Fabled Blood Moon", "Fabled Candycane", "Fabled Cherry Blossom", "Fabled Licorice", "Fabled Midnight Poppy", "Fabled Mystic Snowdrop", "Fabled Peppermint", "Fabled Rosebud Frost", "Fabled Scarlet Nightshade"],
  '8': ["Fabled Citrine", "Fabled Emerald", "Fabled Garnet", "Fabled Morganite", "Fabled Obsidian", "Fabled Pearl", "Fabled Ruby", "Fabled Sapphire"],
  '9': ["Fabled Variant"],
  '10': ["Fabled Variant"],
  '11': ["Fabled Variant"],
};

export const DEFAULT_FURS = ['Common', 'Albino', 'Melanistic', 'Piebald', 'Mottle'];
export const DEFAULT_HORNS = ['Small', 'Medium', 'Large', 'Massive', 'Legacy'];

export const FUR_MAP: Record<string, string[]> = {
  '1': ['Brown', 'Dark Brown', 'Light Brown', 'Tan', 'Piebald', 'Albino', 'Melanistic'],
  '2': ['Brown', 'Light Brown', 'Dark Brown', 'Grey', 'Piebald', 'Albino', 'Melanistic', 'Fabled Spotted', 'Fabled Piebald'],
  '3': ['Black', 'Brown', 'Cinnamon', 'Blond', 'Spirit', 'Albino', 'Melanistic', 'Fabled Chestnut', 'Fabled Cream'],
  '4': ['Tan', 'Brown', 'Light Brown', 'Dark Brown', 'Mocha', 'Piebald', 'Melanistic', 'Albino', 'Fabled Birch', 'Fabled Oak', 'Fabled Spruce', 'Fabled Ashen'],
  '5': ['Spotted', 'Dark', 'Chocolate', 'White', 'Albino', 'Melanistic', 'Piebald', 'Fabled Painted', 'Fabled Spruce'],
  '6': ['Brown', 'Grey', 'White', 'Light Brown', 'Fabled White', 'Fabled Gold'],
  '7': ['Red', 'Orange', 'Cross', 'Silver', 'Albino', 'Melanistic', 'Piebald', 'Fabled Sun-kissed', 'Fabled Piebald'],
  '8': ['Common', 'Brown', 'Grey', 'Molting', 'Albino', 'Melanistic', 'Fabled Silver', 'Fabled Golden'],
  '9': ['Brown', 'Grey', 'Light Brown', 'Tan', 'Dilute', 'Albino', 'Melanistic', 'Piebald', 'Fabled Blonde', 'Fabled Piebald'],
  '10': ['Grey', 'Eggshell', 'Dark Grey', 'Albino', 'Melanistic', 'Fabled Winter', 'Fabled Midnight'],
  '11': ['Brown', 'Dark', 'Grey', 'Light Brown', 'Albino', 'Melanistic', 'Fabled Iron', 'Fabled Copper'],
};

export const HORN_MAP: Record<string, string[]> = {
  '1': ['Typical', 'Atypical', 'Small', 'Medium', 'Large', 'Great One'],
  '2': ['Pointed', 'Symmetrical', 'Wide', 'Massive', 'Great One'],
  '3': ['Broad', 'Massive', 'Great One'],
  '4': ['Paddles', 'Small Palms', 'Medium Palms', 'Wide Palms', 'Great One'],
  '5': ['Spade', 'Wide Spade', 'Massive Spade', 'Great One'],
  '6': ['Sickle', 'Short Sickle', 'Long Sickle', 'Great One'],
  '7': ['Slim', 'Standard', 'Great One'],
  '8': ['Standard Plumage', 'Great One Plumage'],
  '9': ['Typical', 'Atypical', 'Great One'],
  '10': ['Standard', 'Great One'],
  '11': ['Tusks', 'Curved Tusks', 'Great One'],
};

export const MEDAL_COLORS: Record<Medal, string> = {
  [Medal.BRONZE]: 'bg-[#C67E34] text-white',
  [Medal.SILVER]: 'bg-[#94A3B8] text-white',
  [Medal.GOLD]: 'bg-[#B08F57] text-white',
  [Medal.DIAMOND]: 'bg-[#D97706] text-white',
  [Medal.FABLED]: 'bg-[#991B1B] text-white',
};

export const ZONE_ICONS: Record<ZoneType, string> = {
  [ZoneType.DRINK]: '💧',
  [ZoneType.FEED]: '🍃',
  [ZoneType.REST]: '💤',
  [ZoneType.WATCH]: '🔭',
  [ZoneType.OUTPOST]: '🏠',
  [ZoneType.LOOKOUT]: '📡',
  [ZoneType.TENT]: '⛺',
  [ZoneType.POI]: '📍',
  [ZoneType.RARE_ANIMAL]: '💎',
  [ZoneType.FARMING]: '🚜',
  [ZoneType.TROPHY_ITEM]: '🏆',
  [ZoneType.GRIND_ZONE]: '🔥',
  [ZoneType.HIGH_TRAFFIC]: '🐾',
};

export const PIN_COLORS: Record<ZoneType, string> = {
  [ZoneType.DRINK]: 'bg-blue-500', 
  [ZoneType.FEED]: 'bg-emerald-500',  
  [ZoneType.REST]: 'bg-indigo-500',  
  [ZoneType.WATCH]: 'bg-amber-500',    
  [ZoneType.OUTPOST]: 'bg-white',  
  [ZoneType.LOOKOUT]: 'bg-slate-200',  
  [ZoneType.TENT]: 'bg-white',     
  [ZoneType.POI]: 'bg-orange-500',   
  [ZoneType.RARE_ANIMAL]: 'bg-red-600',
  [ZoneType.FARMING]: 'bg-green-600',
  [ZoneType.TROPHY_ITEM]: 'bg-yellow-600',
  [ZoneType.GRIND_ZONE]: 'bg-red-600',
  [ZoneType.HIGH_TRAFFIC]: 'bg-yellow-500',
};
