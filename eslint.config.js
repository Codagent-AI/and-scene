import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // The bootstrap template is a self-contained project snapshot with its own
  // tsconfig.json; linting it from the root project's typed parser conflicts
  // with this project's own tsconfig (ambiguous tsconfigRootDir). It is
  // linted on its own terms when materialized by the skill.
  globalIgnores(['dist', 'skills/presentation/templates/bootstrap']),
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
])
