import React, { useEffect, useRef, useState, useCallback } from "react";
import Card from "./components/Card";
import SearchFilterSort from "./components/Filter";
import { DETAILS_URL, SPECIES_URL } from "./utils/constants";

// Configuration constants
const LIMIT = 10; // Number of Pokemon to load in each batch
const MAX_POKEMON = 1025; // Maximum number of Pokemon in the database

function App() {
  // Main state variables
  const [allPokemon, setAllPokemon] = useState([]); // Stores all fetched Pokemon data
  const [displayPokemon, setDisplayPokemon] = useState([]); // Pokemon currently displayed
  const [offset, setOffset] = useState(0); // Pagination offset for forward loading
  const [loading, setLoading] = useState(false); // General loading state
  const [searchLoading, setSearchLoading] = useState(false); // Loading state for search operations
  const [selectedPokemonId, setSelectedPokemonId] = useState(null); // Currently selected Pokemon
  const [filterParams, setFilterParams] = useState({
    searchTerm: "",
    types: [],
    generations: [],
    games: [],
    sort: { field: "id", direction: "asc" }, // Default sorting by ID ascending
  });
  const [isFilterMode, setIsFilterMode] = useState(false); // Whether filter/search is active
  const [descOffset, setDescOffset] = useState(MAX_POKEMON); // Offset for reverse loading (descending order)
  const [visiblePokemonCount, setVisiblePokemonCount] = useState(LIMIT); // Number of Pokemon visible in name sort
  const [nameDataLoading, setNameDataLoading] = useState(false); // Loading state for name sort data
  const [searchError, setSearchError] = useState(null); // Error message for search operations

  // Ref for intersection observer (infinite scrolling)
  const observer = useRef();

  // Callback for infinite scroll functionality
  const lastPokemonRef = useCallback(
    (node) => {
      // Don't observe if loading or in filter mode
      if (loading || isFilterMode) return;

      // Disconnect previous observer if exists
      if (observer.current) observer.current.disconnect();

      // Create new intersection observer
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          // When last element is visible, load more based on current sort
          if (filterParams.sort.field === "id") {
            if (filterParams.sort.direction === "asc") {
              // Forward pagination - increment offset
              if (offset < MAX_POKEMON) {
                setOffset((prev) => prev + LIMIT);
              }
            } else {
              // Reverse pagination - decrement offset
              if (descOffset > LIMIT) {
                setDescOffset((prev) => Math.max(prev - LIMIT, 1));
              }
            }
          } else {
            // For name sort, just show more of already loaded Pokemon
            setVisiblePokemonCount((prev) =>
              Math.min(prev + LIMIT, allPokemon.length)
            );
          }
        }
      });

      // Observe the last element
      if (node) observer.current.observe(node);
    },
    [
      loading,
      offset,
      descOffset,
      filterParams.sort,
      isFilterMode,
      allPokemon.length,
    ]
  );

  // Effect for loading Pokemon in batches (for ID sort)
  useEffect(() => {
    // Skip if filter mode is active or sort field isn't id
    if (isFilterMode || filterParams.sort.field !== "id") return;

    const fetchPokemon = async () => {
      setLoading(true);
      try {
        let fetchOffset;
        let fetchLimit = LIMIT;

        // Calculate offset based on sort direction
        if (filterParams.sort.direction === "asc") {
          fetchOffset = offset;
        } else {
          // For descending, calculate offset from end
          fetchOffset = Math.max(descOffset - LIMIT, 0);
          if (fetchOffset === 0) {
            fetchLimit = descOffset; // Adjust limit for last batch
          }
        }

        // Fetch batch of Pokemon
        const res = await fetch(
          `${DETAILS_URL}?limit=${fetchLimit}&offset=${fetchOffset}`
        );
        const data = await res.json();

        // Fetch detailed data for each Pokemon
        const pokemonWithData = await Promise.all(
          data.results.map(async (pokemon) => {
            const pokemonId = pokemon.url.split("/").filter(Boolean).pop();
            // Get Pokemon details
            const detailRes = await fetch(`${DETAILS_URL}/${pokemonId}`);
            const pokemonDetails = await detailRes.json();

            // Get species data for generation info
            const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
            const speciesData = await speciesRes.json();

            // Return combined data
            return {
              ...pokemon,
              id: parseInt(pokemonId),
              types: pokemonDetails.types.map((t) => t.type.name),
              generation: parseInt(
                speciesData.generation.url.split("/").filter(Boolean).pop()
              ),
              games: pokemonDetails.game_indices.map((g) => g.version.name),
            };
          })
        );

        // Update state with new Pokemon, avoiding duplicates
        setAllPokemon((prev) => {
          const newPokemon = pokemonWithData.filter(
            (newPoke) =>
              !prev.some((existingPoke) => existingPoke.id === newPoke.id)
          );

          const combinedPokemon = [...prev, ...newPokemon];
          return combinedPokemon;
        });
      } catch (err) {
        console.error("Failed to fetch Pokémon:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [offset, descOffset, filterParams.sort, isFilterMode]);

  // Effect to load all Pokemon when switching to name sort
  useEffect(() => {
    if (isFilterMode) return;

    // When switching to name sort, fetch all Pokemon if not already loaded
    if (filterParams.sort.field === "name" && allPokemon.length < MAX_POKEMON) {
      fetchAllPokemonForNameSorting();
    }
  }, [filterParams.sort.field, isFilterMode]);

  // Effect to sort displayed Pokemon when sort parameters change
  useEffect(() => {
    if (!isFilterMode) {
      // Sort the Pokemon based on current sort parameters
      const sortedPokemon = [...allPokemon].sort((a, b) => {
        const direction = filterParams.sort.direction === "asc" ? 1 : -1;
        if (filterParams.sort.field === "id") {
          return (a.id - b.id) * direction;
        } else if (filterParams.sort.field === "name") {
          return a.name.localeCompare(b.name) * direction;
        }
        return 0;
      });

      // For name sort, only show a limited number (for performance)
      if (filterParams.sort.field === "name") {
        setDisplayPokemon(sortedPokemon.slice(0, visiblePokemonCount));
      } else {
        setDisplayPokemon(sortedPokemon);
      }
    }
  }, [allPokemon, filterParams.sort, isFilterMode, visiblePokemonCount]);

  // Initial data load on component mount
  useEffect(() => {
    if (allPokemon.length === 0 && offset === 0) {
      if (filterParams.sort.direction === "asc") {
        fetchInitialPokemon(0); // First batch from start
      } else {
        fetchInitialPokemon(MAX_POKEMON - LIMIT); // First batch from end
      }
    }
  }, []);

  // Function to fetch all Pokemon for name sorting
  const fetchAllPokemonForNameSorting = async () => {
    setNameDataLoading(true);
    try {
      // Skip if we already have most Pokemon
      if (allPokemon.length > MAX_POKEMON * 0.9) {
        setNameDataLoading(false);
        return;
      }

      // Fetch all Pokemon in batches of 100
      const totalBatches = Math.ceil(MAX_POKEMON / 100);
      let allFetchedPokemon = [...allPokemon];

      for (let i = 0; i < totalBatches; i++) {
        const offset = i * 100;
        const limit = Math.min(100, MAX_POKEMON - offset);

        const res = await fetch(
          `${DETAILS_URL}?limit=${limit}&offset=${offset}`
        );
        const data = await res.json();

        // Fetch details for each Pokemon in batch
        const pokemonBatch = await Promise.all(
          data.results.map(async (pokemon) => {
            const pokemonId = pokemon.url.split("/").filter(Boolean).pop();

            // Skip if already fetched
            if (allFetchedPokemon.some((p) => p.id === parseInt(pokemonId))) {
              return null;
            }

            try {
              // Get Pokemon details
              const detailRes = await fetch(`${DETAILS_URL}/${pokemonId}`);
              const pokemonDetails = await detailRes.json();

              // Get species data
              const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
              const speciesData = await speciesRes.json();

              // Return combined data
              return {
                ...pokemon,
                id: parseInt(pokemonId),
                types: pokemonDetails.types.map((t) => t.type.name),
                generation: parseInt(
                  speciesData.generation.url.split("/").filter(Boolean).pop()
                ),
                games: pokemonDetails.game_indices.map((g) => g.version.name),
              };
            } catch (err) {
              console.error(`Error fetching Pokémon #${pokemonId}:`, err);
              return null;
            }
          })
        );

        // Add valid results to collection
        const newPokemon = pokemonBatch.filter(Boolean);
        allFetchedPokemon = [...allFetchedPokemon, ...newPokemon];

        // Update state with batch results
        setAllPokemon(allFetchedPokemon);
      }
    } catch (err) {
      console.error("Failed to fetch all Pokémon for name sorting:", err);
    } finally {
      setNameDataLoading(false);
      setVisiblePokemonCount(LIMIT);
    }
  };

  // Function to fetch initial batch of Pokemon
  const fetchInitialPokemon = async (startOffset) => {
    setLoading(true);
    try {
      // Fetch initial batch
      const res = await fetch(
        `${DETAILS_URL}?limit=${LIMIT}&offset=${startOffset}`
      );
      const data = await res.json();

      // Get detailed data for each Pokemon
      const pokemonWithData = await Promise.all(
        data.results.map(async (pokemon) => {
          const pokemonId = pokemon.url.split("/").filter(Boolean).pop();
          const detailRes = await fetch(`${DETAILS_URL}/${pokemonId}`);
          const pokemonDetails = await detailRes.json();

          const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
          const speciesData = await speciesRes.json();

          return {
            ...pokemon,
            id: parseInt(pokemonId),
            types: pokemonDetails.types.map((t) => t.type.name),
            generation: parseInt(
              speciesData.generation.url.split("/").filter(Boolean).pop()
            ),
            games: pokemonDetails.game_indices.map((g) => g.version.name),
          };
        })
      );

      // Store results
      setAllPokemon(pokemonWithData);

      // Sort and display results
      const sortedPokemon = [...pokemonWithData].sort((a, b) => {
        const direction = filterParams.sort.direction === "asc" ? 1 : -1;
        if (filterParams.sort.field === "id") {
          return (a.id - b.id) * direction;
        } else if (filterParams.sort.field === "name") {
          return a.name.localeCompare(b.name) * direction;
        }
        return 0;
      });

      setDisplayPokemon(sortedPokemon);
    } catch (err) {
      console.error("Failed to fetch initial Pokémon:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to search for a specific Pokemon by name or ID
  const searchPokemonDirectly = async (searchTerm) => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const cleanedSearchTerm = searchTerm.toLowerCase().trim();

      // Direct API call for the specific Pokemon
      const response = await fetch(`${DETAILS_URL}/${cleanedSearchTerm}`);

      if (!response.ok) {
        // Pokemon not found
        setDisplayPokemon([]);
        setSearchError(`No Pokémon found with name or ID "${searchTerm}"`);
        setSearchLoading(false);
        return [];
      }

      // Get details for the found Pokemon
      const pokemonDetails = await response.json();
      const speciesRes = await fetch(`${SPECIES_URL}/${pokemonDetails.id}`);
      const speciesData = await speciesRes.json();

      // Format data
      const pokemonData = {
        name: pokemonDetails.name,
        url: `${DETAILS_URL}/${pokemonDetails.id}/`,
        id: pokemonDetails.id,
        types: pokemonDetails.types.map((t) => t.type.name),
        generation: parseInt(
          speciesData.generation.url.split("/").filter(Boolean).pop()
        ),
        games: pokemonDetails.game_indices.map((g) => g.version.name),
      };

      // Add to collection if not already there
      setAllPokemon((prev) => {
        if (!prev.some((p) => p.id === pokemonData.id)) {
          return [...prev, pokemonData];
        }
        return prev;
      });

      // Display only this Pokemon
      setDisplayPokemon([pokemonData]);
      return [pokemonData];
    } catch (err) {
      console.error("Failed to search Pokémon:", err);
      setDisplayPokemon([]);
      setSearchError(`No Pokémon found with name or ID "${searchTerm}"`);
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  // Function to fetch and filter all Pokemon based on filter criteria
  const fetchAllFilteredPokemon = async (filters) => {
    setSearchLoading(true);
    setSearchError(null);

    // If only search term is provided, use direct search
    if (
      filters.searchTerm &&
      filters.types.length === 0 &&
      filters.generations.length === 0 &&
      filters.games.length === 0
    ) {
      return await searchPokemonDirectly(filters.searchTerm);
    }

    try {
      // Get list of all Pokemon
      const allRes = await fetch(`${DETAILS_URL}?limit=${MAX_POKEMON}`);
      const allData = await allRes.json();

      let pokemonList = [...allData.results];

      // Process in batches for performance
      const batchSize = 10;
      const filteredPokemon = [];

      for (let i = 0; i < pokemonList.length; i += batchSize) {
        const batch = pokemonList.slice(i, i + batchSize);

        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (pokemon) => {
            const pokemonId = pokemon.url.split("/").filter(Boolean).pop();

            try {
              // Get Pokemon details
              const detailRes = await fetch(`${DETAILS_URL}/${pokemonId}`);
              const pokemonDetails = await detailRes.json();

              // Get species data
              const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
              const speciesData = await speciesRes.json();

              // Format data
              const pokemonData = {
                ...pokemon,
                id: parseInt(pokemonId),
                types: pokemonDetails.types.map((t) => t.type.name),
                generation: parseInt(
                  speciesData.generation.url.split("/").filter(Boolean).pop()
                ),
                games: pokemonDetails.game_indices.map((g) => g.version.name),
              };

              let matches = true;

              // Apply search term filter
              if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const isNumeric = !isNaN(filters.searchTerm);

                if (
                  !(
                    pokemonData.name.toLowerCase().includes(searchLower) ||
                    (isNumeric &&
                      pokemonData.id === parseInt(filters.searchTerm))
                  )
                ) {
                  matches = false;
                }
              }

              // Apply type filter
              if (matches && filters.types.length > 0) {
                if (
                  !filters.types.some((type) =>
                    pokemonData.types.includes(type)
                  )
                ) {
                  matches = false;
                }
              }

              // Apply generation filter
              if (matches && filters.generations.length > 0) {
                if (!filters.generations.includes(pokemonData.generation)) {
                  matches = false;
                }
              }

              // Apply games filter
              if (matches && filters.games.length > 0) {
                if (
                  !filters.games.some((game) =>
                    pokemonData.games.includes(game)
                  )
                ) {
                  matches = false;
                }
              }

              return matches ? pokemonData : null;
            } catch (err) {
              console.error(`Error fetching Pokémon #${pokemonId}:`, err);
              return null;
            }
          })
        );

        // Add valid results to collection
        filteredPokemon.push(...batchResults.filter(Boolean));

        // Update display periodically during processing
        if (i % (batchSize * 5) === 0 || i + batchSize >= pokemonList.length) {
          const sortedPokemon = [...filteredPokemon].sort((a, b) => {
            const direction = filters.sort.direction === "asc" ? 1 : -1;
            if (filters.sort.field === "id") {
              return (a.id - b.id) * direction;
            } else if (filters.sort.field === "name") {
              return a.name.localeCompare(b.name) * direction;
            }
            return 0;
          });

          setDisplayPokemon(sortedPokemon);
        }
      }

      // Final sort of all results
      const sortedPokemon = [...filteredPokemon].sort((a, b) => {
        const direction = filters.sort.direction === "asc" ? 1 : -1;
        if (filters.sort.field === "id") {
          return (a.id - b.id) * direction;
        } else if (filters.sort.field === "name") {
          return a.name.localeCompare(b.name) * direction;
        }
        return 0;
      });

      // Set error message if no results
      if (sortedPokemon.length === 0) {
        setSearchError("No Pokemon found matching your filters");
      }

      setDisplayPokemon(sortedPokemon);
      return sortedPokemon;
    } catch (err) {
      console.error("Failed to fetch filtered Pokemon:", err);
      setSearchError("Error fetching Pokemon data");
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle filter changes from the filter component
  const handleFilterChange = (newFilters) => {
    // Check if this is a reset to default
    const isReset =
      !newFilters.searchTerm &&
      newFilters.types.length === 0 &&
      newFilters.generations.length === 0 &&
      newFilters.games.length === 0 &&
      newFilters.sort.field === "id" &&
      newFilters.sort.direction === "asc";

    // Check if sort field changed
    const isSortFieldChange = filterParams.sort.field !== newFilters.sort.field;

    // Check if sort direction changed
    const isSortDirectionChange =
      filterParams.sort.direction !== newFilters.sort.direction && !isReset;

    // Handle reset - go back to initial state
    if (isReset) {
      setFilterParams(newFilters);
      setIsFilterMode(false);
      setOffset(0);
      setDescOffset(MAX_POKEMON);
      setAllPokemon([]);
      setVisiblePokemonCount(LIMIT);
      setSearchError(null);
      fetchInitialPokemon(0);
      return;
    }

    // Update filter parameters
    setFilterParams(newFilters);

    // Reset visible count if sort changes
    if (isSortFieldChange || isSortDirectionChange) {
      setVisiblePokemonCount(LIMIT);
    }

    // Handle sort direction change for ID sort
    if (
      isSortDirectionChange &&
      !isFilterMode &&
      newFilters.sort.field === "id"
    ) {
      setAllPokemon([]);
      if (newFilters.sort.direction === "asc") {
        setOffset(0);
        fetchInitialPokemon(0);
      } else {
        setDescOffset(MAX_POKEMON);
        fetchInitialPokemon(MAX_POKEMON - LIMIT);
      }
    }

    // Check if any filter is active
    const isAnyFilterActive =
      newFilters.searchTerm ||
      newFilters.types.length > 0 ||
      newFilters.generations.length > 0 ||
      newFilters.games.length > 0;

    // Handle filter mode changes
    if (isAnyFilterActive) {
      // Enter filter mode
      setIsFilterMode(true);
      fetchAllFilteredPokemon(newFilters);
    } else if (!(isSortDirectionChange && newFilters.sort.field === "id")) {
      // Exit filter mode
      setIsFilterMode(false);
      setSearchError(null);

      // Load more data for name sort if needed
      if (
        newFilters.sort.field === "name" &&
        allPokemon.length < MAX_POKEMON / 2
      ) {
        fetchAllPokemonForNameSorting();
      } else {
        // Just resort existing data
        const sortedPokemon = [...allPokemon].sort((a, b) => {
          const direction = newFilters.sort.direction === "asc" ? 1 : -1;
          if (newFilters.sort.field === "id") {
            return (a.id - b.id) * direction;
          } else if (newFilters.sort.field === "name") {
            return a.name.localeCompare(b.name) * direction;
          }
          return 0;
        });

        // Update display based on sort field
        if (newFilters.sort.field === "name") {
          setDisplayPokemon(sortedPokemon.slice(0, visiblePokemonCount));
        } else {
          setDisplayPokemon(sortedPokemon);
        }
      }
    }
  };

  // Handle navigation to a specific Pokemon
  const handleNavigate = async (id) => {
    if (id < 1) return;

    try {
      // Check if Pokemon already loaded
      const existingPokemon = allPokemon.find((p) => p.id === id);

      if (!existingPokemon) {
        // Fetch Pokemon if not already loaded
        const detailRes = await fetch(`${DETAILS_URL}/${id}`);
        const pokemonDetails = await detailRes.json();

        const speciesRes = await fetch(`${SPECIES_URL}/${id}`);
        const speciesData = await speciesRes.json();

        // Format data
        const newPokemon = {
          name: pokemonDetails.name,
          url: `${DETAILS_URL}/${id}/`,
          id: id,
          types: pokemonDetails.types.map((t) => t.type.name),
          generation: parseInt(
            speciesData.generation.url.split("/").filter(Boolean).pop()
          ),
          games: pokemonDetails.game_indices.map((g) => g.version.name),
        };

        // Add to collection
        setAllPokemon((prev) => {
          const updatedList = [...prev, newPokemon];
          return updatedList;
        });
      }

      // Select the Pokemon
      setSelectedPokemonId(id);

      // Scroll to the selected Pokemon
      setTimeout(() => {
        const element = document.getElementById(`pokemon-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } catch (err) {
      console.error(`Failed to fetch Pokémon #${id}:`, err);
    }
  };

  // Combined loading state
  const isAnyLoading = loading || searchLoading || nameDataLoading;

  return (
    <div className="App">
      {/* Background decorative element */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img
          src="../src/assets/pokeball.png"
          alt="Pokeball background"
          className="w-[50vw] opacity-20 animate-spin-slow"
        />
      </div>
      <div className="container mx-auto flex flex-col md:flex-row pt-4">
        {/* Sidebar with app title and filter controls */}
        <div className="mb-6 md:mb-0 md:pr-4 w-[34vw] md:pl-4">
          <div className="sticky top-0 space-y-4">
            <div className="flex items-center space-x-4 pl-2 pt-4">
              <img
                src="../src/assets/pokeball-colored.png"
                alt="Pokeball"
                className="w-20 h-20"
              />
              <h1 className="text-7xl font-bold">Pokédex</h1>
            </div>
            <div className="rounded-xl shadow-md w-full md:w-[30vw]">
              <SearchFilterSort onApplyFilters={handleFilterChange} />
            </div>
          </div>
        </div>

        {/* Main content area with Pokemon cards */}
        <div className="md:w-2/3 lg:w-3/4 pt-24">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-y-16 gap-x-8 w-[66vw]">
            {displayPokemon.map((pokemon, index) => {
              // Last card gets ref for infinite scrolling
              if (index === displayPokemon.length - 1 && !isFilterMode) {
                return (
                  <div
                    ref={lastPokemonRef}
                    key={`${pokemon.name}-${pokemon.id}`}
                    id={`pokemon-${pokemon.id}`}
                  >
                    <Card
                      name={pokemon.name}
                      url={`${DETAILS_URL}/${pokemon.id}/`}
                      onNavigate={handleNavigate}
                    />
                  </div>
                );
              }
              return (
                <div
                  key={`${pokemon.name}-${pokemon.id}`}
                  id={`pokemon-${pokemon.id}`}
                >
                  <Card
                    name={pokemon.name}
                    url={`${DETAILS_URL}/${pokemon.id}/`}
                    onNavigate={handleNavigate}
                  />
                </div>
              );
            })}
          </div>

          {/* No results message */}
          {displayPokemon.length === 0 && !isAnyLoading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">
                {searchError || "No Pokémon found matching your filters"}
              </p>
            </div>
          )}

          {/* Loading indicator */}
          {isAnyLoading && (
            <div className="flex justify-center items-centerh-32">
              <img
                src="../src/assets/pikachu-running.gif"
                alt="Loading..."
                className="w-72 h-51 z-10"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
