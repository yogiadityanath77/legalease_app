/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0a0f1e',
        surface: '#111827',
        gold: '#c9a84c',
        ink: '#f9fafb',
        risk: {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
