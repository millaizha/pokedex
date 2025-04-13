import React, { useState, useEffect } from "react";

const TYPE_COLORS = {
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

const POKEMON_TYPES = [
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

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const GAMES = [
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

function SearchFilterSort({ onApplyFilters }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedGenerations, setSelectedGenerations] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  const [filtersChanged, setFiltersChanged] = useState(false);

  const handleApplyFilters = () => {
    const filters = {
      searchTerm,
      types: selectedTypes,
      generations: selectedGenerations,
      games: selectedGames,
      sort: { field: sortField, direction: sortDirection },
    };

    onApplyFilters(filters);
    setFiltersChanged(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setFiltersChanged(true);
  };

  const toggleSelection = (array, item, setter) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];

    setter(newArray);
    setFiltersChanged(true);
  };

  const handleTypeSelect = (type) => {
    toggleSelection(selectedTypes, type, setSelectedTypes);
  };

  const handleGenerationSelect = (gen) => {
    toggleSelection(selectedGenerations, gen, setSelectedGenerations);
  };

  const handleGameSelect = (game) => {
    toggleSelection(selectedGames, game, setSelectedGames);
  };

  const handleSortChange = (e) => {
    setSortField(e.target.value);
    setFiltersChanged(true);
  };

  const handleDirectionChange = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    setFiltersChanged(true);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      searchTerm: "",
      types: [],
      generations: [],
      games: [],
      sort: { field: "id", direction: "asc" },
    };

    setSearchTerm("");
    setSelectedTypes([]);
    setSelectedGenerations([]);
    setSelectedGames([]);
    setSortField("id");
    setSortDirection("asc");
    setFiltersChanged(false);

    onApplyFilters(resetFilters);
  };

  return (
    <div className="bg-[#EDF2F1] rounded-lg shadow-md p-4 ">
      <h2 className="text-3xl font-semibold mb-4">Search & Filter</h2>

      <div className="mb-4">
        <label
          htmlFor="search"
          className="block text-xl font-medium text-gray-700 mb-1"
        >
          Search by Name or ID
        </label>
        <input
          type="text"
          id="search"
          className="w-full p-2 border border-gray-300 rounded-md bg-white text-xl"
          placeholder="Enter Pokémon name or ID"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-medium text-gray-700 mb-1">
          Filter by Type
        </h3>
        <div className="flex flex-wrap gap-2">
          {POKEMON_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`px-4 py-2 text-lg rounded-full ${
                selectedTypes.includes(type)
                  ? `${TYPE_COLORS[type]} text-white`
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-medium text-gray-700 mb-1">
          Filter by Generation
        </h3>
        <div className="flex flex-wrap gap-2">
          {GENERATIONS.map((gen) => (
            <button
              key={gen}
              onClick={() => handleGenerationSelect(gen)}
              className={`px-4 py-2 text-lg rounded-full ${
                selectedGenerations.includes(gen)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Gen {gen}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-medium text-gray-700 mb-1">
          Filter by Game
        </h3>
        <select
          className="w-full p-2 border border-gray-300 rounded-md bg-white text-lg"
          onChange={(e) => {
            if (e.target.value) handleGameSelect(e.target.value);
            e.target.value = "";
          }}
          value=""
        >
          <option value="">Select a game</option>
          {GAMES.map((game) => (
            <option key={game} value={game}>
              {game.replace(/-/g, " ")}
            </option>
          ))}
        </select>

        {selectedGames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedGames.map((game) => (
              <div
                key={game}
                onClick={() => handleGameSelect(game)}
                className=" bg-blue-500 hover:bg-red-500 text-white px-4 py-1 text-lg rounded-full flex items-center transition duration-300 ease-in-out cursor-pointer"
              >
                {game.replace(/-/g, " ")}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-1">Sort By</h3>
        <div className="flex items-center">
          <select
            className="p-2 border border-gray-300 rounded-md bg-white text-lg"
            value={sortField}
            onChange={handleSortChange}
          >
            <option value="id">ID Number</option>
            <option value="name">Name</option>
          </select>

          <button
            onClick={handleDirectionChange}
            className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-md w-12"
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <button
          onClick={handleApplyFilters}
          className={`w-full p-2 rounded-md text-white font-medium 
            ${
              filtersChanged ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-400"
            }`}
          disabled={!filtersChanged}
        >
          Apply Filters
        </button>

        <button
          onClick={handleResetFilters}
          className="w-full p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 font-medium"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
}

export default SearchFilterSort;
