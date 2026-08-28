/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // No explicit host resolves to Node's own "localhost" binding, which on
    // this machine only listens on the IPv6 loopback (::1) — so
    // http://localhost:5173 works but http://127.0.0.1:5173 (IPv4) is
    // refused. Binding explicitly to 0.0.0.0 listens on every IPv4 interface
    // too, matching supabase/config.toml's redirect allow-list, which lists
    // both hosts.
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
