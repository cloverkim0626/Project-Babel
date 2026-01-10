/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Theme: Deep INTP 5w4 (Mysterious, Intellectual, Painful)
                obsidian: '#09090b', // Main Background
                'babel-gold': '#D4AF37', // Primary / Enlightenment
                corrosion: '#8B5CF6', // Mystery / Time (Violet)
                pain: '#EF4444', // Danger / Penalty (Crimson)
                'paper': '#e5e5e5', // Text (Softer white)
            },
            fontFamily: {
                serif: ['Cinzel', 'serif'], // Lore / Titles
                mono: ['"JetBrains Mono"', 'monospace'], // System / Stats
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
