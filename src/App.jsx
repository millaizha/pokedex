import React, { useEffect, useRef, useState, useCallback } from "react";
import Card from "./components/Card";
import SearchFilterSort from "./components/Filter";
import {
  DETAILS_URL,
  SPECIES_URL
} from "./utils/constants";

const LIMIT = 10;
const MAX_POKEMON = 1025;

function App() {
  const [allPokemon, setAllPokemon] = useState([]);
  const [displayPokemon, setDisplayPokemon] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPokemonId, setSelectedPokemonId] = useState(null);
  const [filterParams, setFilterParams] = useState({
    searchTerm: "",
    types: [],
    generations: [],
    games: [],
    sort: { field: "id", direction: "asc" },
  });
  const [isFilterMode, setIsFilterMode] = useState(false);
  const [descOffset, setDescOffset] = useState(MAX_POKEMON);
  const [visiblePokemonCount, setVisiblePokemonCount] = useState(LIMIT);
  const [nameDataLoading, setNameDataLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const observer = useRef();

  const lastPokemonRef = useCallback(
    (node) => {
      if (loading || isFilterMode) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (filterParams.sort.field === "id") {
            if (filterParams.sort.direction === "asc") {
              if (offset < MAX_POKEMON) {
                setOffset((prev) => prev + LIMIT);
              }
            } else {
              if (descOffset > LIMIT) {
                setDescOffset((prev) => Math.max(prev - LIMIT, 1));
              }
            }
          } else {
            setVisiblePokemonCount((prev) =>
              Math.min(prev + LIMIT, allPokemon.length)
            );
          }
        }
      });

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

  useEffect(() => {
    if (isFilterMode || filterParams.sort.field !== "id") return;

    const fetchPokemon = async () => {
      setLoading(true);
      try {
        let fetchOffset;
        let fetchLimit = LIMIT;

        if (filterParams.sort.direction === "asc") {
          fetchOffset = offset;
        } else {
          fetchOffset = Math.max(descOffset - LIMIT, 0);
          if (fetchOffset === 0) {
            fetchLimit = descOffset;
          }
        }

        const res = await fetch(
          `${DETAILS_URL}?limit=${fetchLimit}&offset=${fetchOffset}`
        );
        const data = await res.json();

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

  useEffect(() => {
    if (isFilterMode) return;

    if (filterParams.sort.field === "name" && allPokemon.length < MAX_POKEMON) {
      fetchAllPokemonForNameSorting();
    }
  }, [filterParams.sort.field, isFilterMode]);

  useEffect(() => {
    if (!isFilterMode) {
      const sortedPokemon = [...allPokemon].sort((a, b) => {
        const direction = filterParams.sort.direction === "asc" ? 1 : -1;
        if (filterParams.sort.field === "id") {
          return (a.id - b.id) * direction;
        } else if (filterParams.sort.field === "name") {
          return a.name.localeCompare(b.name) * direction;
        }
        return 0;
      });

      if (filterParams.sort.field === "name") {
        setDisplayPokemon(sortedPokemon.slice(0, visiblePokemonCount));
      } else {
        setDisplayPokemon(sortedPokemon);
      }
    }
  }, [allPokemon, filterParams.sort, isFilterMode, visiblePokemonCount]);

  useEffect(() => {
    if (allPokemon.length === 0 && offset === 0) {
      if (filterParams.sort.direction === "asc") {
        fetchInitialPokemon(0);
      } else {
        fetchInitialPokemon(MAX_POKEMON - LIMIT);
      }
    }
  }, []);

  const fetchAllPokemonForNameSorting = async () => {
    setNameDataLoading(true);
    try {
      if (allPokemon.length > MAX_POKEMON * 0.9) {
        setNameDataLoading(false);
        return;
      }

      const totalBatches = Math.ceil(MAX_POKEMON / 100);
      let allFetchedPokemon = [...allPokemon];

      for (let i = 0; i < totalBatches; i++) {
        const offset = i * 100;
        const limit = Math.min(100, MAX_POKEMON - offset);

        const res = await fetch(
          `${DETAILS_URL}?limit=${limit}&offset=${offset}`
        );
        const data = await res.json();

        const pokemonBatch = await Promise.all(
          data.results.map(async (pokemon) => {
            const pokemonId = pokemon.url.split("/").filter(Boolean).pop();

            if (allFetchedPokemon.some((p) => p.id === parseInt(pokemonId))) {
              return null;
            }

            try {
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
            } catch (err) {
              console.error(`Error fetching Pokémon #${pokemonId}:`, err);
              return null;
            }
          })
        );

        const newPokemon = pokemonBatch.filter(Boolean);
        allFetchedPokemon = [...allFetchedPokemon, ...newPokemon];

        setAllPokemon(allFetchedPokemon);
      }
    } catch (err) {
      console.error("Failed to fetch all Pokémon for name sorting:", err);
    } finally {
      setNameDataLoading(false);
      setVisiblePokemonCount(LIMIT);
    }
  };

  const fetchInitialPokemon = async (startOffset) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${DETAILS_URL}?limit=${LIMIT}&offset=${startOffset}`
      );
      const data = await res.json();

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

      setAllPokemon(pokemonWithData);

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

  const searchPokemonDirectly = async (searchTerm) => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const cleanedSearchTerm = searchTerm.toLowerCase().trim();

      const response = await fetch(`${DETAILS_URL}/${cleanedSearchTerm}`);

      if (!response.ok) {
        setDisplayPokemon([]);
        setSearchError(`No Pokémon found with name or ID "${searchTerm}"`);
        setSearchLoading(false);
        return [];
      }

      const pokemonDetails = await response.json();
      const speciesRes = await fetch(`${SPECIES_URL}/${pokemonDetails.id}`);
      const speciesData = await speciesRes.json();

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

      setAllPokemon((prev) => {
        if (!prev.some((p) => p.id === pokemonData.id)) {
          return [...prev, pokemonData];
        }
        return prev;
      });

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

  const fetchAllFilteredPokemon = async (filters) => {
    setSearchLoading(true);
    setSearchError(null);

    if (
      filters.searchTerm &&
      filters.types.length === 0 &&
      filters.generations.length === 0 &&
      filters.games.length === 0
    ) {
      return await searchPokemonDirectly(filters.searchTerm);
    }

    try {
      const allRes = await fetch(`${DETAILS_URL}?limit=${MAX_POKEMON}`);
      const allData = await allRes.json();

      let pokemonList = [...allData.results];

      const batchSize = 10;
      const filteredPokemon = [];

      for (let i = 0; i < pokemonList.length; i += batchSize) {
        const batch = pokemonList.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (pokemon) => {
            const pokemonId = pokemon.url.split("/").filter(Boolean).pop();

            try {
              const detailRes = await fetch(`${DETAILS_URL}/${pokemonId}`);
              const pokemonDetails = await detailRes.json();

              const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
              const speciesData = await speciesRes.json();

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

              if (matches && filters.types.length > 0) {
                if (
                  !filters.types.some((type) =>
                    pokemonData.types.includes(type)
                  )
                ) {
                  matches = false;
                }
              }

              if (matches && filters.generations.length > 0) {
                if (!filters.generations.includes(pokemonData.generation)) {
                  matches = false;
                }
              }

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

        filteredPokemon.push(...batchResults.filter(Boolean));

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

      const sortedPokemon = [...filteredPokemon].sort((a, b) => {
        const direction = filters.sort.direction === "asc" ? 1 : -1;
        if (filters.sort.field === "id") {
          return (a.id - b.id) * direction;
        } else if (filters.sort.field === "name") {
          return a.name.localeCompare(b.name) * direction;
        }
        return 0;
      });

      if (sortedPokemon.length === 0) {
        setSearchError("No Pokémon found matching your filters");
      }

      setDisplayPokemon(sortedPokemon);
      return sortedPokemon;
    } catch (err) {
      console.error("Failed to fetch filtered Pokémon:", err);
      setSearchError("Error fetching Pokémon data");
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    const isReset =
      !newFilters.searchTerm &&
      newFilters.types.length === 0 &&
      newFilters.generations.length === 0 &&
      newFilters.games.length === 0 &&
      newFilters.sort.field === "id" &&
      newFilters.sort.direction === "asc";

    const isSortFieldChange = filterParams.sort.field !== newFilters.sort.field;

    const isSortDirectionChange =
      filterParams.sort.direction !== newFilters.sort.direction && !isReset;

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

    setFilterParams(newFilters);

    if (isSortFieldChange || isSortDirectionChange) {
      setVisiblePokemonCount(LIMIT);
    }

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

    const isAnyFilterActive =
      newFilters.searchTerm ||
      newFilters.types.length > 0 ||
      newFilters.generations.length > 0 ||
      newFilters.games.length > 0;

    if (isAnyFilterActive) {
      setIsFilterMode(true);
      fetchAllFilteredPokemon(newFilters);
    } else if (!(isSortDirectionChange && newFilters.sort.field === "id")) {
      setIsFilterMode(false);
      setSearchError(null);

      if (
        newFilters.sort.field === "name" &&
        allPokemon.length < MAX_POKEMON / 2
      ) {
        fetchAllPokemonForNameSorting();
      } else {
        const sortedPokemon = [...allPokemon].sort((a, b) => {
          const direction = newFilters.sort.direction === "asc" ? 1 : -1;
          if (newFilters.sort.field === "id") {
            return (a.id - b.id) * direction;
          } else if (newFilters.sort.field === "name") {
            return a.name.localeCompare(b.name) * direction;
          }
          return 0;
        });

        if (newFilters.sort.field === "name") {
          setDisplayPokemon(sortedPokemon.slice(0, visiblePokemonCount));
        } else {
          setDisplayPokemon(sortedPokemon);
        }
      }
    }
  };

  const handleNavigate = async (id) => {
    if (id < 1) return;

    try {
      const existingPokemon = allPokemon.find((p) => p.id === id);

      if (!existingPokemon) {
        const detailRes = await fetch(`${DETAILS_URL}/${id}`);
        const pokemonDetails = await detailRes.json();

        const speciesRes = await fetch(`${SPECIES_URL}/${id}`);
        const speciesData = await speciesRes.json();

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

        setAllPokemon((prev) => {
          const updatedList = [...prev, newPokemon];
          return updatedList;
        });
      }

      setSelectedPokemonId(id);

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

  const isAnyLoading = loading || searchLoading || nameDataLoading;

  return (
    <div className="App">
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img
          src="src/assets/pokeball.png"
          alt="Pokeball background"
          className="w-[50vw] opacity-20 animate-spin-slow"
        />
      </div>
      <div className="container mx-auto flex flex-col md:flex-row pt-4">
        <div className="mb-6 md:mb-0 md:pr-4 w-[34vw] md:pl-4">
          <div className="sticky top-0 space-y-4">
            <div className="flex items-center space-x-4 pl-2 pt-4">
              <img
                src="src/assets/pokeball-colored.png"
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

        <div className="md:w-2/3 lg:w-3/4 pt-24">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-y-16 gap-x-8 w-[66vw]">
            {displayPokemon.map((pokemon, index) => {
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

          {displayPokemon.length === 0 && !isAnyLoading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">
                {searchError || "No Pokémon found matching your filters"}
              </p>
            </div>
          )}

          {isAnyLoading && (
            <div className="flex justify-center items-centerh-32">
              <img
                src="src/assets/pikachu-running.gif"
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
