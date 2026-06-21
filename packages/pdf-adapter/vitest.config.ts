import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    // pdfjs-dist is heavy to load and the legacy bundle does feature
    // detection at import time; give the first test a generous budget.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
