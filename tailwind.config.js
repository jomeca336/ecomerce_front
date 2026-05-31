/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#dce8ff',
          200: '#b9cfff',
          300: '#85aaff',
          400: '#4d7fff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e3a8a',
          800: '#1e2d6b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        card: '0 2px 20px rgba(139, 92, 246, 0.08)',
        'card-hover': '0 8px 32px rgba(139, 92, 246, 0.18)',
      },
    },
  },
  plugins: [],
}
