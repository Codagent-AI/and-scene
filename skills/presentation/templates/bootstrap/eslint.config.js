import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'skills/presentation/templates']),
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
    // Step files export a Scene component alongside its Step data object,
    // so they aren't Fast-Refresh-boundary-pure the way a "component-only"
    // module is expected to be.
    files: ['src/presentations/**/steps/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
