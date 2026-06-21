import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  // SWC preserves the `emitDecoratorMetadata` reflection needed by NestJS DI —
  // without this plugin vitest's default esbuild loader strips the metadata
  // and constructor params arrive as `undefined`.
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: "es2022",
        keepClassNames: true,
      },
    }),
  ],
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
  },
});
