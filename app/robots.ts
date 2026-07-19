// app/robots.ts

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/sign-in/",
          "/sign-up/",
        ],
      },
    ],
    sitemap: "https://jahez.online/sitemap.xml",
  };
}