import React, { useEffect, useState, useRef } from "react";
import PokemonModal from "./Modal";
import { IMAGE_URL, TYPE_COLORS } from "../utils/constants";
import { pokeball_gif } from "../assets/images";

export default function Card({ name, url, onNavigate }) {
  // State variables for Pokemon data and UI control
  const [image, setImage] = useState(null);
  const [id, setId] = useState(null);
  const [types, setTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pokemonData, setPokemonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialPokemonData, setInitialPokemonData] = useState(null);

  // Fetches detailed Pokemon data from provided URL
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

  // Loads initial Pokemon data when component mounts or URL changes
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

  // Opens the detail modal when card is clicked
  const handleCardClick = () => {
    setShowModal(true);
  };

  // Closes the modal and resets Pokemon data to initial state
  const closeModal = () => {
    setPokemonData(initialPokemonData);
    setShowModal(false);
  };

  // Handles navigation between Pokemon within the modal
  const handleModalNavigation = async (pokemonUrl) => {
    return await fetchPokemonData(pokemonUrl);
  };

  return (
    <>
      {/* Main Pokemon card component */}
      <div
        className="relative flex flex-col items-center bg-[#EDF2F1] rounded-2xl shadow-lg pt-20 pb-6 px-6 hover:scale-105 hover:bg-[#D0E4F1] transition-transform transition duration-300 ease-in-out min-h-[200px] min-w-[200px] cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Pokemon image with loading fallback */}
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-52 h-52 object-contain absolute -top-16 z-10"
          />
        ) : (
          <div className="flex justify-center items-center animate-pulse">
            <img
              src={pokeball_gif}
              alt="Loading..."
              className="w-40 h-40 object-contain absolute -top-8 z-10"
            />
          </div>
        )}

        {/* Pokemon ID number */}
        {id && <p className="mt-16 text-3xl text-gray-500">#{id}</p>}
        {/* Pokemon name */}
        <h3 className="text-4xl font-bold capitalize">
          {initialPokemonData?.name || name}
        </h3>

        {/* Pokemon type badges */}
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

      {/* Pokemon detail modal */}
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
