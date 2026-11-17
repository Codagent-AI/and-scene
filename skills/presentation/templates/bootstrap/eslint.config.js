import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'skills/presentation/templates/**']),
  { files: ['scripts/**/*.mjs', 'tests/**/*.mjs'], languageOptions: { globals: { ...globals.node, ...globals.browser } }, extends: [js.configs.recommended] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,

    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
