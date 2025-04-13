import React, { useEffect, useState, useRef } from "react";
import PokemonModal from "./Modal";

const IMAGE_URL = "https://assets.pokemon.com/assets/cms2/img/pokedex/full/";

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

export default function Card({ name, url, onNavigate }) {
  const [image, setImage] = useState(null);
  const [id, setId] = useState(null);
  const [types, setTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pokemonData, setPokemonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialPokemonData, setInitialPokemonData] = useState(null);

  const fetchPokemonData = async (pokemonUrl) => {
    setLoading(true);
    try {
      const res = await fetch(pokemonUrl);
      const data = await res.json();

      console.log(`Fetched data for ${data.name}:`, data);

      setLoading(false);
      return data;
    } catch (err) {
      console.error(`Error fetching details for Pokémon:`, err);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        const res = await fetch(url);
        const data = await res.json();

        setId(data.id);
        const paddedId = String(data.id).padStart(3, "0");
        setImage(`${IMAGE_URL}${paddedId}.png`);

        const extractedTypes = data.types.map((t) => t.type.name);
        setTypes(extractedTypes);
        setPokemonData(data);
        setInitialPokemonData(data);

        setLoading(false);
      } catch (err) {
        console.error(`Error fetching details for initial Pokémon:`, err);
        setLoading(false);
      }
    };

    initialLoad();
  }, [url]);

  const handleCardClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setPokemonData(initialPokemonData);
    setShowModal(false);
  };

  const handleModalNavigation = async (pokemonUrl) => {
    return await fetchPokemonData(pokemonUrl);
  };

  return (
    <>
      <div
        className="relative flex flex-col items-center bg-[#EDF2F1] rounded-2xl shadow-lg pt-20 pb-6 px-6 hover:scale-105 hover:bg-[#D0E4F1] transition-transform transition duration-300 ease-in-out min-h-[200px] min-w-[200px] cursor-pointer"
        onClick={handleCardClick}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-52 h-52 object-contain absolute -top-16 z-10"
          />
        ) : (
          <div className="flex justify-center items-center animate-pulse">
            <img
              src="src/assets/pokeball.gif"
              alt="Loading..."
              className="w-40 h-40 object-contain absolute -top-8 z-10"
            />
          </div>
        )}

        {id && <p className="mt-16 text-3xl text-gray-500">#{id}</p>}
        <h3 className="text-4xl font-bold capitalize">
          {initialPokemonData?.name || name}
        </h3>

        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {types.map((type) => (
            <span
              key={type}
              className={`text-white text-normal px-5 py-2 rounded-full ${
                TYPE_COLORS[type] || "bg-gray-300"
              }`}
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
          fetchPokemonData={handleModalNavigation}
        />
      )}
    </>
  );
}
