import { defineConfig } from "tsup";

/**
 * UI bundle config.
 *
 * Why the banner: every primitive in this package is a Client Component
 * (uses `useState` / `createContext`). tsup strips the `"use client"`
 * directive from individual source files during bundling, so we re-emit it
 * at the top of the output. Without this, Next 15 RSC imports the bundle
 * server-side and crashes with "createContext is not a function".
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
  banner: { js: '"use client";' },
});
