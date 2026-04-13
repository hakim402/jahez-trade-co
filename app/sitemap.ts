// app/sitemap.ts
import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllProductIdsForSitemap } from "@/app/[locale]/(pages)/products/actions";
import { getAllServiceIdsForSitemap } from "@/app/[locale]/(pages)/services/actions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://jahez.online";

  const staticPages = [
    { path: "", priority: 1.0, changeFreq: "daily" as const },
    { path: "/about", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/products", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/services", priority: 0.9, changeFreq: "weekly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  routing.locales.forEach((locale) => {
    staticPages.forEach(({ path, priority, changeFreq }) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: changeFreq,
        priority,
      });
    });
  });

  // Dynamic Products
  try {
    const products = await getAllProductIdsForSitemap();
    products.forEach((product) => {
      routing.locales.forEach((locale) => {
        entries.push({
          url: `${baseUrl}/${locale}/product/${product.id}`,
          lastModified: product.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    });
  } catch (error) {
    console.error("Sitemap: Failed to fetch product IDs", error);
  }

  // Dynamic Services
  try {
    const services = await getAllServiceIdsForSitemap();
    services.forEach((service) => {
      routing.locales.forEach((locale) => {
        entries.push({
          url: `${baseUrl}/${locale}/services/${service.id}`,
          lastModified: service.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      });
    });
  } catch (error) {
    console.error("Sitemap: Failed to fetch service IDs", error);
  }

  return entries;
}