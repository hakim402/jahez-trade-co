"use client";

// app/[locale]/admin/(routes)/product-requests/_components/RequestsPageClient.tsx
// Logic is identical to the original. UI enhanced with empty state + card wrapper.

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Package } from "lucide-react";
import { RequestsTable } from "./RequestsTable";
import { RequestPagination } from "./RequestPagination";
import type {
  RequestWithRelations,
  PaginationInfo,
  RequestFiltersType,
} from "./types";

interface Props {
  initialRequests: RequestWithRelations[];
  initialPagination: PaginationInfo;
  filters: RequestFiltersType;
}

export function RequestsPageClient({
  initialRequests,
  initialPagination,
  filters,
}: Props) {
  const router = useRouter();
  const handleRefresh = () => router.refresh();

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Count bar */}
      <div className="flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {initialRequests.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {initialPagination.totalCount.toLocaleString()}
          </span>{" "}
          requests
        </p>
      </div>

      {/* Table or empty state */}
      {initialRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20 rounded-2xl border border-border/50 bg-card">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50"
          >
            <Package size={26} className="text-muted-foreground/40" />
          </motion.div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground/70">
              No requests found
            </p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      ) : (
        <RequestsTable
          requests={initialRequests}
          onActionComplete={handleRefresh}
        />
      )}

      {/* Pagination */}
      {initialPagination.totalPages > 1 && (
        <div className="shrink-0">
          <RequestPagination pagination={initialPagination} filters={filters} />
        </div>
      )}
    </div>
  );
}
