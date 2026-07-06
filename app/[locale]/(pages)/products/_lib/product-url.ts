// app/[locale]/(pages)/products/_lib/product-url.ts

// Plain utility (NOT a server action file) — safe to import from client
// components, server components, and server actions alike.

export type ProductSlugFields = {
  id: string;
  slug?: string | null;
};

/**
 * Resolves the slug segment for a product. Falls back to the raw `id` for
 * legacy records that predate the slug field (or any already shared/indexed
 * links using the old `/products/{id}` format). There is a single slug per
 * product — it's reused for every locale, only the `/{locale}/` prefix changes.
 */
export function getProductSlug(product: ProductSlugFields): string {
  return product.slug ?? product.id;
}

/**
 * Builds the full `/{locale}/products/{slug}` path for a product.
 */
export function getProductHref(
  product: ProductSlugFields,
  locale: string,
): string {
  return `/${locale}/products/${getProductSlug(product)}`;
}