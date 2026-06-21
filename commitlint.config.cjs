/**
 * Conventional Commits, scoped to our domains/packages so history maps to the
 * Feature Specification taxonomy (FEATURE-SPECIFICATION.md §1).
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      1,
      "always",
      [
        "repo",
        "config",
        "tokens",
        "ui",
        "telemetry",
        "contracts",
        "web",
        "core-api",
        "auth",
        "db",
        "storage",
        "ci",
        "deps",
      ],
    ],
    "body-max-line-length": [0, "always"],
  },
};
