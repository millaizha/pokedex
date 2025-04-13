import React, { useEffect, useState, useRef } from 'react';

const IMAGE_URL = "https://assets.pokemon.com/assets/cms2/img/pokedex/full/";
const DETAILS_URL = "https://pokeapi.co/api/v2/pokemon";

const TYPE_COLORS = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-400',
    ice: 'bg-blue-200',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-sky-300',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500',
    rock: 'bg-yellow-800',
    ghost: 'bg-indigo-500',
    dragon: 'bg-purple-700',
    dark: 'bg-gray-700',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300',
};

const POKEMON_COLORS = {
    black: 'bg-gray-800',
    blue: 'bg-blue-600',
    brown: 'bg-amber-700',
    gray: 'bg-gray-500',
    green: 'bg-green-600',
    pink: 'bg-pink-500',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
    white: 'bg-gray-500',
    yellow: 'bg-yellow-500'
};

const TYPE_WEAKNESSES = {
    normal: ['fighting'],
    fire: ['water', 'ground', 'rock'],
    water: ['electric', 'grass'],
    grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
    electric: ['ground'],
    ice: ['fire', 'fighting', 'rock', 'steel'],
    fighting: ['flying', 'psychic', 'fairy'],
    poison: ['ground', 'psychic'],
    ground: ['water', 'grass', 'ice'],
    flying: ['electric', 'ice', 'rock'],
    psychic: ['bug', 'ghost', 'dark'],
    bug: ['fire', 'flying', 'rock'],
    rock: ['water', 'grass', 'fighting', 'ground', 'steel'],
    ghost: ['ghost', 'dark'],
    dragon: ['ice', 'dragon', 'fairy'],
    dark: ['fighting', 'bug', 'fairy'],
    steel: ['fire', 'fighting', 'ground'],
    fairy: ['poison', 'steel'],
};

export default function PokemonModal({ 
    pokemonData,
    image, 
    types, 
    id, 
    name, 
    url,
    loading, 
    onClose, 
    onNavigate,
    fetchPokemonData
}) {
    const [evolutionChain, setEvolutionChain] = useState([]);
    const [evolutionLoading, setEvolutionLoading] = useState(false);
    const [weaknesses, setWeaknesses] = useState([]);
    const [pastTypes, setPastTypes] = useState([]);
    const [speciesData, setSpeciesData] = useState(null);
    const [navigationLoading, setNavigationLoading] = useState(false);
    const [generation, setGeneration] = useState(0);
    const [habitat, setHabitat] = useState('');
    const [pokemonColor, setPokemonColor] = useState('bg-blue-600'); 
    const audioRef = useRef(null);
    const modalRef = useRef(null);
    const rightColumnRef = useRef(null);

    useEffect(() => {
        if (pokemonData) {
            loadPokemonDetails();
        }
    }, [pokemonData]);

    const loadPokemonDetails = async () => {
        if (!pokemonData) return;

        // Extract past types if available
        if (pokemonData.past_types && pokemonData.past_types.length > 0) {
            setPastTypes(pokemonData.past_types);
        } else {
            setPastTypes([]);
        }
        
        // Get weaknesses based on types
        const typeWeaknesses = new Set();
        types.forEach(type => {
            if (TYPE_WEAKNESSES[type]) {
                TYPE_WEAKNESSES[type].forEach(weakness => typeWeaknesses.add(weakness));
            }
        });
        setWeaknesses(Array.from(typeWeaknesses));
        
        try {
            // Get species data to get evolution chain, description, habitat, and color
            const speciesRes = await fetch(pokemonData.species.url);
            const speciesData = await speciesRes.json();
            setSpeciesData(speciesData);
            
            // Get generation
            if (speciesData.generation) {
                const genNum = parseInt(speciesData.generation.url.split('/').filter(Boolean).pop());
                setGeneration(genNum);
            }
            
            // Get habitat
            if (speciesData.habitat) {
                setHabitat(speciesData.habitat.name);
            } else {
                setHabitat('Unknown');
            }
            
            // Get Pokemon color
            if (speciesData.color && speciesData.color.name) {
                const colorName = speciesData.color.name;
                setPokemonColor(POKEMON_COLORS[colorName] || 'bg-blue-600');
            }
            
            // Get evolution chain
            if (speciesData.evolution_chain?.url) {
                await fetchEvolutionChain(speciesData.evolution_chain.url);
            }
        } catch (err) {
            console.error('Error fetching species data:', err);
        }
    };

    const fetchEvolutionChain = async (evolutionUrl) => {
        setEvolutionLoading(true);
        try {
            const response = await fetch(evolutionUrl);
            const data = await response.json();
            
            const evolutionData = [];
            let evoData = data.chain;
            
            // Get the first form
            const getSpeciesId = async (speciesUrl) => {
                const response = await fetch(speciesUrl);
                const data = await response.json();
                return data.id;
            };
            
            // Process first form
            const firstFormId = await getSpeciesId(evoData.species.url);
            evolutionData.push({
                name: evoData.species.name,
                id: firstFormId,
                image: `${IMAGE_URL}${String(firstFormId).padStart(3, '0')}.png`
            });
            
            // Process evolutions
            while (evoData.evolves_to?.length > 0) {
                evoData = evoData.evolves_to[0];
                const evoId = await getSpeciesId(evoData.species.url);
                evolutionData.push({
                    name: evoData.species.name,
                    id: evoId,
                    image: `${IMAGE_URL}${String(evoId).padStart(3, '0')}.png`
                });
            }
            
            setEvolutionChain(evolutionData);
        } catch (err) {
            console.error('Error fetching evolution chain:', err);
        } finally {
            setEvolutionLoading(false);
        }
    };

    const playCry = (e) => {
        e.stopPropagation();
        if (audioRef.current && pokemonData?.cries?.latest) {
            audioRef.current.src = pokemonData.cries.latest;
            audioRef.current.play().catch(err => {
                console.error("Failed to play audio:", err);
            });
        }
    };

    // Navigate to evolution when clicked
    const handleEvolutionClick = async (evoId) => {
        if (evoId === id) return; 
        
        setNavigationLoading(true);
        
        try {
            const newPokemonUrl = `${DETAILS_URL}/${evoId}`;
            await fetchPokemonData(newPokemonUrl);
            
            if (onNavigate) {
                onNavigate(evoId);
            }
        } catch (error) {
            console.error("Error navigating to evolution:", error);
        } finally {
            setNavigationLoading(false);
        }
    };
    
    // Get description
    const getDescription = () => {
        if (!speciesData || !speciesData.flavor_text_entries) return "No description available.";
        
        const englishEntry = speciesData.flavor_text_entries.find(
            entry => entry.language.name === 'en'
        );
        
        return englishEntry ? 
            englishEntry.flavor_text.replace(/[\n\f]/g, ' ') : 
            "No English description available.";
    };
    
    const getCategory = () => {
        if (!speciesData || !speciesData.genera) return "";
        
        const englishGenus = speciesData.genera.find(
            genus => genus.language.name === 'en'
        );
        
        return englishGenus ? englishGenus.genus : "";
    };
    
    const handlePrevPokemon = async (e) => {
        e.stopPropagation();
        if (id > 1) {
            setNavigationLoading(true);
            try {
                const prevPokemonUrl = `${DETAILS_URL}/${id - 1}`;
                await fetchPokemonData(prevPokemonUrl);
                
                if (onNavigate) {
                    onNavigate(id - 1);
                }
            } catch (error) {
                console.error("Error navigating to previous Pokémon:", error);
            } finally {
                setNavigationLoading(false);
            }
        }
    };
    
    const handleNextPokemon = async (e) => {
        e.stopPropagation();
        setNavigationLoading(true);
        try {
            const nextPokemonUrl = `${DETAILS_URL}/${id + 1}`;
            await fetchPokemonData(nextPokemonUrl);
            
            if (onNavigate) {
                onNavigate(id + 1);
            }
        } catch (error) {
            console.error("Error navigating to next Pokémon:", error);
        } finally {
            setNavigationLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = async (e) => {
            if (e.key === 'ArrowLeft') {
                if (id > 1) {
                    e.preventDefault();
                    await handlePrevPokemon(e);
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                await handleNextPokemon(e);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [id]);

    return (
        <>
            {/* Audio element for playing cry */}
            <audio ref={audioRef} />

            <div 
                className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-12 right-60 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
                    aria-label="Close Modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Previous Pokemon navigation button */}
                {id > 1 && (
                    <button 
                        onClick={handlePrevPokemon}
                        className="absolute left-60 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 z-50 disabled:opacity-50"
                        aria-label="Previous Pokémon"
                        disabled={navigationLoading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                
                {/* Next Pokemon navigation button */}
                <button 
                    onClick={handleNextPokemon}
                    className="absolute right-60 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 z-50 disabled:opacity-50"
                    aria-label="Next Pokémon"
                    disabled={navigationLoading}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                
                <div 
                    ref={modalRef}
                    className="bg-[#f5f5f5] rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slide-up relative"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Modal */}
                    <div className="p-6">
                        {loading || navigationLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <img src="src/assets/pikachu-running.gif" alt="Loading..." className="w-24 h-17" />
                                </div>
                            
                        ) : pokemonData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left column */}
                                <div className="flex flex-col items-center">
                                    <img 
                                        src={image} 
                                        alt={pokemonData.name}
                                        className="w-64 h-64 object-contain"
                                    />
                                    <div className="flex flex-col items-center mt-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-3xl font-bold capitalize">{pokemonData?.name || name}</h2>
                                            {pokemonData?.cries?.latest && (
                                                <button 
                                                    onClick={playCry}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
                                                    title="Play cry"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-4.242a1 1 0 011.414 0 1 1 0 010 1.414m-2.828-4.242a9 9 0 000 12.728" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xl font-bold text-gray-400">#{id}</span>
                                            {speciesData && (
                                                <span className="text-lg text-gray-600 italic">{getCategory()}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-4">
                                        {types.map(type => (
                                            <span
                                                key={type}
                                                className={`text-white text-normal px-5 py-2 rounded-full ${TYPE_COLORS[type] || 'bg-gray-300'}`}
                                            >
                                                {type.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                    {speciesData && (
                                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
                                            <p className="text-gray-700">{getDescription()}</p>
                                        </div>
                                    )}
                                    <div className="mt-6 w-full">
                                        <h3 className="text-xl font-bold mb-3 text-center">Evolution Chain</h3>
                                        {evolutionLoading ? (
                                            <div className="flex justify-center items-center h-24">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
                                            </div>
                                        ) : evolutionChain.length > 0 ? (
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                {evolutionChain.map((evo, index) => (
                                                    <React.Fragment key={evo.id}>
                                                        <div 
                                                            className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors ${evo.id === id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                                            onClick={() => handleEvolutionClick(evo.id)}
                                                        >
                                                            <img 
                                                                src={evo.image} 
                                                                alt={evo.name}
                                                                className="w-24 h-24 object-contain"
                                                            />
                                                            <span className="capitalize font-medium">{evo.name}</span>
                                                            <span className="text-sm text-gray-500">#{evo.id}</span>
                                                        </div>
                                                        {index < evolutionChain.length - 1 && (
                                                            <div className="mx-4 text-2xl text-gray-400">→</div>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500">No evolution data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right column with details */}
                                <div 
                                    ref={rightColumnRef}
                                    className="max-h-[80vh] overflow-y-auto pr-4"
                                >
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <h3 className="text-xl font-bold mb-2">Physical Traits</h3>
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                                <p className="font-semibold">Height</p>
                                                <p className="text-xl">{pokemonData.height / 10} m</p>
                                            </div>
                                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                                <p className="font-semibold">Weight</p>
                                                <p className="text-xl">{pokemonData.weight / 10} kg</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-2">Base Stats</h3>
                                        {pokemonData.stats.map((stat) => (
                                            <div key={stat.stat.name} className="mb-2">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium capitalize">{stat.stat.name.replace('-', ' ')}</span>
                                                    <span>{stat.base_stat}</span>
                                                </div>
                                                <div className="w-full bg-gray-50 rounded-full h-2.5">
                                                    <div 
                                                        className={`${pokemonColor} h-2.5 rounded-full`} 
                                                        style={{ width: `${Math.min(100, (stat.base_stat / 255) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Details</h3>
                                            <div className="grid grid-cols-1">
                                                <div className="p-3 rounded-lg">
                                                    <p className="font-semibold">Habitat: {habitat}</p>
                                                    <p className="font-semibold">Generation: {generation}</p>
                                                </div>
                                            </div>
                                            
                                            {pokemonData.held_items && pokemonData.held_items.length > 0 && (
                                                <div className="rounded-lg">
                                                    <p className="font-semibold">Held Items</p>
                                                    <ul className="list-disc pl-5">
                                                        {pokemonData.held_items.map((item, index) => (
                                                            <li key={index} className="capitalize">
                                                                {item.item.name.replace('-', ' ')}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Abilities</h3>
                                            <div className="p-3 rounded-lg">
                                                <ul className="list-disc pl-5">
                                                    {pokemonData.abilities.map((ability) => (
                                                        <li key={ability.ability.name} className="capitalize">
                                                            {ability.ability.name.replace('-', ' ')}
                                                            {ability.is_hidden && <span className="text-sm text-gray-500 ml-2">(Hidden)</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    {pastTypes && pastTypes.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold mb-2">Past Types</h3>
                                            {pastTypes.map((pastType, index) => (
                                                <div key={index} className="mb-2">
                                                    <p className="font-medium capitalize">{pastType.generation.name}:</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {pastType.types.map((type, typeIndex) => (
                                                            <span
                                                                key={typeIndex}
                                                                className={`text-white text-sm px-3 py-1 rounded-full ${TYPE_COLORS[type.type.name] || 'bg-gray-300'}`}
                                                            >
                                                                {type.type.name.toUpperCase()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-2">Weaknesses</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {weaknesses.length > 0 ? (
                                                weaknesses.map(weakness => (
                                                    <span
                                                        key={weakness}
                                                        className={`text-white text-normal px-3 py-1 rounded-full ${TYPE_COLORS[weakness] || 'bg-gray-300'}`}
                                                    >
                                                        {weakness.toUpperCase()}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-500">No known weaknesses</span>
                                            )}
                                        </div>
                                    </div>
                                    {pokemonData.game_indices && pokemonData.game_indices.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold mb-2">Game Appearances</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {pokemonData.game_indices.slice(0, 8).map((game, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-gray-200 px-3 py-1 rounded-full text-sm capitalize"
                                                    >
                                                        {game.version.name.replace('-', ' ')}
                                                    </span>
                                                ))}
                                                {pokemonData.game_indices.length > 8 && (
                                                    <span className="text-gray-500 text-sm mt-1">
                                                        +{pokemonData.game_indices.length - 8} more games
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                </div>
                        ) : (
                            <div className="flex justify-center items-center h-64">
                                <p className="text-gray-500">No Pokémon data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}