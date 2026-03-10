import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2022,
      // IIFE-style scripts, not ES modules
      sourceType: 'script',
    },
    rules: {
      // Potential bugs
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-implicit-globals': 'error',
      'no-undef': 'error',
    },
  },
];
