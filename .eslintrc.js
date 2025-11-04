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
    sourceType: 'module'
  },
  rules: {
    // Erreurs critiques - toujours actives
    'no-unused-vars': ['error', { 
      'vars': 'all',
      'args': 'none',
      'ignoreRestSiblings': true 
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-redeclare': 'error',
    
    // Bonnes pratiques - warnings pour amélioration progressive
    'no-console': 'warn',
    'prefer-const': 'warn',
    'no-var': 'warn',
    
    // Style - auto-fixable, warnings seulement
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single', { 'avoidEscape': true }],
    'indent': ['warn', 2, { 'SwitchCase': 1 }],
    'comma-dangle': ['warn', 'never'],
    'space-before-function-paren': ['warn', 'never'],
    'eol-last': ['warn', 'always'],
    'no-trailing-spaces': 'warn',
    'no-multiple-empty-lines': ['warn', { 'max': 2 }]
  },
  globals: {
    'game': 'readonly',
    'canvas': 'readonly',
    'CONFIG': 'readonly',
    'CONST': 'readonly',
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
    'fromUuid': 'readonly',
    'loadTemplates': 'readonly',
    'renderTemplate': 'readonly',
    'getProperty': 'readonly',
    'setProperty': 'readonly',
    'hasProperty': 'readonly',
    'isNewerVersion': 'readonly',
    'AudioHelper': 'readonly',
    'Handlebars': 'readonly',
    '$': 'readonly'
  }
};