module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'off',
    'semi': 'off',
    'quotes': 'off',
    'indent': 'off',
    'comma-dangle': 'off',
    'space-before-function-paren': 'off',
    'no-multiple-empty-lines': 'off',
    'eol-last': 'off',
    'padded-blocks': 'off',
    'no-trailing-spaces': 'off'
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
    'ActiveEffect': 'readonly',
    'ui': 'readonly',
    'Dialog': 'readonly',
    'mergeObject': 'readonly',
    'duplicate': 'readonly',
    'fromUuidSync': 'readonly',
    'loadTemplates': 'readonly'
  }
};