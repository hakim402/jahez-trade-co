// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 100],

    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/uploads/blog/**", search: "" },
      { pathname: "/uploads/client-requests/**", search: "" },
      { pathname: "/uploads/consulting-services/**", search: "" },
      { pathname: "/uploads/requests/**", search: "" },
      { pathname: "/uploads/products/**", search: "" },
      { pathname: "/uploads/shipments/**", search: "" },
    ],

    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],

    minimumCacheTTL: 60,
  },
};

export default withNextIntl(nextConfig);