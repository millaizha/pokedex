import React, { useEffect, useState, useRef } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

const IMAGE_URL = "https://assets.pokemon.com/assets/cms2/img/pokedex/full/";
const DETAILS_URL = "https://pokeapi.co/api/v2/pokemon";

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

const POKEMON_COLORS = {
  black: "bg-gray-800",
  blue: "bg-blue-600",
  brown: "bg-amber-700",
  gray: "bg-gray-500",
  green: "bg-green-600",
  pink: "bg-pink-500",
  purple: "bg-purple-600",
  red: "bg-red-600",
  white: "bg-gray-100",
  yellow: "bg-yellow-500",
};

const TYPE_WEAKNESSES = {
  normal: ["fighting"],
  fire: ["water", "ground", "rock"],
  water: ["electric", "grass"],
  grass: ["fire", "ice", "poison", "flying", "bug"],
  electric: ["ground"],
  ice: ["fire", "fighting", "rock", "steel"],
  fighting: ["flying", "psychic", "fairy"],
  poison: ["ground", "psychic"],
  ground: ["water", "grass", "ice"],
  flying: ["electric", "ice", "rock"],
  psychic: ["bug", "ghost", "dark"],
  bug: ["fire", "flying", "rock"],
  rock: ["water", "grass", "fighting", "ground", "steel"],
  ghost: ["ghost", "dark"],
  dragon: ["ice", "dragon", "fairy"],
  dark: ["fighting", "bug", "fairy"],
  steel: ["fire", "fighting", "ground"],
  fairy: ["poison", "steel"],
};

export default function PokemonModal({
  pokemonData: initialPokemonData,
  image: initialImage,
  types: initialTypes,
  id: initialId,
  name: initialName,
  url: initialUrl,
  loading: initialLoading,
  onClose,
  fetchPokemonData,
}) {
  // State for modal's internal Pokemon data - separate from the parent component
  const [modalPokemonData, setModalPokemonData] = useState(initialPokemonData);
  const [modalImage, setModalImage] = useState(initialImage);
  const [modalTypes, setModalTypes] = useState(initialTypes);
  const [modalId, setModalId] = useState(initialId);
  const [modalName, setModalName] = useState(initialName);
  const [modalLoading, setModalLoading] = useState(initialLoading);

  const [evolutionChain, setEvolutionChain] = useState([]);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [weaknesses, setWeaknesses] = useState([]);
  const [speciesData, setSpeciesData] = useState(null);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [habitat, setHabitat] = useState("");
  const [pokemonColor, setPokemonColor] = useState("bg-blue-600");
  const audioRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    // Initialize modal data with props
    setModalPokemonData(initialPokemonData);
    setModalImage(initialImage);
    setModalTypes(initialTypes);
    setModalId(initialId);
    setModalName(initialName);
    setModalLoading(initialLoading);
  }, [
    initialPokemonData,
    initialImage,
    initialTypes,
    initialId,
    initialName,
    initialLoading,
  ]);

  useEffect(() => {
    if (modalPokemonData) {
      loadPokemonDetails();
    }
  }, [modalPokemonData]);

  const loadPokemonDetails = async () => {
    if (!modalPokemonData) return;

    // Get weaknesses based on types
    const typeWeaknesses = new Set();
    modalTypes.forEach((type) => {
      if (TYPE_WEAKNESSES[type]) {
        TYPE_WEAKNESSES[type].forEach((weakness) =>
          typeWeaknesses.add(weakness)
        );
      }
    });
    setWeaknesses(Array.from(typeWeaknesses));

    try {
      // Get species data to get evolution chain, description, habitat, and color
      const speciesRes = await fetch(modalPokemonData.species.url);
      const speciesData = await speciesRes.json();
      setSpeciesData(speciesData);

      // Get generation
      if (speciesData.generation) {
        const genNum = parseInt(
          speciesData.generation.url.split("/").filter(Boolean).pop()
        );
        setGeneration(genNum);
      }

      // Get habitat
      if (speciesData.habitat) {
        setHabitat(speciesData.habitat.name);
      } else {
        setHabitat("Unknown");
      }

      // Get Pokemon color
      if (speciesData.color && speciesData.color.name) {
        const colorName = speciesData.color.name;
        setPokemonColor(POKEMON_COLORS[colorName] || "bg-blue-600");
      }

      // Get evolution chain
      if (speciesData.evolution_chain?.url) {
        await fetchEvolutionChain(speciesData.evolution_chain.url);
      }
    } catch (err) {
      console.error("Error fetching species data:", err);
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
        image: `${IMAGE_URL}${String(firstFormId).padStart(3, "0")}.png`,
      });

      // Process evolutions
      while (evoData.evolves_to?.length > 0) {
        evoData = evoData.evolves_to[0];
        const evoId = await getSpeciesId(evoData.species.url);
        evolutionData.push({
          name: evoData.species.name,
          id: evoId,
          image: `${IMAGE_URL}${String(evoId).padStart(3, "0")}.png`,
        });
      }

      setEvolutionChain(evolutionData);
    } catch (err) {
      console.error("Error fetching evolution chain:", err);
    } finally {
      setEvolutionLoading(false);
    }
  };

  const playCry = () => {
    if (audioRef.current && modalPokemonData?.cries?.latest) {
      audioRef.current.src = modalPokemonData.cries.latest;
      audioRef.current.play().catch((err) => {
        console.error("Failed to play audio:", err);
      });
    }
  };

  // Function to fetch Pokemon data for the modal only
  const fetchModalPokemonData = async (pokemonUrl) => {
    setModalLoading(true);
    try {
      const res = await fetch(pokemonUrl);
      const data = await res.json();

      setModalId(data.id);
      const paddedId = String(data.id).padStart(3, "0");
      setModalImage(`${IMAGE_URL}${paddedId}.png`);

      const extractedTypes = data.types.map((t) => t.type.name);
      setModalTypes(extractedTypes);
      setModalPokemonData(data);
      setModalName(data.name);

      setModalLoading(false);
      return data;
    } catch (err) {
      console.error(`Error fetching details for Pokémon:`, err);
      setModalLoading(false);
      return null;
    }
  };

  // Navigate to evolution when clicked
  const handleEvolutionClick = async (evoId) => {
    if (evoId === modalId) return;

    setNavigationLoading(true);

    try {
      const newPokemonUrl = `${DETAILS_URL}/${evoId}`;
      await fetchModalPokemonData(newPokemonUrl);
    } catch (error) {
      console.error("Error navigating to evolution:", error);
    } finally {
      setNavigationLoading(false);
    }
  };

  // Get description
  const getDescription = () => {
    if (!speciesData || !speciesData.flavor_text_entries)
      return "No description available.";

    const englishEntry = speciesData.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );

    return englishEntry
      ? englishEntry.flavor_text.replace(/[\n\f]/g, " ")
      : "No English description available.";
  };

  const getCategory = () => {
    if (!speciesData || !speciesData.genera) return "";

    const englishGenus = speciesData.genera.find(
      (genus) => genus.language.name === "en"
    );

    return englishGenus ? englishGenus.genus : "";
  };

  const handlePrevPokemon = async (e) => {
    e.stopPropagation();
    if (modalId > 1) {
      setNavigationLoading(true);
      try {
        const prevPokemonUrl = `${DETAILS_URL}/${modalId - 1}`;
        await fetchModalPokemonData(prevPokemonUrl);
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
      const nextPokemonUrl = `${DETAILS_URL}/${modalId + 1}`;
      await fetchModalPokemonData(nextPokemonUrl);
    } catch (error) {
      console.error("Error navigating to next Pokémon:", error);
    } finally {
      setNavigationLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.key === "ArrowLeft") {
        if (modalId > 1) {
          e.preventDefault();
          await handlePrevPokemon(e);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        await handleNextPokemon(e);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalId]);

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
          className="absolute top-12 right-20 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
          aria-label="Close Modal"
        >
          <FaTimes className="h-12 w-12" />
        </button>

        {/* Previous Pokemon navigation button */}
        {modalId > 1 && (
          <button
            onClick={handlePrevPokemon}
            className="absolute left-20 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 z-50 disabled:opacity-50"
            aria-label="Previous Pokémon"
            disabled={navigationLoading}
          >
            <FaChevronLeft className="h-8 w-8" />
          </button>
        )}

        {/* Next Pokemon navigation button */}
        <button
          onClick={handleNextPokemon}
          className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 z-50 disabled:opacity-50"
          aria-label="Next Pokémon"
          disabled={navigationLoading}
        >
          <FaChevronRight className="h-8 w-8" />
        </button>

        <div
          ref={modalRef}
          className="bg-[#EDF2F1] rounded-xl shadow-xl max-w-[80vw] w-full max-h-[95vh] overflow-auto animate-slide-up relative border-8 border-[#F7F3E1]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {modalLoading || navigationLoading ? (
              <div className="flex justify-center items-center h-64">
                <img
                  src="src/assets/pikachu-running.gif"
                  alt="Loading..."
                  className="w-24 h-17"
                />
              </div>
            ) : modalPokemonData ? (
              <div className="flex flex-col space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-6">
                    <div className="flex justify-center pb-4">
                      <div className="relative group w-96 h-96">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            src="src/assets/pokeball.png"
                            alt="Pokeball background"
                            className="w-100 h-100 opacity-20 animate-spin-slow"
                          />
                        </div>
                        <img
                          src={modalImage}
                          alt={modalPokemonData.name}
                          className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-110 cursor-pointer z-10"
                          onClick={playCry}
                          onMouseEnter={playCry}
                        />
                        {modalPokemonData?.cries?.latest && (
                          <span className="absolute -bottom-4 left-0 right-0 text-xs text-gray-500 block text-center z-20">
                            Hover to play cry
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center gap-3">
                      {modalTypes.map((type) => (
                        <span
                          key={type}
                          className={`text-white text-lg px-5 py-2 rounded-full ${
                            TYPE_COLORS[type] || "bg-gray-300"
                          }`}
                        >
                          {type.toUpperCase()}
                        </span>
                      ))}
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm text-lg">
                      {modalPokemonData.stats.map((stat) => (
                        <div key={stat.stat.name} className="mb-2">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium capitalize">
                              {stat.stat.name.replace("-", " ")}
                            </span>
                            <span>{stat.base_stat}</span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-2.5">
                            <div
                              className={`${pokemonColor} h-2.5 rounded-full`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (stat.base_stat / 255) * 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4">
                    <div className="text-center space-y-2">
                      <span className="text-3xl font-bold text-gray-700">
                        #{modalId}
                      </span>
                      <h2 className="text-5xl font-bold capitalize">
                        {modalPokemonData?.name || modalName}
                      </h2>
                      <h3 className="text-xl text-gray-600 italic">
                        {getCategory()}
                      </h3>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm text-xl">
                      <p className="text-gray-700">{getDescription()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <p className="text-xl">
                            Height: {modalPokemonData.height / 10} m
                          </p>
                          <p className="text-xl">
                            Weight: {modalPokemonData.weight / 10} kg
                          </p>
                          <p className="text-xl">
                            Habitat: {habitat.toUpperCase()}
                          </p>
                          <p className="text-xl">Generation: {generation}</p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <h4 className="font-bold text-gray-700">Abilities</h4>
                          <ul className="text-xl list-disc pl-5">
                            {modalPokemonData.abilities.map((ability) => (
                              <li
                                key={ability.ability.name}
                                className="capitalize"
                              >
                                {ability.ability.name.replace("-", " ")}
                                {ability.is_hidden && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    (Hidden)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="text-2xl font-bold mb-3">Weaknesses</h3>
                      <div className="flex flex-wrap gap-2">
                        {weaknesses.length > 0 ? (
                          weaknesses.map((weakness) => (
                            <span
                              key={weakness}
                              className={`text-white text-lg px-3 py-1 rounded-full ${
                                TYPE_COLORS[weakness] || "bg-gray-300"
                              }`}
                            >
                              {weakness.toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">
                            No known weaknesses
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="text-2xl font-bold mb-3">
                        Evolution Chain
                      </h3>
                      {evolutionLoading ? (
                        <div className="flex justify-center items-center h-24">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
                        </div>
                      ) : evolutionChain.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-4">
                          {evolutionChain.map((evo, index) => (
                            <React.Fragment key={evo.id}>
                              <div
                                className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                  evo.id === modalId
                                    ? "bg-blue-100"
                                    : "hover:bg-gray-100"
                                } relative`}
                                onClick={() => handleEvolutionClick(evo.id)}
                              >
                                {evo.id === modalId && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <img
                                      src="src/assets/pokeball.png"
                                      alt="Pokeball background"
                                      className="w-36 h-36 opacity-20 animate-spin-slow absolute top-0"
                                    />
                                  </div>
                                )}
                                <img
                                  src={evo.image}
                                  alt={evo.name}
                                  className="w-32 h-32 object-contain relative z-10"
                                />
                                <span className="capitalize font-medium text-xl relative z-10">
                                  {evo.name}
                                </span>
                                <span className="text-lg text-gray-500 relative z-10">
                                  #{evo.id}
                                </span>
                              </div>
                              {index < evolutionChain.length - 1 && (
                                <div className="mx-4 text-2xl text-gray-400">
                                  →
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">
                          No evolution data available
                        </p>
                      )}
                    </div>
                  </div>
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
