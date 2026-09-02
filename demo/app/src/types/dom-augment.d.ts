import 'react';

// A couple of screens set the low-level `fetchpriority` image hint in its
// lowercase HTML form on purpose — React 18's DOM typings only know the
// camelCase `fetchPriority`, so the lowercase attribute trips the type checker.
// Declaring it here keeps those intentional usages type-safe.
declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}
