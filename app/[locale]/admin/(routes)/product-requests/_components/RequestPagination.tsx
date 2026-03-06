"use client";

// app/[locale]/admin/(routes)/product-requests/_components/RequestPagination.tsx
// Logic is identical to the original. UI redesigned to match admin design system.

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationInfo, RequestFiltersType } from "./types";
import { Button } from "@/components/ui/button";

interface Props {
  pagination: PaginationInfo;
  filters: RequestFiltersType;
}

export function RequestPagination({ pagination, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { page, totalPages, totalCount, pageSize } = pagination;

  // Identical to original
  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  // Identical to original renderPageNumbers logic
  const renderPageNumbers = () => {
    const items: React.ReactNode[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 2) {
      items.unshift(
        <PageBtn key="s-ell" label="…" onClick={() => {}} disabled />,
        <PageBtn key={1} label="1" onClick={() => goToPage(1)} />,
      );
    } else if (start === 2) {
      items.unshift(<PageBtn key={1} label="1" onClick={() => goToPage(1)} />);
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PageBtn
          key={i}
          label={String(i)}
          active={i === page}
          onClick={() => goToPage(i)}
        />,
      );
    }

    if (end < totalPages - 1) {
      items.push(
        <PageBtn key="e-ell" label="…" onClick={() => {}} disabled />,
        <PageBtn
          key={totalPages}
          label={String(totalPages)}
          onClick={() => goToPage(totalPages)}
        />,
      );
    } else if (end === totalPages - 1) {
      items.push(
        <PageBtn
          key={totalPages}
          label={String(totalPages)}
          onClick={() => goToPage(totalPages)}
        />,
      );
    }

    return items;
  };

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-border/50 bg-card">
      {/* Range label */}
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {totalCount.toLocaleString()}
        </span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <Button
          variant={"ghost"}
          type="button"
          onClick={() => {
            if (page > 1) goToPage(page - 1);
          }}
          disabled={page <= 1 || isPending}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all",
            page > 1 && !isPending
              ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
              : "border-border/30 opacity-40 cursor-not-allowed",
          )}
        >
          <ChevronLeft size={14} />
        </Button>

        {/* Page numbers — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {renderPageNumbers()}
        </div>

        {/* Mobile: current / total */}
        <span className="sm:hidden text-xs text-muted-foreground px-2 tabular-nums">
          {page} / {totalPages}
        </span>

        {/* Next */}
        <Button
          variant={"ghost"}
          type="button"
          onClick={() => {
            if (page < totalPages) goToPage(page + 1);
          }}
          disabled={page >= totalPages || isPending}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all",
            page < totalPages && !isPending
              ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
              : "border-border/30 opacity-40 cursor-not-allowed",
          )}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function PageBtn({
  label,
  onClick,
  active,
  disabled,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 min-w-8 px-2 items-center justify-center rounded-lg border text-xs font-medium transition-all tabular-nums",
        active
          ? "border-[#7b57fc]/40 bg-[#7b57fc]/10 text-[#7b57fc]"
          : disabled
            ? "border-transparent text-muted-foreground/40 cursor-default"
            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/40",
      )}
    >
      {label}
    </button>
  );
}
