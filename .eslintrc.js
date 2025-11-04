module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  globals: {
    'game': 'readonly',
    'canvas': 'readonly',
    'CONFIG': 'readonly',
    'Hooks': 'readonly',
    'foundry': 'readonly',
    'Actor': 'readonly',
    'Item': 'readonly',
    'Macro': 'readonly',
    'ChatMessage': 'readonly',
    'Roll': 'readonly',
    'Token': 'readonly',
    'TokenDocument': 'readonly',
    'ActiveEffect': 'readonly'
  }
};