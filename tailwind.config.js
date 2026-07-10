/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C0152A',
          light: '#F9E5E8',
        },
        secondary: '#FAF8F6',
        accent: '#E8A020',
        success: '#1A9E5C',
        danger: '#EF4444',
        neutral: {
          dark: '#1C1C1E',
          mid: '#6B7280',
          light: '#F3F4F6',
        },
        dark: {
          bg: '#0D1B2A',
        }
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        base: ['16px', '1.5'],
        sm: ['14px', '1.5'],
        h1: ['40px', '1.2'],
        h2: ['32px', '1.25'],
        h3: ['24px', '1.3'],
      },
      animation: {
        pulse: 'pulse 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    }
  },
  plugins: [],
}
