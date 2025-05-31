/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            screens: {
                'xs': '475px',
            },
            fontFamily: {
                'geist': ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
                'geist-mono': ['var(--font-geist-mono)', 'monospace'],
            },
            colors: {
                background: {
                    primary: '#000000',
                    secondary: '#0a0a0a',
                    tertiary: '#1a1a1a',
                },
                neutral: {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    850: '#1f1f1f',
                    900: '#171717',
                    950: '#0a0a0a',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'dark-gradient': 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                'neutral-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #262626 100%)',
            },
        },
    },
    plugins: [],
} 