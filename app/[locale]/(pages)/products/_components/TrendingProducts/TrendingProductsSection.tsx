// app/[locale]/(pages)/products/_components/TrendingProductsSection.tsx

import { getTrendingProducts, getPublicProductCategories } from "../../actions";
import TrendingProductsClient from "./TrendingProductsClient";

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