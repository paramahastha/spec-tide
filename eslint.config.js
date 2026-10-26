import tsParser from '@typescript-eslint/parser';
export default [
  { ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '**/*.min.js'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: { 'no-constant-condition': 'error' },
  },
];
