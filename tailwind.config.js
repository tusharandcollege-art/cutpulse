/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0fdf9',
                    100: '#ccfbef',
                    200: '#99f5dd',
                    300: '#5fe8c5',
                    400: '#2dd4aa',
                    500: '#12b8a6',
                    600: '#0d9689',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
            },
            animation: {
                'fadeIn': 'fadeIn 0.4s ease-out',
                'scaleIn': 'scaleIn 0.2s ease-out',
                'pulse2': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
                'shimmer': 'shimmer 1.8s ease-in-out infinite',
                'spin-slow': 'spin 2s linear infinite',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
                shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
            },
            boxShadow: {
                'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                'card-hover': '0 4px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
                'glow': '0 0 20px rgba(18,184,166,0.35)',
            },
        },
    },
    plugins: [],
}
