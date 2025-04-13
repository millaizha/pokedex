import React, { useEffect, useRef, useState, useCallback } from 'react';
import Card from './components/Card';
import SearchFilterSort from './components/Filter';

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
        searchTerm: '',
        types: [],
        generations: [],
        games: [],
        sort: { field: 'id', direction: 'asc' }
    });
    
    // For infinite scrolling
    const observer = useRef();
    const isFilterActive = filterParams.searchTerm || 
                          filterParams.types.length > 0 || 
                          filterParams.generations.length > 0 || 
                          filterParams.games.length > 0;

                          const lastPokemonRef = useCallback(node => {
                            if (loading) return;
                            if (observer.current) observer.current.disconnect();
                        
                            observer.current = new IntersectionObserver(entries => {
                                if (entries[0].isIntersecting) {
                                    // For descending order without filters, we need to fetch from the end
                                    if (filterParams.sort.direction === 'desc' && !isFilterActive) {
                                        // Only load more if we haven't reached the beginning of the list
                                        if (allPokemon.some(p => p.id > 1)) {
                                            setOffset(prev => prev + LIMIT);
                                        }
                                    } else {
                                        // For ascending order, continue adding more as before
                                        if (offset < MAX_POKEMON) {
                                            setOffset(prev => prev + LIMIT);
                                        }
                                    }
                                }
                            });
                        
                            if (node) observer.current.observe(node);
                        }, [loading, offset, filterParams.sort.direction, isFilterActive, allPokemon]);

    // Initial fetch of Pokemon list on mount and when offset changes
    // Update the useEffect for fetching Pokemon to handle descending sort
useEffect(() => {
    const fetchPokemon = async () => {
        setLoading(true);
        try {
            // Adjust offset for descending sort
            let fetchOffset = offset;
            if (filterParams.sort.direction === 'desc' && !isFilterActive) {
                // For descending sort, fetch from the end and work backwards
                fetchOffset = Math.max(0, MAX_POKEMON - offset - LIMIT);
            }
            
            const res = await fetch(`${DETAILS_URL}?limit=${LIMIT}&offset=${fetchOffset}`);
            const data = await res.json();
            
            // Fetch additional data for each Pokemon
            const pokemonWithData = await Promise.all(
                data.results.map(async (pokemon) => {
                    const pokemonId = pokemon.url.split('/').filter(Boolean).pop();
                    // Fetch details like types
                    const detailRes = await fetch(`${DETAILS_URL}/${pokemonId}`);
                    const pokemonDetails = await detailRes.json();
                    
                    // Fetch species data for generation and games
                    const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
                    const speciesData = await speciesRes.json();
                    
                    return {
                        ...pokemon,
                        id: parseInt(pokemonId),
                        types: pokemonDetails.types.map(t => t.type.name),
                        generation: parseInt(speciesData.generation.url.split('/').filter(Boolean).pop()),
                        games: pokemonDetails.game_indices.map(g => g.version.name)
                    };
                })
            );
            
            // Filter out Pokemon that already exist in the list
            setAllPokemon(prev => {
                const newPokemon = pokemonWithData.filter(newPoke => 
                    !prev.some(existingPoke => existingPoke.id === newPoke.id)
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

    // Direct search for a specific Pokemon by name or ID
    const searchSpecificPokemon = async (searchTerm) => {
        if (!searchTerm) return;
        
        // Check if we already have this Pokemon in our list
        const normalizedSearchTerm = searchTerm.toLowerCase();
        const existingPokemon = allPokemon.find(p => 
            p.name.toLowerCase() === normalizedSearchTerm || 
            p.id === parseInt(searchTerm)
        );
        
        if (existingPokemon) return; // No need to fetch if we already have it
        
        setSearchLoading(true);
        try {
            // Try to find the Pokemon directly
            const searchUrl = isNaN(searchTerm) 
                ? `${DETAILS_URL}/${normalizedSearchTerm}`
                : `${DETAILS_URL}/${searchTerm}`;
                
            const detailRes = await fetch(searchUrl);
            if (!detailRes.ok) throw new Error('Pokemon not found');
            
            const pokemonDetails = await detailRes.json();
            const pokemonId = pokemonDetails.id;
            
            // Fetch species data
            const speciesRes = await fetch(`${SPECIES_URL}/${pokemonId}`);
            const speciesData = await speciesRes.json();
            
            // Create Pokemon object with all needed data
            const newPokemon = {
                name: pokemonDetails.name,
                url: `${DETAILS_URL}/${pokemonId}/`,
                id: pokemonId,
                types: pokemonDetails.types.map(t => t.type.name),
                generation: parseInt(speciesData.generation.url.split('/').filter(Boolean).pop()),
                games: pokemonDetails.game_indices.map(g => g.version.name)
            };
            
            // Add to our list
            setAllPokemon(prev => {
                const updatedList = [...prev, newPokemon].sort((a, b) => a.id - b.id);
                return updatedList;
            });
        } catch (err) {
            console.error(`Failed to find Pokémon "${searchTerm}":`, err);
        } finally {
            setSearchLoading(false);
        }
    };

    // Apply filters whenever filter parameters change
    useEffect(() => {
        // If there's a search term, try to find the specific Pokemon first
        if (filterParams.searchTerm) {
            searchSpecificPokemon(filterParams.searchTerm);
        }
        
        applyFilters(allPokemon, filterParams);
    }, [filterParams, allPokemon]);

    // Handle filter changes from the SearchFilterSort component
    const handleFilterChange = (newFilters) => {
        setFilterParams(newFilters);
    };

    // Apply filters to the Pokemon list
    const applyFilters = (pokemonList, filters) => {
        if (!pokemonList.length) return;
        
        let filteredList = [...pokemonList];
        
        // Check if any filters are active
        const isAnyFilterActive = filters.searchTerm || 
                                 filters.types.length > 0 || 
                                 filters.generations.length > 0 || 
                                 filters.games.length > 0;
        
        // If no filters are active, use the entire list
        if (!isAnyFilterActive) {
            // Just apply sorting to the whole list
            filteredList.sort((a, b) => {
                const direction = filters.sort.direction === 'asc' ? 1 : -1;
                
                if (filters.sort.field === 'id') {
                    return (a.id - b.id) * direction;
                } else if (filters.sort.field === 'name') {
                    return a.name.localeCompare(b.name) * direction;
                }
                
                return 0;
            });
            
            setDisplayPokemon(filteredList);
            return;
        }
        
        // Apply search filter (by name or ID)
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            const isNumeric = !isNaN(filters.searchTerm);
            
            filteredList = filteredList.filter(pokemon => 
                pokemon.name.toLowerCase().includes(searchLower) || 
                (isNumeric && pokemon.id === parseInt(filters.searchTerm))
            );
        }
        
        // Filter by types
        if (filters.types.length > 0) {
            filteredList = filteredList.filter(pokemon => 
                filters.types.some(type => pokemon.types.includes(type))
            );
        }
        
        // Filter by generations
        if (filters.generations.length > 0) {
            filteredList = filteredList.filter(pokemon => 
                filters.generations.includes(pokemon.generation)
            );
        }
        
        // Filter by games
        if (filters.games.length > 0) {
            filteredList = filteredList.filter(pokemon => 
                filters.games.some(game => pokemon.games.includes(game))
            );
        }
        
        // Sort the list
        filteredList.sort((a, b) => {
            const direction = filters.sort.direction === 'asc' ? 1 : -1;
            
            if (filters.sort.field === 'id') {
                return (a.id - b.id) * direction;
            } else if (filters.sort.field === 'name') {
                return a.name.localeCompare(b.name) * direction;
            }
            
            return 0;
        });
        
        // For descending order with no filters, consider loading newer Pokemon first
        if (filters.sort.direction === 'desc' && !isAnyFilterActive && filteredList.length < 60) {
            // This will trigger a new fetch from the end of the list
            setOffset(prev => prev + LIMIT);
        }
        
        setDisplayPokemon(filteredList);
    };

    // Navigate to a specific Pokemon by ID
    const handleNavigate = async (id) => {
        if (id < 1) return; // Prevent navigation to invalid IDs
        
        try {
            // Check if this Pokemon is already in our list
            const existingPokemon = allPokemon.find(p => p.id === id);
            
            if (!existingPokemon) {
                // Always fetch the Pokemon directly to ensure we have the latest data
                const detailRes = await fetch(`${DETAILS_URL}/${id}`);
                const pokemonDetails = await detailRes.json();
                
                // Fetch species data
                const speciesRes = await fetch(`${SPECIES_URL}/${id}`);
                const speciesData = await speciesRes.json();
                
                // Create a detailed Pokemon object
                const newPokemon = {
                    name: pokemonDetails.name,
                    url: `${DETAILS_URL}/${id}/`,
                    id: id,
                    types: pokemonDetails.types.map(t => t.type.name),
                    generation: parseInt(speciesData.generation.url.split('/').filter(Boolean).pop()),
                    games: pokemonDetails.game_indices.map(g => g.version.name)
                };
                
                // Add this Pokemon to our list
                setAllPokemon(prev => {
                    const updatedList = [...prev, newPokemon];
                    return updatedList;
                });
            }
            
            setSelectedPokemonId(id);
            
            // Wait for rendering then scroll to the Pokemon
            setTimeout(() => {
                const element = document.getElementById(`pokemon-${id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } catch (err) {
            console.error(`Failed to fetch Pokémon #${id}:`, err);
        }
    };

    // Check if we need to load more Pokemon when filtering has few results
useEffect(() => {
    if (isFilterActive && displayPokemon.length < 5 && offset < MAX_POKEMON && allPokemon.length < 100) {
        // Load more Pokemon if filtering has few results and we haven't loaded many yet
        setOffset(prev => prev + LIMIT);
    }
    
    // Initial load for descending sort - pre-fetch more Pokémon
    if (filterParams.sort.direction === 'desc' && allPokemon.length < 60 && !isFilterActive) {
        setOffset(prev => prev + LIMIT);
    }
}, [displayPokemon, isFilterActive, offset, allPokemon.length, filterParams.sort.direction]);

return (
    <div className="App ">
        <h1 className="text-3xl font-bold text-center">Pokédex</h1>
        
        {/* Side-by-side layout with full-width container */}
        <div className="container mx-auto flex flex-col md:flex-row mt-16">
            {/* Left sidebar with filters - reduced width */}
            <div className="mb-6 md:mb-0 md:pr-4 w-[34vw] md:pl-4">
                <div className="sticky top-4 bg-white rounded-lg shadow-md p-4 w-[30vw]">
                    <SearchFilterSort onApplyFilters={handleFilterChange} />
                </div>
            </div>
            
            {/* Right side with Pokemon cards - increased width */}
            <div className="md:w-2/3 lg:w-3/4">
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-y-16 gap-x-8 w-[66vw]">
                    {displayPokemon.map((pokemon, index) => {
                        if (index === displayPokemon.length - 1) {
                            return (
                                <div ref={lastPokemonRef} key={`${pokemon.name}-${pokemon.id}`} id={`pokemon-${pokemon.id}`}>
                                    <Card 
                                        name={pokemon.name} 
                                        url={`${DETAILS_URL}/${pokemon.id}/`} 
                                        onNavigate={handleNavigate}
                                    />
                                </div>
                            );
                        }
                        return (
                            <div key={`${pokemon.name}-${pokemon.id}`} id={`pokemon-${pokemon.id}`}>
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
                        <p className="text-xl text-gray-600">No Pokémon found matching your filters</p>
                    </div>
                )}
                
                {(loading || searchLoading) && (
                    <div className="flex justify-center items-center h-32">
                        <img src="src/assets/pikachu-running.gif" alt="Loading..." className="w-24 h-17" />
                    </div>
                )}
            </div>
        </div>
    </div>
);
}

export default App;