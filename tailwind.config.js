/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        }
      }
    },
  },
  plugins: [],
  safelist: [
    // Add background color classes here to prevent purging
    'bg-gray-400', 'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400',
    'bg-blue-200', 'bg-red-700', 'bg-purple-500', 'bg-yellow-600', 'bg-sky-300',
    'bg-pink-500', 'bg-lime-500', 'bg-yellow-800', 'bg-indigo-500', 'bg-purple-700',
    'bg-gray-700', 'bg-gray-500', 'bg-pink-300', 'bg-gray-300',
    // Animation classes
    'animate-spin', 'animate-slide-up'
  ]
}