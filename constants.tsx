
// Great One Grind - Default species + rare / fabled fur lists
// This file is the MASTER source for self-healing storage

export type Species = {
  id: string;
  name: string;
  fabledFurs: string[];
};

export const DEFAULT_SPECIES: Species[] = [
  {
    id: "whitetail_deer",
    name: "Whitetail Deer",
    fabledFurs: ["Fabled Brown", "Fabled Piebald", "Fabled Tan"],
  },
  {
    id: "moose",
    name: "Moose",
    fabledFurs: [
      "Fabled Ash",
      "Fabled Birch",
      "Fabled Oak",
      "Fabled Speckled",
      "Fabled Spruce",
      "Fabled Two Tone",
    ],
  },
  {
    id: "fallow_deer",
    name: "Fallow Deer",
    fabledFurs: ["Golden", "Hooded", "Painted", "Silver", "Spotted"],
  },
  {
    id: "black_bear",
    name: "Black Bear",
    fabledFurs: ["Chestnut", "Cream", "Glacier", "Spirit", "Spotted"],
  },
  {
    id: "wild_boar",
    name: "Wild Boar",
    fabledFurs: [
      "Fabled Ash",
      "Fabled Stitch",
      "Fabled Smolder",
      "Fabled Cinder",
      "Fabled Butterscotch",
    ],
  },
  {
    id: "red_deer",
    name: "Red Deer",
    fabledFurs: ["Fabled Spotted"],
  },
  {
    id: "tahr",
    name: "Tahr",
    fabledFurs: ["Fabled Birch", "Fabled Spruce"],
  },
  {
    id: "red_fox",
    name: "Red Fox",
    fabledFurs: ["Fire Fox"],
  },
  {
    id: "mule_deer",
    name: "Mule Deer",
    fabledFurs: [
      "Milky Way",
      "Dripple Drizzle",
      "Cobweb Enigma",
      "Dusky Drift",
      "Petal Puff",
      "Cinnamon Stripes",
    ],
  },
];
