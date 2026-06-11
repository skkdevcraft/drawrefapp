// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/drawrefapp/',
  build: {
    chunkSizeWarningLimit: 10000
  },
})