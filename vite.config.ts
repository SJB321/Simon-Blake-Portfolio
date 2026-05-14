import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    // @react-pdf/renderer depends on Node-only modules (Buffer, stream, etc).
    // Vite's dev mode handles them implicitly via esbuild, but the production
    // Rollup bundle doesn't — so we polyfill them explicitly here.
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
    // Server-only deps used by the /api Vercel functions — these should
    // never reach the browser bundle, so don't waste time pre-bundling them
    // for the dev server. (They were getting picked up via the api/ folder.)
    exclude: ['@prisma/client', 'bcryptjs', '@supabase/supabase-js'],
  },
})
