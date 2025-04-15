// Pokemon Type Colors
export const TYPE_COLORS = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  grass: "bg-green-500",
  electric: "bg-yellow-400",
  ice: "bg-blue-200",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-yellow-600",
  flying: "bg-sky-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-yellow-800",
  ghost: "bg-indigo-500",
  dragon: "bg-purple-700",
  dark: "bg-gray-700",
  steel: "bg-gray-500",
  fairy: "bg-pink-300",
};

// List of all Pokemon types
export const POKEMON_TYPES = [
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
];

// Pokemon Generation numbers
export const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Pokemon Game titles
export const GAMES = [
  "red",
  "blue",
  "yellow",
  "gold",
  "silver",
  "crystal",
  "ruby",
  "sapphire",
  "emerald",
  "firered",
  "leafgreen",
  "diamond",
  "pearl",
  "platinum",
  "heartgold",
  "soulsilver",
  "black",
  "white",
  "black-2",
  "white-2",
  "x",
  "y",
  "omega-ruby",
  "alpha-sapphire",
  "sun",
  "moon",
  "ultra-sun",
  "ultra-moon",
  "lets-go-pikachu",
  "lets-go-eevee",
  "sword",
  "shield",
  "brilliant-diamond",
  "shining-pearl",
  "legends-arceus",
  "scarlet",
  "violet",
];

// Type weaknesses lookup
export const TYPE_WEAKNESSES = {
  normal: ["fighting"],
  fire: ["water", "ground", "rock"],
  water: ["electric", "grass"],
  grass: ["fire", "ice", "poison", "flying", "bug"],
  electric: ["ground"],
  ice: ["fire", "fighting", "rock", "steel"],
  fighting: ["flying", "psychic", "fairy"],
  poison: ["ground", "psychic"],
  ground: ["water", "grass", "ice"],
  flying: ["electric", "ice", "rock"],
  psychic: ["bug", "ghost", "dark"],
  bug: ["fire", "flying", "rock"],
  rock: ["water", "grass", "fighting", "ground", "steel"],
  ghost: ["ghost", "dark"],
  dragon: ["ice", "dragon", "fairy"],
  dark: ["fighting", "bug", "fairy"],
  steel: ["fire", "fighting", "ground"],
  fairy: ["poison", "steel"],
};

// Pokemon colors for stat bars
export const POKEMON_COLORS = {
  black: "bg-gray-800",
  blue: "bg-blue-600",
  brown: "bg-amber-700",
  gray: "bg-gray-500",
  green: "bg-green-600",
  pink: "bg-pink-500",
  purple: "bg-purple-600",
  red: "bg-red-600",
  white: "bg-gray-300",
  yellow: "bg-yellow-500",
};

// API URLs
export const SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species";
export const IMAGE_URL =
  "https://assets.pokemon.com/assets/cms2/img/pokedex/full/";
export const DETAILS_URL = "https://pokeapi.co/api/v2/pokemon";
