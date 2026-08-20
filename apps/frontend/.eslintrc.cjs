/* ESLint config for the RwaSport frontend.
 *
 * Legacy (.eslintrc) format on purpose: the lint script uses `--ext`, which the
 * flat config ignores. Pairs with ESLint 8 + @typescript-eslint 7.
 *
 * Philosophy matches tsconfig: pragmatic, gradual. TypeScript (via `npm run
 * typecheck`) owns type correctness, so type-ish lint rules are off here to
 * avoid two tools reporting the same thing. This gate catches real bug classes
 * — hook violations, unreachable code, accidental globals — not style. */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // The two rules worth failing a build over.
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript owns these; ESLint double-reporting them is just noise.
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',

    // The codebase deliberately leans on `any` during the gradual TS adoption.
    '@typescript-eslint/no-explicit-any': 'off',

    // Keep genuinely-useful correctness rules, relaxed where they over-fire.
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-constant-condition': ['error', { checkLoops: false }],
    'react/no-unescaped-entities': 'off',
    // A handful of screens set the low-level `fetchpriority` image hint in its
    // lowercase HTML form on purpose (React 18 only knows the camelCase form).
    'react/no-unknown-property': ['error', { ignore: ['fetchpriority'] }],
    // Off: several files intentionally co-export a component with a small helper
    // (MatchRow + pickFeatured, Badge + LiveBadge). Fast-refresh granularity is
    // not worth splitting those files, and it never fails a real build.
    'react-refresh/only-export-components': 'off',
  },
  ignorePatterns: ['dist', 'dev-dist', 'node_modules', '*.config.js', '*.config.ts', 'public'],
};
