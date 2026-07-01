// app/[locale]/(pages)/products/_components/TrendingProductsSection.tsx

import { getTrendingProducts, getPublicProductCategories } from "../../(pages)/products/actions";
import TrendingProductsClient from "../../(pages)/products/_components/TrendingProductsClient";

export async function TrendingProductsSection() {
  const [products, categories] = await Promise.all([
    getTrendingProducts(20),
    getPublicProductCategories(),
  ]);

  return (
    <TrendingProductsClient
      initialProducts={products}
      initialCategories={categories}
    />
  );
}