module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Reglas más permisivas para nuestro código modular
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'warn', // Cambiado de 'error' a 'warn'
    'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true }],
    'class-methods-use-this': 'off', // Desactivado para métodos estáticos
    'no-restricted-syntax': 'off', // Desactivado para for...of loops
    'no-await-in-loop': 'off', // Desactivado para operaciones async en loops
    'no-restricted-globals': 'off', // Desactivado para isNaN
    'func-names': 'off', // Desactivado para funciones anónimas
    'prefer-rest-params': 'off', // Desactivado para arguments
    'no-return-assign': 'off', // Desactivado para asignaciones en return
    'consistent-return': 'off', // Desactivado para funciones que no siempre retornan
    'no-alert': 'off', // Desactivado para alert() como fallback
    'prefer-const': 'warn',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-useless-constructor': 'error',
    'no-unused-expressions': 'error',
    'no-useless-return': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-param-reassign': 'off', // Desactivado para mutaciones de parámetros
  },
  overrides: [
    {
      files: ['*.html'],
      env: {
        browser: true,
      },
    },
  ],
  globals: {
    // Definir variables globales que usamos
    firebase: 'readonly',
    FullCalendar: 'readonly',
    Swal: 'readonly',
    lucide: 'readonly',
  },
};
