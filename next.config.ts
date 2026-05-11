import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ── Existing patterns ────────────────────────────────────────────
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      // ── Allow any external https/http image URL ───────────────────────
      // Fixes 400 on vecteezy.com, CDNs, and any pasted image link.
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],

    // ── Allow locally-uploaded images from /uploads/ ──────────────────
    // Fixes 400 on /_next/image?url=%2Fuploads%2Fblog%2F...
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],

    // ── Support w=3840 requests (fixes 400 on large images) ──────────
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default withNextIntl(nextConfig);