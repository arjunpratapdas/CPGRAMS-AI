/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Vercel-specific optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "motion/react"],
  },
  
  // Image optimization
  images: {
    unoptimized: false,
    domains: [],
  },
  
  // Performance
  swcMinify: true,
  
  // Output
  output: "standalone",
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
