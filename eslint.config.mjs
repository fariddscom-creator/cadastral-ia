import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/.*',
      '**/*.d.ts',
      'app/api/dashboard/export-data.js',
      'next.config.*.ts',
      'typescript.test.ts',
    ],
  },
  js.configs.recommended,
  ...nextVitals,
  {
    rules: {
      '@next/next/no-page-custom-font': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'react/no-unescaped-entities': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
];
