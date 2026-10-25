import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.test-work', 'artifacts', 'skills/presentation/templates']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
    languageOptions: {
      globals: globals.browser,
    },
  },
  { files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'skills/presentation/*.mjs'], extends: [js.configs.recommended], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
])
