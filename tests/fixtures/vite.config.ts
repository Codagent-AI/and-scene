import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'node:path'

// Builds the motion fixtures as a standalone app; never part of the production registry.
export default defineConfig({
  root: join(__dirname, 'motion'),
  plugins: [react()],
  build: { outDir: join(__dirname, '..', '..', '.fixture-dist', 'motion'), emptyOutDir: true },
})
