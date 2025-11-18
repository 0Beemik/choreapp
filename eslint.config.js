const globals = require('globals');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactNative = require('eslint-plugin-react-native');
const reactRecommended = require('eslint-plugin-react/configs/recommended');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ...reactRecommended,
    languageOptions: {
      ...reactRecommended.languageOptions,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['**/*.{js,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    }
  },
  {
    // Ignore generated files
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  }
);