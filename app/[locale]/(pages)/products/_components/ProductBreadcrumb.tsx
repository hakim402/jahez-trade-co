// app/[locale]/(pages)/products/_components/product-breadcrumb.tsx

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ProductBreadcrumbProps {
  locale: string;
  productName: string;
  isAr: boolean;
}

export function ProductBreadcrumb({
  locale,
  productName,
  isAr,
}: ProductBreadcrumbProps) {
  return (
    <nav
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      dir={isAr ? "rtl" : "ltr"}
    >
      <Link
        href={`/${locale}`}
        className="hover:text-foreground transition-colors"
      >
        {isAr ? "الرئيسية" : "Home"}
      </Link>
      <ChevronRight className="w-3 h-3 opacity-40" />
      <Link
        href={`/${locale}/products`}
        className="hover:text-foreground transition-colors"
      >
        {isAr ? "المنتجات" : "Products"}
      </Link>
      <ChevronRight className="w-3 h-3 opacity-40" />
      <span className="text-foreground font-medium truncate max-w-40">
        {productName}
      </span>
    </nav>
  );
}
