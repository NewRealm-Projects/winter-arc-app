import next from 'eslint-config-next';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.vercel/**',
    ],
  },
  ...next,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
