import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Templates are linted inside the project they materialize, not from here.
  globalIgnores(['dist', '.inspection', 'validator_logs', '.agent-runner', 'skills/presentation/templates/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      // Scripts run in Node and hand functions to the browser (page.evaluate).
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['src/tests/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
