import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['**/dist/**']),
  { files: ['**/*.{js,mjs}'], extends: [js.configs.recommended], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
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
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['**/main.tsx', '**/steps.tsx', 'tests/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['**/chrome/Toc.tsx'],
    rules: { 'react-refresh/only-export-components': ['error', { allowExportNames: ['eraStarts'] }] },
  },
])
