import React, { useEffect, useState, useRef } from 'react';
import PokemonModal from './Modal';

const IMAGE_URL = "https://assets.pokemon.com/assets/cms2/img/pokedex/full/";

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

export default function Card({ name, url, onNavigate }) {
    const [image, setImage] = useState(null);
    const [id, setId] = useState(null);
    const [types, setTypes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [pokemonData, setPokemonData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPokemonData = async (pokemonUrl) => {
        setLoading(true);
        try {
            const res = await fetch(pokemonUrl);
            const data = await res.json();
            
            console.log(`Fetched data for ${data.name}:`, data);
            setId(data.id);
            const paddedId = String(data.id).padStart(3, '0');
            setImage(`${IMAGE_URL}${paddedId}.png`);

            const extractedTypes = data.types.map(t => t.type.name);
            setTypes(extractedTypes);
            setPokemonData(data);
            
            setLoading(false);
            return data;
        } catch (err) {
            console.error(`Error fetching details for Pokémon:`, err);
            setLoading(false);
            return null;
        }
    };

    useEffect(() => {
        fetchPokemonData(url);
    }, [url]);

    const handleCardClick = () => {
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <>
            <div 
                className="relative flex flex-col items-center bg-white rounded-2xl shadow-lg pt-24 pb-6 px-6 hover:scale-105 transition-transform min-h-[300px] min-w-[300px] cursor-pointer"
                onClick={handleCardClick}
            >
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="w-52 h-52 object-contain absolute -top-16 z-10"
                    />
                ) : (
                    <div className="w-52 h-52 bg-gray-200 animate-pulse rounded-md absolute -top-16 z-10" />
                )}

                {id && <p className="mt-12 text-3xl text-gray-500">#{id}</p>}
                <h3 className="text-4xl font-bold capitalize">{pokemonData?.name || name}</h3>

                <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {types.map(type => (
                        <span
                            key={type}
                            className={`text-white text-normal px-5 py-2 rounded-full ${TYPE_COLORS[type] || 'bg-gray-300'}`}
                        >
                            {type.toUpperCase()}
                        </span>
                    ))}
                </div>
            </div>

            {showModal && (
                <PokemonModal
                    pokemonData={pokemonData}
                    image={image}
                    types={types}
                    id={id}
                    name={name}
                    url={url}
                    loading={loading}
                    onClose={closeModal}
                    onNavigate={onNavigate}
                    fetchPokemonData={fetchPokemonData}
                />
            )}
        </>
    );
}