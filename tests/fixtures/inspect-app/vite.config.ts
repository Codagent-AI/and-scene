import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Test-only app for INT-002. Built and previewed by the screenshot helper's integration test.
export default defineConfig({
  plugins: [react()],
})
