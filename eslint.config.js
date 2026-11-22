import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'skills/presentation/templates', '.test-work', '.presentation-artifacts']),
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
  // Entry modules and typed step modules intentionally colocate metadata with components.
  { files: ['src/main.tsx', 'src/presentation-kit/chrome/Toc.tsx', 'src/presentations/**/steps/*.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
  { files: ['tests/**/*.{ts,tsx}', 'src/presentation-kit/nodes/Node.tsx'], rules: { 'react-refresh/only-export-components': 'off' } },
])
