/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.TAURI === '1' || process.env.ELECTRON === '1' ? './' : '/',
  plugins: [nodePolyfills(), react()],
  define: {
    // Plotly.js expects Node's `global`; polyfill for browser
    global: 'globalThis',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/charts/**',
        'src/components/**',
      ],
    },
  },
})
