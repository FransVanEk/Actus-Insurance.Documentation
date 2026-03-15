import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Ensure the docs folder (markdown + assets) is included in the
  // standalone build output so the docs-assets API route can read files.
  outputFileTracingIncludes: {
    '/api/docs-assets/(.*)': ['./docs/**/*'],
  },
};

export default nextConfig;
