"use client";

// app/[locale]/admin/(routes)/product-requests/_components/RequestFilters.tsx
// UI matches the manage-users filter bar exactly:
//   — Search input with spinner + clear X
//   — Select dropdowns for Status + Priority
//   — Active filter chips row
//   — Expandable date range panel
// All original router logic is preserved unchanged.

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RequestStatus } from "@prisma/client";
import type { RequestFiltersType } from "./types";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: RequestStatus | "";
  label: string;
  dot: string;
}[] = [
  { value: "", label: "All statuses", dot: "" },
  { value: "SUBMITTED", label: "Submitted", dot: "bg-blue-400" },
  { value: "IN_REVIEW", label: "In Review", dot: "bg-amber-400" },
  { value: "QUOTED", label: "Quoted", dot: "bg-violet-400" },
  { value: "APPROVED", label: "Approved", dot: "bg-emerald-400" },
  { value: "REJECTED", label: "Rejected", dot: "bg-red-400" },
  { value: "IN_PRODUCTION", label: "In Production", dot: "bg-orange-400" },
  { value: "SHIPPED", label: "Shipped", dot: "bg-cyan-400" },
  { value: "COMPLETED", label: "Completed", dot: "bg-green-400" },
];

const PRIORITY_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: "", label: "All priorities", dot: "" },
  { value: "5", label: "Critical (5)", dot: "bg-red-500" },
  { value: "4", label: "High (4)", dot: "bg-orange-400" },
  { value: "3", label: "Medium (3)", dot: "bg-yellow-400" },
  { value: "2", label: "Normal (2)", dot: "bg-blue-400" },
  { value: "1", label: "Low (1)", dot: "bg-muted-foreground" },
  { value: "0", label: "Minimal (0)", dot: "bg-muted-foreground/40" },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialFilters: RequestFiltersType;
}

export function RequestFilters({ initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state mirrors initialFilters (same pattern as manage-users)
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [status, setStatus] = useState<string>(initialFilters.status ?? "");
  const [priority, setPriority] = useState<string>(
    initialFilters.priority !== undefined
      ? String(initialFilters.priority)
      : "",
  );
  const [dateFrom, setDateFrom] = useState(
    initialFilters.createdAtFrom
      ? new Date(initialFilters.createdAtFrom).toISOString().slice(0, 10)
      : "",
  );
  const [dateTo, setDateTo] = useState(
    initialFilters.createdAtTo
      ? new Date(initialFilters.createdAtTo).toISOString().slice(0, 10)
      : "",
  );
  const [showDates, setShowDates] = useState(false);

  // ── Push to URL (same logic as original) ──────────────────────────────────
  const push = (
    overrides: Partial<{
      search: string;
      status: string;
      priority: string;
      dateFrom: string;
      dateTo: string;
    }> = {},
  ) => {
    const merged = { search, status, priority, dateFrom, dateTo, ...overrides };
    const p = new URLSearchParams(params);
    p.set("page", "1");
    merged.search ? p.set("search", merged.search) : p.delete("search");
    merged.status ? p.set("status", merged.status) : p.delete("status");
    merged.priority ? p.set("priority", merged.priority) : p.delete("priority");
    merged.dateFrom
      ? p.set("createdAtFrom", merged.dateFrom)
      : p.delete("createdAtFrom");
    merged.dateTo
      ? p.set("createdAtTo", merged.dateTo)
      : p.delete("createdAtTo");
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  };

  // ── Debounced search (same as manage-users) ───────────────────────────────
  const debRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => push({ search: val }), 400);
  };

  const onStatusChange = (val: string) => {
    setStatus(val);
    push({ status: val });
  };
  const onPriorityChange = (val: string) => {
    setPriority(val);
    push({ priority: val });
  };
  const handleDates = () => push();

  const resetAll = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => router.push(pathname));
  };

  // Active filter count
  const activeCount = [search, status, priority, dateFrom, dateTo].filter(
    Boolean,
  ).length;

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status);
  const priorityLabel = PRIORITY_OPTIONS.find((o) => o.value === priority);

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <div className="px-4 pt-3.5 pb-3 space-y-2.5">
        {/* ── Row 1: search + selects + count/refresh ──────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            {isPending && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[#7b57fc] border-t-transparent animate-spin" />
            )}
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by client, description, link…"
              className="pl-8 pr-7 h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
            />
            {search && !isPending && (
              <Button
                variant={"ghost"}
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={11} />
              </Button>
            )}
          </div>

          {/* Status select */}
          <Select
            value={status || "_all"}
            onValueChange={(v) => onStatusChange(v === "_all" ? "" : v)}
          >
            <SelectTrigger
              className={cn(
                "w-36 h-8 text-xs bg-muted/40 border-border/50 rounded-lg",
                status ? "border-[#7b57fc]/40 text-[#7b57fc]" : "",
              )}
            >
              <SelectValue>
                {status && statusLabel?.dot ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        statusLabel.dot,
                      )}
                    />
                    {statusLabel.label}
                  </span>
                ) : (
                  "All statuses"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl">
              <SelectItem value="_all" className="text-xs">
                All statuses
              </SelectItem>
              {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full shrink-0", o.dot)}
                    />
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority select */}
          <Select
            value={priority || "_all"}
            onValueChange={(v) => onPriorityChange(v === "_all" ? "" : v)}
          >
            <SelectTrigger
              className={cn(
                "w-36 h-8 text-xs bg-muted/40 border-border/50 rounded-lg",
                priority ? "border-[#7b57fc]/40 text-[#7b57fc]" : "",
              )}
            >
              <SelectValue>
                {priority && priorityLabel?.dot ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        priorityLabel.dot,
                      )}
                    />
                    {priorityLabel.label}
                  </span>
                ) : (
                  "All priorities"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl">
              <SelectItem value="_all" className="text-xs">
                All priorities
              </SelectItem>
              {PRIORITY_OPTIONS.filter((o) => o.value).map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full shrink-0", o.dot)}
                    />
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date toggle */}
          <button
            type="button"
            onClick={() => setShowDates((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-all",
              showDates || dateFrom || dateTo
                ? "border-[#7b57fc]/40 text-[#7b57fc] bg-[#7b57fc]/8"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <Calendar size={12} />
            Dates
            {(dateFrom || dateTo) && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#7b57fc]" />
            )}
          </button>

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-red-500 hover:border-red-400/40 transition-all"
              title="Clear all filters"
            >
              <X size={13} />
            </button>
          )}

          {/* Count + refresh */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
              {/* count rendered by parent page */}
            </span>
            <button
              type="button"
              title="Refresh"
              onClick={() => startTransition(() => router.refresh())}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw
                size={11}
                className={isPending ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* ── Date range panel ─────────────────────────────────────── */}
        {showDates && (
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/40">
            <span className="text-xs text-muted-foreground">
              Created between:
            </span>
            <div className="relative">
              <Calendar
                size={11}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-7 w-36 h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
              />
            </div>
            <span className="text-xs text-muted-foreground">and</span>
            <div className="relative">
              <Calendar
                size={11}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-7 w-36 h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
              />
            </div>
            <button
              type="button"
              onClick={handleDates}
              className="h-8 px-3 text-xs font-medium rounded-lg bg-[#7b57fc] hover:bg-[#6a48e8] text-white transition-colors"
            >
              Apply
            </button>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  push({ dateFrom: "", dateTo: "" });
                }}
                className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <X size={11} /> Clear dates
              </button>
            )}
          </div>
        )}

        {/* ── Active filter chips (manage-users style) ─────────────── */}
        {activeCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <SlidersHorizontal
              size={12}
              className="text-muted-foreground shrink-0"
            />

            {status && statusLabel && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    statusLabel.dot,
                  )}
                />
                {statusLabel.label}
                <Button
                  variant={"ghost"}
                  type="button"
                  onClick={() => onStatusChange("")}
                >
                  <X size={9} />
                </Button>
              </span>
            )}

            {priority && priorityLabel && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    priorityLabel.dot,
                  )}
                />
                {priorityLabel.label}
                <Button
                  variant={"ghost"}
                  type="button"
                  onClick={() => onPriorityChange("")}
                >
                  <X size={9} />
                </Button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                "{search}"
                <Button
                  variant={"ghost"}
                  type="button"
                  onClick={() => onSearchChange("")}
                >
                  <X size={9} />
                </Button>
              </span>
            )}

            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] ring-1 ring-[#7b57fc]/20">
                <Calendar size={9} />
                {dateFrom || "…"} → {dateTo || "…"}
                <Button
                  variant={"ghost"}
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    push({ dateFrom: "", dateTo: "" });
                  }}
                >
                  <X size={9} />
                </Button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
