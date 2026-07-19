// app/sitemap.ts

export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllProductSlugsForSitemap } from "@/app/[locale]/(pages)/products/actions";
import { getAllServiceIdsForSitemap } from "@/app/[locale]/(pages)/services/actions";
import { getAllPublicSlugs } from "@/app/[locale]/(pages)/blogs/actions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://jahez.online";

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/products", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/products/request", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/services", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/services/request", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/blogs", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/bookings", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/track", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  routing.locales.forEach((locale) => {
    staticPages.forEach((page) => {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    });
  });

  // Dynamic Products
  // Every product uses a single slug shared across locales — only the
  // `/{locale}/` prefix changes, falling back to the raw `id` for any
  // legacy records that were never backfilled with a slug.
  try {
    const products = await getAllProductSlugsForSitemap();

    products.forEach((product) => {
      const slug = product.slug || product.id;

      routing.locales.forEach((locale) => {
        entries.push({
          url: `${baseUrl}/${locale}/products/${slug}`,
          lastModified: product.updatedAt ?? new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    });
  } catch (error) {
    console.error("Sitemap: Failed to fetch product slugs", error);
  }

  // Dynamic Services
  try {
    const services = await getAllServiceIdsForSitemap();

    services.forEach((service) => {
      routing.locales.forEach((locale) => {
        entries.push({
          url: `${baseUrl}/${locale}/services/${service.id}`,
          lastModified: service.updatedAt ?? new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
        // Service-specific request pages — high-value lead gen URLs
        entries.push({
          url: `${baseUrl}/${locale}/services/${service.id}/request`,
          lastModified: service.updatedAt ?? new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      });
    });
  } catch (error) {
    console.error("Sitemap: Failed to fetch service IDs", error);
  }

  // Dynamic Blog Posts
  try {
    const postsResult = await getAllPublicSlugs();

    if (postsResult.success) {
      postsResult.data.forEach((post) => {
        entries.push({
          url: `${baseUrl}/en/blogs/${post.slugEn}`,
          lastModified: post.updatedAt ?? new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });

        if (post.slugAr) {
          entries.push({
            url: `${baseUrl}/ar/blogs/${post.slugAr}`,
            lastModified: post.updatedAt ?? new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }
  } catch (error) {
    console.error("Sitemap: Failed to fetch blog slugs", error);
  }

  return entries;
}