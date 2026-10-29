import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', '.prerender', 'artifacts', '.static-site-test-*']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  {
    files: [
      'scripts/**/*.{js,mjs}',
      'tests/**/*.{js,mjs}',
      'vite.config.js',
      'src/entry-server.jsx',
    ],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
]);
