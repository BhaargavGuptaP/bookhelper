import { defineConfig } from "tsup";

/**
 * Reader-UI bundle config.
 *
 * Like `@bookhelper/ui`, every export here is a Client Component (it uses
 * `useState` / `useSyncExternalStore` / DOM refs). tsup strips per-file
 * `"use client"` directives during bundling, so we re-emit one at the top
 * of the output — without it, Next 15 RSC tries to render these on the
 * server and crashes. CSS ships as a separate `./styles.css` export, not
 * bundled, so apps load it in their global layer.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
  banner: { js: '"use client";' },
});
