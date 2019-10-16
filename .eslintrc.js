const prettierConfig = require('./.prettierrc.js')

module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true,
    },
    ecmaVersion: 2018,
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'no-useless-escape': 'off',
    'no-console': 'off',
    'prettier/prettier': ['error', prettierConfig],
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
}
