/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.ELECTRON === '1' ? './' : '/',
  plugins: [nodePolyfills(), react()],
  define: {
    // Plotly.js expects Node's `global`; polyfill for browser
    global: 'globalThis',
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
