import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Temporarily disabling PWA to clear broken service worker errors
    /*
    VitePWA({
      ... (original config)
    })
    */
  ],
})
