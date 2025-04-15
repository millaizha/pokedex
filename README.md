# Pokédex

A webpage to browse, search and view detailed information about Pokémon.

## Overview

This Pokédex app allows users to browse through all available Pokémon, view detailed information about each one, and filter/sort the list according to various criteria. The application is built using  ReactJS and integrates with the PokéAPI.

### Live deployment: millaizha.github.io/pokedex/

## Features

### Home Page
- Card view list of Pokémon with infinite scroll loading
- Initial load of 10 Pokémon with "Load More" functionality
- Sorting capabilities (by ID or Name)
- Search and filtering options (by ID, Name, Type, Generation, etc.)

### Card View List
- Each card displays:
  - Pokémon ID Number
  - Name
  - Photo
  - Type badges with appropriate type colors

### Detailed Information View
- Modal popup with comprehensive Pokémon details:
  - ID, Name, and Category
  - High-quality image
  - Type badges
  - Base stats with visual indicators
  - Physical attributes (Height, Weight)
  - Habitat and Generation
  - Abilities list (including hidden abilities)
  - Description
  - Type weaknesses (derived from Pokémon types)
  - Evolution chain with navigation between evolutions
  - Audio support for Pokémon cries

### Navigation Features
- "Next" and "Previous" buttons to navigate between Pokémon profiles
- Keyboard navigation support (arrow keys)
- Direct navigation by clicking on evolutions

## Technical Implementation

### API Integration
- Uses the PokéAPI (https://pokeapi.co/) for Pokémon data
- Fetches Pokémon images from https://assets.pokemon.com/assets/cms2/img/pokedex/full/{id}.png

### Performance Optimizations
- Lazy loading of Pokémon data
- Efficient data caching to minimize API calls
- Optimized rendering for large lists
- Batch processing for filtered results

### User Interface
- Responsive design for various screen sizes
- Attractive card-based layout
- Interactive elements with hover effects
- Loading indicators during data fetching
- Error handling for failed API calls

### Search and Filter Features
- Real-time search by name or ID
- Type filtering
- Generation filtering
- Game appearance filtering
- Sorting controls (ascending/descending by ID or name)

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── Card.jsx           # Pokémon card component
│   ├── Modal.jsx          # Detailed view modal
│   └── Filter.jsx         # Search and filtering controls
├── utils/
│   └── constants.js       # API URLs and type mappings
├── assets/                # Images and animations
├── App.jsx                # Main application component
└── main.jsx              # Application entry point
```

## Credits
- Pokémon data provided by [PokéAPI](https://pokeapi.co/)
- Pokémon images from The Pokémon Company

## License
This project is created as part of a technical assessment for Old.St Labs Internship Program.