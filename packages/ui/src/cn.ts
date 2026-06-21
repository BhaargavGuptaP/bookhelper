import { clsx, type ClassValue } from "clsx";

/**
 * `cn` — class-name composer.
 *
 * Thin wrapper over clsx so we have a single, importable name across the
 * codebase. We deliberately do NOT mix tailwind-merge here: Atlas uses CSS
 * variables + scoped classes, so semantic collisions are rare and explicit.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
