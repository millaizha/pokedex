import React, { useEffect, useRef, useState, useCallback } from 'react';
import Card from './components/Card';

const LIMIT = 10;
const DETAILS_URL = "https://pokeapi.co/api/v2/pokemon";

function App() {
    const [pokemonList, setPokemonList] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedPokemonId, setSelectedPokemonId] = useState(null);
    const observer = useRef();

    const lastPokemonRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setOffset(prev => prev + LIMIT);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading]);

    useEffect(() => {
        const fetchPokemon = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${DETAILS_URL}?limit=${LIMIT}&offset=${offset}`);
                const data = await res.json();
                
                setPokemonList(prev => {
                    const newPokemon = data.results.filter(newPoke => {
                        const newUrlParts = newPoke.url.split('/');
                        const newId = parseInt(newUrlParts[newUrlParts.length - 2]);
                        
                        return !prev.some(existingPoke => {
                            const existingUrlParts = existingPoke.url.split('/');
                            const existingId = parseInt(existingUrlParts[existingUrlParts.length - 2]);
                            return existingId === newId;
                        });
                    });
                    
                    return [...prev, ...newPokemon];
                });
            } catch (err) {
                console.error("Failed to fetch Pokémon:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPokemon();
    }, [offset]);

    const handleNavigate = async (id) => {
        if (id < 1) return; 
        
        try {
            const res = await fetch(`${DETAILS_URL}/${id}`);
            const pokemonData = await res.json();
            
            const newPokemon = {
                name: pokemonData.name,
                url: `${DETAILS_URL}/${id}/`,
            };
            
            setPokemonList(prev => {
                if (prev.some(p => {
                    const urlParts = p.url.split('/');
                    const pokemonId = parseInt(urlParts[urlParts.length - 2]);
                    return pokemonId === id;
                })) {
                    return prev;
                }
                return [...prev, newPokemon];
            });
            
            setSelectedPokemonId(id);
            
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

    return (
        <div className="App">
            <h1 className="text-3xl font-bold text-center my-6">Pokedex</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-16 gap-x-4 p-4 pt-10">
                {pokemonList.map((pokemon, index) => {
                    const urlParts = pokemon.url.split('/');
                    const pokemonId = parseInt(urlParts[urlParts.length - 2]);
                    
                    if (index === pokemonList.length - 1) {
                        return (
                            <div ref={lastPokemonRef} key={`${pokemon.name}-${pokemonId}`} id={`pokemon-${pokemonId}`}>
                                <Card 
                                    name={pokemon.name} 
                                    url={pokemon.url} 
                                    onNavigate={handleNavigate}
                                />
                            </div>
                        );
                    }
                    return (
                        <div key={`${pokemon.name}-${pokemonId}`} id={`pokemon-${pokemonId}`}>
                            <Card 
                                name={pokemon.name} 
                                url={pokemon.url} 
                                onNavigate={handleNavigate}
                            />
                        </div>
                    );
                })}
            </div>
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <img src="src/assets/pikachu-running.gif" alt="Loading..." className="w-24 h-17" />
                </div>
            )}
        </div>
    );
}

export default App;