import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
    // src/data/*.tsx files deliberately colocate types, mock data, a Context, a
    // useXxx() hook and the XxxProvider component per domain. This trades away
    // Fast Refresh's state-preserving reload for that file (a DX nicety, not a
    // runtime concern) in exchange for one file per domain instead of two.
    files: ['src/data/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
