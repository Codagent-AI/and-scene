import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'skills/presentation/templates/bootstrap', 'artifacts']),
  { files: ['**/*.mjs'], languageOptions: { globals: globals.node }, extends: [js.configs.recommended] },
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
  { files: ['**/*.test.{ts,tsx}', '**/steps/*.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
])
