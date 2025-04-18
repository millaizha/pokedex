import React, { useState, useEffect } from "react";
import {
  TYPE_COLORS,
  POKEMON_TYPES,
  GENERATIONS,
  GAMES,
} from "../utils/constants";

function SearchFilterSort({ onApplyFilters }) {
  // State variables for search, filter, and sort options
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedGenerations, setSelectedGenerations] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // Tracks if filters have changed since last apply
  const [filtersChanged, setFiltersChanged] = useState(false);

  // Collects all filter options and passes them to parent component
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

  // Updates search term and marks filters as changed
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setFiltersChanged(true);
  };

  // Generic function to toggle items in selection arrays
  const toggleSelection = (array, item, setter) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];

    setter(newArray);
    setFiltersChanged(true);
  };

  // Handles toggling Pokemon type selection
  const handleTypeSelect = (type) => {
    toggleSelection(selectedTypes, type, setSelectedTypes);
  };

  // Handles toggling generation selection
  const handleGenerationSelect = (gen) => {
    toggleSelection(selectedGenerations, gen, setSelectedGenerations);
  };

  // Handles toggling game selection
  const handleGameSelect = (game) => {
    toggleSelection(selectedGames, game, setSelectedGames);
  };

  // Updates sort field and marks filters as changed
  const handleSortChange = (e) => {
    setSortField(e.target.value);
    setFiltersChanged(true);
  };

  // Toggles sort direction between ascending and descending
  const handleDirectionChange = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    setFiltersChanged(true);
  };

  // Resets all filters to default values
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
      {/* Main filter panel heading */}
      <h2 className="text-3xl font-semibold mb-4">Search & Filter</h2>

      {/* Search input for Pokemon name or ID */}
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

      {/* Pokemon type filter buttons */}
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

      {/* Generation filter buttons */}
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

      {/* Game filter dropdown and selected games display */}
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

        {/* Display selected games as removable tags */}
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

      {/* Sort options with field dropdown and direction toggle */}
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

      {/* Action buttons for applying or resetting filters */}
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
