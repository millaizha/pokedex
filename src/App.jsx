import React, { useEffect, useRef, useState, useCallback } from "react";
import Card from "./components/Card";
import SearchFilterSort from "./components/Filter";

const LIMIT = 20;
const DETAILS_URL = "https://pokeapi.co/api/v2/pokemon";
const SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species";
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

  // For infinite scrolling
  const observer = useRef();
  const isFilterActive =
    filterParams.searchTerm ||
    filterParams.types.length > 0 ||
    filterParams.generations.length > 0 ||
    filterParams.games.length > 0;

  const lastPokemonRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (filterParams.sort.direction === "desc" && !isFilterActive) {
            if (allPokemon.some((p) => p.id > 1)) {
              setOffset((prev) => prev + LIMIT);
            }
          } else {
            if (offset < MAX_POKEMON) {
              setOffset((prev) => prev + LIMIT);
            }
          }
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, offset, filterParams.sort.direction, isFilterActive, allPokemon]
  );

  useEffect(() => {
    const fetchPokemon = async () => {
      setLoading(true);
      try {
        let fetchOffset = offset;
        if (filterParams.sort.direction === "desc" && !isFilterActive) {
          fetchOffset = Math.max(0, MAX_POKEMON - offset - LIMIT);
        }

        const res = await fetch(
          `${DETAILS_URL}?limit=${LIMIT}&offset=${fetchOffset}`
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

          return [...prev, ...newPokemon];
        });
      } catch (err) {
        console.error("Failed to fetch Pokémon:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [offset, filterParams.sort.direction]);

  const searchSpecificPokemon = async (searchTerm) => {
    if (!searchTerm) return;

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const existingPokemon = allPokemon.find(
      (p) =>
        p.name.toLowerCase() === normalizedSearchTerm ||
        p.id === parseInt(searchTerm)
    );

    if (existingPokemon) return;

    setSearchLoading(true);
    try {
      const searchUrl = isNaN(searchTerm)
        ? `${DETAILS_URL}/${normalizedSearchTerm}`
        : `${DETAILS_URL}/${searchTerm}`;

      const detailRes = await fetch(searchUrl);
      if (!detailRes.ok) throw new Error("Pokemon not found");

      const pokemonDetails = await detailRes.json();
      const pokemonId = pokemonDetails.id;

      const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
      const speciesData = await speciesRes.json();

      const newPokemon = {
        name: pokemonDetails.name,
        url: `${DETAILS_URL}/${pokemonId}/`,
        id: pokemonId,
        types: pokemonDetails.types.map((t) => t.type.name),
        generation: parseInt(
          speciesData.generation.url.split("/").filter(Boolean).pop()
        ),
        games: pokemonDetails.game_indices.map((g) => g.version.name),
      };

      setAllPokemon((prev) => {
        const updatedList = [...prev, newPokemon].sort((a, b) => a.id - b.id);
        return updatedList;
      });
    } catch (err) {
      console.error(`Failed to find Pokémon "${searchTerm}":`, err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (filterParams.searchTerm) {
      searchSpecificPokemon(filterParams.searchTerm);
    }

    applyFilters(allPokemon, filterParams);
  }, [filterParams, allPokemon]);

  const handleFilterChange = (newFilters) => {
    setFilterParams(newFilters);
  };

  const applyFilters = (pokemonList, filters) => {
    if (!pokemonList.length) return;

    let filteredList = [...pokemonList];

    const isAnyFilterActive =
      filters.searchTerm ||
      filters.types.length > 0 ||
      filters.generations.length > 0 ||
      filters.games.length > 0;

    if (!isAnyFilterActive) {
      filteredList.sort((a, b) => {
        const direction = filters.sort.direction === "asc" ? 1 : -1;

        if (filters.sort.field === "id") {
          return (a.id - b.id) * direction;
        } else if (filters.sort.field === "name") {
          return a.name.localeCompare(b.name) * direction;
        }

        return 0;
      });

      setDisplayPokemon(filteredList);
      return;
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const isNumeric = !isNaN(filters.searchTerm);

      filteredList = filteredList.filter(
        (pokemon) =>
          pokemon.name.toLowerCase().includes(searchLower) ||
          (isNumeric && pokemon.id === parseInt(filters.searchTerm))
      );
    }

    if (filters.types.length > 0) {
      filteredList = filteredList.filter((pokemon) =>
        filters.types.some((type) => pokemon.types.includes(type))
      );
    }

    if (filters.generations.length > 0) {
      filteredList = filteredList.filter((pokemon) =>
        filters.generations.includes(pokemon.generation)
      );
    }

    if (filters.games.length > 0) {
      filteredList = filteredList.filter((pokemon) =>
        filters.games.some((game) => pokemon.games.includes(game))
      );
    }

    filteredList.sort((a, b) => {
      const direction = filters.sort.direction === "asc" ? 1 : -1;

      if (filters.sort.field === "id") {
        return (a.id - b.id) * direction;
      } else if (filters.sort.field === "name") {
        return a.name.localeCompare(b.name) * direction;
      }

      return 0;
    });

    if (
      filters.sort.direction === "desc" &&
      !isAnyFilterActive &&
      filteredList.length < 60
    ) {
      setOffset((prev) => prev + LIMIT);
    }

    setDisplayPokemon(filteredList);
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

  useEffect(() => {
    if (
      isFilterActive &&
      displayPokemon.length < 5 &&
      offset < MAX_POKEMON &&
      allPokemon.length < 100
    ) {
      setOffset((prev) => prev + LIMIT);
    }

    if (
      filterParams.sort.direction === "desc" &&
      allPokemon.length < 60 &&
      !isFilterActive
    ) {
      setOffset((prev) => prev + LIMIT);
    }
  }, [
    displayPokemon,
    isFilterActive,
    offset,
    allPokemon.length,
    filterParams.sort.direction,
  ]);

  return (
    <div className="App ">
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
              if (index === displayPokemon.length - 1) {
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

          {displayPokemon.length === 0 && !loading && !searchLoading && (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">
                No Pokémon found matching your filters
              </p>
            </div>
          )}

          {(loading || searchLoading) && (
            <div className="flex justify-center items-center h-32">
              <img
                src="src/assets/pikachu-running.gif"
                alt="Loading..."
                className="w-24 h-17"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
