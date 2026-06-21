/**
 * Next.js configuration.
 *
 * Notes:
 *  • `reactStrictMode: true` — surface bad-side-effect patterns early.
 *  • `experimental.optimizePackageImports` for our workspace packages so
 *    only what's used ends up in the client bundle.
 *  • `eslint.ignoreDuringBuilds: false` — lint is a CI/build gate, not an
 *    afterthought (the foundation rule).
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // NOTE: `optimizePackageImports` was disabled in Sprint 2 — the barrel
  // optimizer mis-resolves transitive workspace imports (it tries to load
  // `@bookhelper/design-tokens` from `@bookhelper/ui`'s nested
  // node_modules, which has no `import` entry on the `"."` exports map).
  // Bundle savings here are negligible (the package is small) and the rest
  // of the workspace already lists `transpilePackages` for correct linkage.
  transpilePackages: [
    "@bookhelper/ui",
    "@bookhelper/design-tokens",
    "@bookhelper/api-contracts",
    "@bookhelper/telemetry",
    "@bookhelper/reader-core",
    "@bookhelper/render-engine",
    "@bookhelper/pdf-adapter",
    "@bookhelper/reader-ui",
  ],
  webpack(config, { isServer }) {
    // pdfjs-dist (used by @bookhelper/pdf-adapter in the client Reader)
    // lazily references the optional Node `canvas` package on its
    // server-rendering path, which we never hit (text extraction only).
    // Alias it to `false` so the client bundle doesn't try to resolve it.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, canvas: false };
    }
    return config;
  },
  async headers() {
    // Conservative defaults; tightened per route as auth/storage land.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
