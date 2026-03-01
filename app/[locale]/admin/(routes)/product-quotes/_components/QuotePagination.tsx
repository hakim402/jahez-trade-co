// app/[locale]/admin/product-quotes/_components/QuotePagination.tsx
'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface QuotePaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNext: () => void;
  onPrevious: () => void;
  isPending: boolean;
  total: number;
  currentPage: number | 'custom';
}

export function QuotePagination({
  hasNextPage,
  hasPreviousPage,
  onNext,
  onPrevious,
  isPending,
  total,
  currentPage,
}: QuotePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Total <span className="font-medium">{total}</span> quotes
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPreviousPage || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronLeft className="h-4 w-4" />}
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNextPage || isPending}>
          Next
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}