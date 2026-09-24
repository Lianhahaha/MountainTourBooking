import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Hike album photos are admin-entered and can come from any host;
        // previously only Unsplash was allowed, which broke custom image URLs.
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
