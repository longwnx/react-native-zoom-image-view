module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@react-native', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
    'react-hooks/exhaustive-deps': 'error',
    'prettier/prettier': [
      'error',
      {
        quoteProps: 'consistent',
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        useTabs: false,
        allow: ['warn', 'error'],
      },
    ],
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
