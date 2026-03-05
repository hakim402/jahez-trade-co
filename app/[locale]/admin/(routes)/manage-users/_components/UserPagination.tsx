'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface UserPaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNext: () => void;
  onPrevious: () => void;
  isPending: boolean;
  total: number;
}

export function UserPagination({
  hasNextPage,
  hasPreviousPage,
  onNext,
  onPrevious,
  isPending,
  total,
}: UserPaginationProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-sm text-muted-foreground">
        Total <span className="font-semibold text-foreground">{total.toLocaleString()}</span> users
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPreviousPage || isPending}
          className="gap-1"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNextPage || isPending}
          className="gap-1"
        >
          Next
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}