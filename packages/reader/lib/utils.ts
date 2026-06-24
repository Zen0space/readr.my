import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn-style `cn` helper. Composes `clsx` (conditional className)
 * with `tailwind-merge` (dedupes conflicting Tailwind utilities).
 *
 * Used by the new shadcn primitive files in `components/ui/`. Existing
 * components that import `cn` from `@/lib/cn` continue to work — `cn.ts`
 * is unchanged; nothing here is re-exported to avoid duplicate exports.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));