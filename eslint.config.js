const js = require('@eslint/js')
const globals = require('globals')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')

module.exports = [
  {
    ignores: ['public/', '.cache/', 'node_modules/', 'coverage/'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      // Gatsby inlines process.env.GATSBY_* into the browser bundle.
      globals: {
        ...globals.browser,
        process: 'readonly',
        __PATH_PREFIX__: 'readonly',
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: [
      'gatsby-*.js',
      'gatsby/**/*.js',
      'plugins/**/*.js',
      'src/utils/paths.js',
      '*.config.js',
      'test/**/*.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.test.js', 'test/**/*.js'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
]
