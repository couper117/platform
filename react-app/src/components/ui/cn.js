import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names safely (clsx for conditionals + twMerge for conflicts).
 */
export const cn = (...inputs) => twMerge(clsx(inputs));

export default cn;
