/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/montages/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://localhost:3000/api/montages/:path*" // In dev, proxy through API
            : "http://localhost:3000/api/montages/:path*", // Configure based on production setup
      },
    ];
  },
  // Example to serve montages directory outside of Next.js - adjust paths as needed
  // experimental: {
  //   outputFileTracingIncludes: {
  //     '/**': ['../../data/montages/**/*']
  //   }
  // }
};

export default nextConfig;
