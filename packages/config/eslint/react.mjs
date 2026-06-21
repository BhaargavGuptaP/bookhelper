// @ts-check
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import { base } from "./base.mjs";

/**
 * ESLint (flat) config for React / Next.js code.
 * Layers React Hooks rules and jsx-a11y (accessibility is a release gate —
 * UX-SPECIFICATION §12) on top of the base config.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const react = [
  ...base,
  {
    files: ["**/*.{ts,tsx,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Accessibility: enforce the jsx-a11y recommended ruleset.
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
];

export default react;
