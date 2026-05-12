// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 100],

    localPatterns: [
      // ✅ Catch-all for ALL local public folder images
      // (covers /logo/, /icons/, /images/, etc.)
      { pathname: "/**", search: "" },

      // ✅ Kept for explicitness, but the wildcard above already covers these
      { pathname: "/uploads/blog/**", search: "" },
      { pathname: "/uploads/client-requests/**", search: "" },
      { pathname: "/uploads/consulting-services/**", search: "" },
      { pathname: "/uploads/requests/**", search: "" },
      { pathname: "/uploads/products/**", search: "" },
    ],

    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],

    minimumCacheTTL: 60,
  },
};

export default withNextIntl(nextConfig);