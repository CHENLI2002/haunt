/** @type {import('next').NextConfig} */
const nextConfig = {
  // Shared workspace packages ship as TS source — let Next transpile them.
  transpilePackages: ["@haunt/types", "@haunt/db", "@haunt/ui"],
  experimental: { typedRoutes: true },
};

export default nextConfig;
