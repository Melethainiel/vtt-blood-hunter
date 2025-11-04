const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Foundry VTT globals
        game: 'readonly',
        canvas: 'readonly',
        CONFIG: 'readonly',
        CONST: 'readonly',
        Hooks: 'readonly',
        foundry: 'readonly',
        Actor: 'readonly',
        Item: 'readonly',
        Macro: 'readonly',
        ChatMessage: 'readonly',
        Roll: 'readonly',
        Token: 'readonly',
        TokenDocument: 'readonly',
        ActiveEffect: 'readonly',
        ui: 'readonly',
        Dialog: 'readonly',
        mergeObject: 'readonly',
        duplicate: 'readonly',
        fromUuidSync: 'readonly',
        fromUuid: 'readonly',
        loadTemplates: 'readonly',
        renderTemplate: 'readonly',
        getProperty: 'readonly',
        setProperty: 'readonly',
        hasProperty: 'readonly',
        isNewerVersion: 'readonly',
        AudioHelper: 'readonly',
        Handlebars: 'readonly',
        $: 'readonly'
      }
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
    files: ['scripts/**/*.js']
  },
  {
    // Configuration pour les scripts de build Node.js (*.mjs)
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { 
        'vars': 'all',
        'args': 'none',
        'ignoreRestSiblings': true 
      }],
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { 'avoidEscape': true }],
      'indent': ['warn', 2]
    },
    files: ['scripts/**/*.mjs']
  }
];
