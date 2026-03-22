"use client";

// app/[locale]/admin/(routes)/requests/_components/RequestPageClient.tsx
// All sub-components are private — only RequestPageClient is exported.

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  MoreHorizontal,
  Loader2,
  Package,
  FileText,
  Trash2,
  Plus,
  Upload,
  DollarSign,
  TrendingUp,
  Star,
  MessageSquare,
  Ship,
  Globe,
  History,
  Eye,
  Calendar,
  Hash,
  Link2,
  Zap,
  Download,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestStatus, QuoteStatus } from "@prisma/client";
import {
  updateRequestStatus,
  updateRequestPriority,
  deleteProductRequest,
  bulkUpdateRequestStatus,
  createQuote,
  updateQuoteStatus,
  deleteQuote,
  uploadFile,
  deleteFile,
  generateAIQuote,
  createShippingEstimateForRequest,
  getProductRequest,
} from "../actions";
import type { SerializedShippingEstimate } from "../actions";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

type RequestFile = {
  id: string;
  url: string;
  fileType: string;
  fileName: string | null;
  fileSize: number | null;
  requestId: string | null;
  quoteId: string | null;
  uploadedById: string | null;
  createdAt: string;
};

type SerializedQuote = {
  id: string;
  requestId: string;
  createdById: string;
  price: number;
  currency: string;
  status: QuoteStatus;
  validUntil: string | null;
  revision: number;
  adminNotes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; email: string; fullName: string | null };
  files: RequestFile[];
  statusHistory: Array<{
    id: string;
    oldStatus: QuoteStatus;
    newStatus: QuoteStatus;
    changedAt: string;
    changedBy: { id: string; email: string; fullName: string | null };
  }>;
};

type StatusHistoryEntry = {
  id: string;
  requestId: string;
  oldStatus: RequestStatus;
  newStatus: RequestStatus;
  changedAt: string;
  changedBy: { id: string; email: string; fullName: string | null };
};

type AISuggestion = {
  id: string;
  requestId: string;
  estimatedPrice: number;
  currency: string;
  confidence: number | null;
  createdAt: string;
};

export type SerializedRequest = {
  id: string;
  clientId: string;
  productLink: string | null;
  description: string | null;
  quantity: number;
  shippingCountry: string;
  customNotes: string | null;
  status: RequestStatus;
  priority: number;
  acceptedQuoteId: string | null;
  aiEstimatedPrice: number | null;
  aiConfidence: number | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    phone: string | null;
  };
  files: RequestFile[];
  quotes: SerializedQuote[];
  statusHistory: StatusHistoryEntry[];
  aiSuggestions: AISuggestion[];
  acceptedQuote: SerializedQuote | null;
  shippingEstimate?: SerializedShippingEstimate | null;
  _count: { quotes: number; files: number };
};

// ─────────────────────────────────────────────────────────────────────────────
// Config maps
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  SUBMITTED: {
    label: "Submitted",
    dot: "bg-blue-500",
    ring: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
  },
  IN_REVIEW: {
    label: "In Review",
    dot: "bg-amber-500",
    ring: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
  },
  QUOTED: {
    label: "Quoted",
    dot: "bg-violet-500",
    ring: "bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400",
  },
  APPROVED: {
    label: "Approved",
    dot: "bg-emerald-500",
    ring: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-500",
    ring: "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400",
  },
  IN_PRODUCTION: {
    label: "In Production",
    dot: "bg-orange-500",
    ring: "bg-orange-500/10 border-orange-500/25 text-orange-600 dark:text-orange-400",
  },
  SHIPPED: {
    label: "Shipped",
    dot: "bg-sky-500",
    ring: "bg-sky-500/10 border-sky-500/25 text-sky-600 dark:text-sky-400",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-green-500",
    ring: "bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400",
  },
} as const satisfies Record<
  RequestStatus,
  { label: string; dot: string; ring: string }
>;

const QS = {
  DRAFT: { label: "Draft", cls: "bg-muted/50 text-muted-foreground" },
  SENT: {
    label: "Sent",
    cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  ACCEPTED: {
    label: "Accepted",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: { label: "Rejected", cls: "bg-red-500/10 text-red-500" },
} as const satisfies Record<QuoteStatus, { label: string; cls: string }>;

const PRIO = {
  0: { label: "None", dot: "bg-muted/40", text: "text-muted-foreground/40" },
  1: { label: "Low", dot: "bg-blue-400", text: "text-blue-500" },
  2: { label: "Medium", dot: "bg-yellow-400", text: "text-yellow-500" },
  3: { label: "High", dot: "bg-orange-400", text: "text-orange-500" },
  4: { label: "Urgent", dot: "bg-red-400", text: "text-red-500" },
  5: {
    label: "ASAP",
    dot: "bg-red-600 animate-pulse",
    text: "text-red-600 font-bold",
  },
} as const satisfies Record<
  number,
  { label: string; dot: string; text: string }
>;

const ALL_STATUSES = Object.keys(S) as RequestStatus[];

const STATUS_FLOW: Record<RequestStatus, RequestStatus[]> = {
  SUBMITTED: ["IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["QUOTED", "REJECTED"],
  QUOTED: ["APPROVED", "REJECTED"],
  APPROVED: ["IN_PRODUCTION"],
  REJECTED: ["SUBMITTED"],
  IN_PRODUCTION: ["SHIPPED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — Hydration-safe relative time
// formatDistanceToNow produces different output on server vs client (clock drift).
// We render a stable placeholder on SSR and replace it after mount.
// ─────────────────────────────────────────────────────────────────────────────

function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const { formatDistanceToNow: fdt } =
        require("date-fns") as typeof import("date-fns");
      setText(fdt(new Date(date), { addSuffix: true }));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date]);

  if (!text) return <span className={className} suppressHydrationWarning />;
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const c = S[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap",
        c.ring,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}

function QuoteBadge({ status }: { status: QuoteStatus }) {
  const c = QS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
        c.cls,
      )}
    >
      {c.label}
    </span>
  );
}

function PriorityDots({ value }: { value: number }) {
  const c = PRIO[value as keyof typeof PRIO] ?? PRIO[0];
  return (
    <div
      className="flex items-center gap-0.5 shrink-0"
      title={`P${value} — ${c.label}`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i < value ? c.dot : "bg-muted/40",
          )}
        />
      ))}
    </div>
  );
}

function Avatar({ client }: { client: SerializedRequest["client"] }) {
  const initials = (client.fullName ?? client.email)
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#7b57fc]/10 flex items-center justify-center text-[11px] font-bold text-[#7b57fc] shrink-0 select-none">
      {initials}
    </div>
  );
}

function Pagination({
  pagination,
  onPage,
}: {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPage: (p: number) => void;
}) {
  const { page, pageSize, totalCount, totalPages } = pagination;
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2))
      pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        Showing{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {totalCount.toLocaleString()}
        </span>
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="text-xs text-muted-foreground px-1">
              …
            </span>
          ) : (
            <Button
              key={p}
              size="icon"
              variant={p === page ? "default" : "outline"}
              className={cn(
                "h-8 w-8 rounded-xl text-xs",
                p === page
                  ? "bg-[#7b57fc] text-white border-[#7b57fc] hover:bg-[#6a48eb]"
                  : "border-border/60",
              )}
              onClick={() => onPage(p as number)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats strip
// ─────────────────────────────────────────────────────────────────────────────

function StatsStrip({
  stats,
}: {
  stats: {
    byStatus: Record<string, number>;
    submittedToday: number;
    submittedWeek: number;
    pendingQuotes: number;
    totalActive: number;
  };
}) {
  const cards = [
    {
      label: "Active",
      value: stats.totalActive,
      icon: Package,
      grad: "from-[#7b57fc] to-[#2b1cff]",
      sh: "shadow-[#7b57fc]/20",
    },
    {
      label: "New Today",
      value: stats.submittedToday,
      icon: Calendar,
      grad: "from-amber-400 to-orange-500",
      sh: "shadow-amber-500/20",
    },
    {
      label: "This Week",
      value: stats.submittedWeek,
      icon: TrendingUp,
      grad: "from-emerald-400 to-teal-500",
      sh: "shadow-emerald-500/20",
    },
    {
      label: "Pending Quotes",
      value: stats.pendingQuotes,
      icon: MessageSquare,
      grad: "from-pink-500 to-rose-500",
      sh: "shadow-pink-500/20",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, grad, sh }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5"
        >
          <div
            className={cn(
              "absolute -top-4 -right-4 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-linear-to-br",
              grad,
            )}
          />
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
              grad,
              sh,
            )}
          >
            <Icon size={17} className="text-white" />
          </div>
          <div className="relative">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {value.toLocaleString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter bar
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  onApply,
  isPending,
  selectedIds,
  onBulkStatus,
  onClearSelection,
}: {
  filters: {
    status?: RequestStatus;
    priority?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  onApply: (patch: Record<string, string | undefined>) => void;
  isPending: boolean;
  selectedIds: string[];
  onBulkStatus: (s: RequestStatus) => void;
  onClearSelection: () => void;
}) {
  const [val, setVal] = useState(filters.search ?? "");
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (v: string) => {
    setVal(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(
      () => onApply({ search: v || undefined, page: "1" }),
      380,
    );
  };

  const activeCount = [
    filters.status,
    filters.priority !== undefined ? 1 : null,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#7b57fc]/8 border border-[#7b57fc]/20">
            <Hash className="w-3.5 h-3.5 text-[#7b57fc]" />
            <span className="text-xs text-[#7b57fc] font-semibold">
              {selectedIds.length} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-[11px] bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 gap-1"
                >
                  Move to <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {ALL_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onBulkStatus(s)}
                    className="text-xs gap-2"
                  >
                    <span
                      className={cn("w-2 h-2 rounded-full shrink-0", S[s].dot)}
                    />{" "}
                    {S[s].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClearSelection}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-52 max-w-xs">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Input
            value={val}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search client, description…"
            className="pl-9 h-9 rounded-xl text-sm border-border/60"
          />
          {val && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleSearch("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 rounded-xl gap-1.5 text-xs border-border/60",
                filters.status &&
                  "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              {filters.status ? S[filters.status].label : "Status"}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem
              onClick={() => onApply({ status: undefined, page: "1" })}
              className="text-xs"
            >
              All statuses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {ALL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onApply({ status: s, page: "1" })}
                className="text-xs gap-2"
              >
                <span
                  className={cn("w-2 h-2 rounded-full shrink-0", S[s].dot)}
                />{" "}
                {S[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 rounded-xl gap-1.5 text-xs border-border/60",
                filters.priority !== undefined &&
                  "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
              )}
            >
              <Star className="w-3.5 h-3.5" />
              {filters.priority !== undefined
                ? `P${filters.priority} — ${PRIO[filters.priority as keyof typeof PRIO]?.label}`
                : "Priority"}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem
              onClick={() => onApply({ priority: undefined, page: "1" })}
              className="text-xs"
            >
              All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {([5, 4, 3, 2, 1, 0] as const).map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => onApply({ priority: String(p), page: "1" })}
                className={cn("text-xs", PRIO[p].text)}
              >
                {p === 0 ? "No priority" : `P${p} — ${PRIO[p].label}`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl gap-1.5 text-xs border-border/60"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {filters.sortBy === "priority"
                ? "Priority"
                : filters.sortBy === "status"
                  ? "Status"
                  : "Newest"}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem
              onClick={() =>
                onApply({ sortBy: "createdAt", sortOrder: "desc", page: "1" })
              }
              className="text-xs"
            >
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onApply({ sortBy: "createdAt", sortOrder: "asc", page: "1" })
              }
              className="text-xs"
            >
              Oldest first
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onApply({ sortBy: "priority", sortOrder: "desc", page: "1" })
              }
              className="text-xs"
            >
              Highest priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onApply({ sortBy: "status", sortOrder: "asc", page: "1" })
              }
              className="text-xs"
            >
              By status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              setVal("");
              onApply({
                status: undefined,
                priority: undefined,
                search: undefined,
                page: "1",
              });
            }}
          >
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.status && (
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  S[filters.status].dot,
                )}
              />{" "}
              {S[filters.status].label}
              <Button
                variant={"ghost"}
                onClick={() => onApply({ status: undefined, page: "1" })}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
          {filters.priority !== undefined && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              P{filters.priority}{" "}
              {PRIO[filters.priority as keyof typeof PRIO]?.label}
              <Button
                variant={"ghost"}
                onClick={() => onApply({ priority: undefined, page: "1" })}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              "{filters.search}"
              <Button
                variant={"ghost"}
                onClick={() => {
                  setVal("");
                  onApply({ search: undefined, page: "1" });
                }}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Detail Dialog
// FIX 1 — DialogTitle is ALWAYS rendered (inside VisuallyHidden when loading)
//          so Radix never fires the accessibility warning.
// ─────────────────────────────────────────────────────────────────────────────

type DialogSection = "overview" | "quotes" | "files" | "shipping" | "history";

function RequestDetailDialog({
  open,
  onClose,
  onDone,
  requestId,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  requestId: string | null;
}) {
  const [data, setData] = useState<SerializedRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<DialogSection>("overview");
  const [isPending, start] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<null | {
    estimatedPrice: string;
    currency: string;
    confidence: number;
    reasoning: string;
    suggestedNotes: string;
  }>(null);

  const [qForm, setQForm] = useState({
    price: "",
    currency: "USD",
    adminNotes: "",
    status: "DRAFT" as QuoteStatus,
    validUntil: "",
  });
  const [sForm, setSForm] = useState({
    originCountry: "CN",
    destinationCountry: "",
    weightKg: "",
    volumeCbm: "",
    freightType: "sea" as "air" | "sea",
    estimatedCost: "",
    currency: "USD",
    transitDays: "",
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !requestId) return;
    setLoading(true);
    setData(null);
    setSection("overview");
    setAiResult(null);
    setShowDelete(false);
    getProductRequest(requestId).then((r) => {
      if (r.success) setData(r.data as SerializedRequest);
      else toast.error(r.error);
      setLoading(false);
    });
  }, [open, requestId]);

  if (!requestId) return null;

  const refresh = () => {
    if (!requestId) return;
    getProductRequest(requestId).then((r) => {
      if (r.success) {
        setData(r.data as SerializedRequest);
        onDone();
      }
    });
  };

  // Actions
  const handleStatus = (s: RequestStatus) => {
    if (!data) return;
    start(async () => {
      const r = await updateRequestStatus(data.id, s);
      if (r.success) {
        toast.success(`→ ${S[s].label}`);
        refresh();
      } else toast.error(r.error);
    });
  };

  const handlePriority = (p: number) => {
    if (!data) return;
    start(async () => {
      const r = await updateRequestPriority(data.id, p);
      if (r.success) {
        toast.success(`Priority → P${p}`);
        refresh();
      } else toast.error(r.error);
    });
  };

  const handleDelete = () => {
    if (!data) return;
    start(async () => {
      const r = await deleteProductRequest(data.id);
      if (r.success) {
        toast.success("Request deleted");
        onClose();
        onDone();
      } else toast.error(r.error);
    });
  };

  const handleCreateQuote = () => {
    if (!data) return;
    start(async () => {
      const r = await createQuote({
        requestId: data.id,
        price: Number(qForm.price),
        currency: qForm.currency,
        adminNotes: qForm.adminNotes || undefined,
        status: qForm.status,
        validUntil: qForm.validUntil ? new Date(qForm.validUntil) : undefined,
      });
      if (r.success) {
        toast.success("Quote created");
        setQForm({
          price: "",
          currency: "USD",
          adminNotes: "",
          status: "DRAFT",
          validUntil: "",
        });
        refresh();
      } else toast.error(r.error);
    });
  };

  const handleQuoteStatus = (qId: string, qs: QuoteStatus) => {
    start(async () => {
      const r = await updateQuoteStatus(qId, qs);
      if (r.success) {
        toast.success(`Quote → ${QS[qs].label}`);
        refresh();
      } else toast.error(r.error);
    });
  };

  const handleDeleteQuote = (qId: string) => {
    start(async () => {
      const r = await deleteQuote(qId);
      if (r.success) {
        toast.success("Quote removed");
        refresh();
      } else toast.error(r.error);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!data) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("requestId", data.id);
    const r = await uploadFile(fd);
    setUploading(false);
    if (r.success) {
      toast.success("File uploaded");
      refresh();
    } else toast.error(r.error);
  };

  const handleDeleteFile = (fileId: string) => {
    start(async () => {
      const r = await deleteFile(fileId);
      if (r.success) {
        toast.success("File removed");
        refresh();
      } else toast.error(r.error);
    });
  };

  const handleAI = async () => {
    if (!data) return;
    setAiLoading(true);
    const r = await generateAIQuote(data.id);
    setAiLoading(false);
    if (r.success) {
      setAiResult(r.data);
      toast.success("AI estimate ready");
    } else toast.error(r.error);
  };

  const handleCreateShipping = () => {
    if (!data) return;
    start(async () => {
      const r = await createShippingEstimateForRequest({
        requestId: data.id,
        originCountry: sForm.originCountry,
        destinationCountry: sForm.destinationCountry || data.shippingCountry,
        weightKg: Number(sForm.weightKg),
        volumeCbm: sForm.volumeCbm ? Number(sForm.volumeCbm) : undefined,
        freightType: sForm.freightType,
        estimatedCost: Number(sForm.estimatedCost),
        currency: sForm.currency,
        transitDays: sForm.transitDays ? Number(sForm.transitDays) : undefined,
      });
      if (r.success) {
        toast.success("Shipping estimate saved");
        refresh();
      } else toast.error(r.error);
    });
  };

  const sections: {
    id: DialogSection;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: "overview", label: "Overview", icon: Eye },
    {
      id: "quotes",
      label: "Quotes",
      icon: DollarSign,
      badge: data?._count.quotes,
    },
    { id: "files", label: "Files", icon: FileText, badge: data?._count.files },
    { id: "shipping", label: "Shipping", icon: Ship },
    { id: "history", label: "History", icon: History },
  ];

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  // Computed title — always a stable string for screen readers
  const dialogTitle = data
    ? `Request from ${data.client.fullName ?? data.client.email}`
    : "Request Details";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
          "[&>button:last-child]:hidden",
        )}
      >
        {(loading || !data) && (
          <VisuallyHidden>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </VisuallyHidden>
        )}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          {loading || !data ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-36 bg-muted rounded" />
                <div className="h-3 w-52 bg-muted rounded" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar client={data.client} />
              <div className="min-w-0">
                {/* Visible DialogTitle — satisfies a11y when data is present */}
                <DialogTitle className="text-sm font-bold text-foreground truncate leading-tight">
                  {data.client.fullName ?? data.client.email}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground truncate">
                  {data.client.email}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {data && (
              <>
                {/* Status picker — shows valid transitions only */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={"ghost"}
                      className="flex items-center gap-1 focus:outline-none rounded-xl"
                      disabled={isPending}
                    >
                      <StatusBadge status={data.status} />
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {STATUS_FLOW[data.status].length === 0 ? (
                      <DropdownMenuItem
                        disabled
                        className="text-xs text-muted-foreground"
                      >
                        No transitions
                      </DropdownMenuItem>
                    ) : (
                      STATUS_FLOW[data.status].map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatus(s)}
                          className="text-xs gap-2"
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              S[s].dot,
                            )}
                          />{" "}
                          → {S[s].label}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Priority picker */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="focus:outline-none p-1 rounded-lg hover:bg-muted/40 transition-colors"
                      disabled={isPending}
                      title="Set priority"
                    >
                      <PriorityDots value={data.priority} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {([0, 1, 2, 3, 4, 5] as const).map((p) => (
                      <DropdownMenuItem
                        key={p}
                        onClick={() => handlePriority(p)}
                        className={cn("text-xs", PRIO[p].text)}
                      >
                        {p === 0 ? "No priority" : `P${p} — ${PRIO[p].label}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={onClose}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogHeader>

        {/* ── Section tabs ───────────────────────────────────────────────── */}
        <div className="shrink-0 flex border-b border-border/40 px-6 overflow-x-auto scrollbar-none">
          {sections.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "flex items-center gap-1.5 px-1 py-3 mr-6 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0",
                section === id
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {badge !== undefined && badge > 0 && (
                <span
                  className={cn(
                    "ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                    section === id
                      ? "bg-[#7b57fc]/15 text-[#7b57fc]"
                      : "bg-muted/60 text-muted-foreground",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-6",
            // Thin, beautiful scrollbar
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:bg-border/60",
            "[&::-webkit-scrollbar-thumb:hover]:bg-border",
          )}
        >
          {loading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && data && (
            <AnimatePresence mode="wait">
              {/* ── OVERVIEW ─────────────────────────────────────────────── */}
              {section === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* AI banner */}
                  {data.aiEstimatedPrice && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#7b57fc]/8 border border-[#7b57fc]/20">
                      <Zap className="w-4 h-4 text-[#7b57fc] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#7b57fc]">
                          AI Estimate — $
                          {data.aiEstimatedPrice.toLocaleString()}
                        </p>
                        {data.aiConfidence !== null && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {Math.round(data.aiConfidence * 100)}% confidence
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Client + request details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Client info */}
                    <div className="space-y-2">
                      <p
                        className={cn(
                          labelCls,
                          "flex items-center gap-1.5 mb-2",
                        )}
                      >
                        <MessageSquare className="w-3 h-3" /> Client
                      </p>
                      {[
                        {
                          icon: MessageSquare,
                          label: "Email",
                          val: data.client.email,
                          href: `mailto:${data.client.email}`,
                        },
                        {
                          icon: Hash,
                          label: "Phone",
                          val: data.client.phone,
                          href: data.client.phone
                            ? `tel:${data.client.phone}`
                            : undefined,
                        },
                      ].map(({ icon: Icon, label, val, href }) =>
                        val ? (
                          <div
                            key={label}
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40"
                          >
                            <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className={cn(labelCls, "mb-0.5")}>{label}</p>
                              {href ? (
                                <a
                                  href={href}
                                  className="text-xs text-[#7b57fc] hover:underline truncate block"
                                >
                                  {val}
                                </a>
                              ) : (
                                <p className="text-xs text-foreground truncate">
                                  {val}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null,
                      )}
                    </div>

                    {/* Request details */}
                    <div className="space-y-2">
                      <p
                        className={cn(
                          labelCls,
                          "flex items-center gap-1.5 mb-2",
                        )}
                      >
                        <Package className="w-3 h-3" /> Request
                      </p>
                      {[
                        {
                          icon: Hash,
                          label: "Quantity",
                          val: data.quantity.toLocaleString(),
                        },
                        {
                          icon: Globe,
                          label: "Ship To",
                          val: data.shippingCountry,
                        },
                        {
                          icon: Calendar,
                          label: "Created",
                          val: format(new Date(data.createdAt), "MMM d, yyyy"),
                        },
                        {
                          icon: Star,
                          label: "Priority",
                          val: `P${data.priority} — ${PRIO[data.priority as keyof typeof PRIO]?.label ?? "None"}`,
                        },
                      ].map(({ icon: Icon, label, val }) => (
                        <div
                          key={label}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40"
                        >
                          <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className={cn(labelCls, "mb-0.5")}>{label}</p>
                            <p className="text-xs text-foreground">{val}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Product link */}
                  {data.productLink && (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-muted/20 border border-border/40">
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={cn(labelCls, "mb-0.5")}>Product Link</p>
                        <a
                          href={data.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#7b57fc] hover:underline break-all line-clamp-1"
                        >
                          {data.productLink}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {data.description && (
                    <div>
                      <p
                        className={cn(
                          labelCls,
                          "flex items-center gap-1.5 mb-2",
                        )}
                      >
                        <FileText className="w-3 h-3" /> Description
                      </p>
                      <div className="bg-muted/20 rounded-xl border border-border/40 p-4">
                        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                          {data.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Custom notes */}
                  {data.customNotes && (
                    <div>
                      <p className={cn(labelCls, "mb-2")}>Additional Notes</p>
                      <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-3.5">
                        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {data.customNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Estimator */}
                  <div className="rounded-xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#7b57fc]" /> AI Quote
                        Estimator
                      </p>
                      <Button
                        size="sm"
                        disabled={aiLoading || isPending}
                        className={cn(
                          "h-8 rounded-xl text-xs gap-1.5",
                          aiLoading
                            ? "bg-muted text-muted-foreground"
                            : "bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20",
                        )}
                        onClick={handleAI}
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                            Analysing…
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Generate
                          </>
                        )}
                      </Button>
                    </div>
                    {aiResult && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#7b57fc]/8 border border-[#7b57fc]/20">
                          <span className="text-sm font-bold text-[#7b57fc]">
                            ${Number(aiResult.estimatedPrice).toLocaleString()}{" "}
                            {aiResult.currency}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {Math.round(aiResult.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {aiResult.reasoning}
                        </p>
                        <button
                          onClick={() =>
                            setQForm((p) => ({
                              ...p,
                              price: aiResult.estimatedPrice,
                              adminNotes: aiResult.suggestedNotes,
                              status: "DRAFT",
                            }))
                          }
                          className="text-xs text-[#7b57fc] hover:underline underline-offset-2 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Use in new quote
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── QUOTES ───────────────────────────────────────────────── */}
              {section === "quotes" && (
                <motion.div
                  key="quotes"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Accepted banner */}
                  {data.acceptedQuote && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Accepted — $
                          {Number(data.acceptedQuote.price).toLocaleString()}{" "}
                          {data.acceptedQuote.currency}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Rev. {data.acceptedQuote.revision} ·{" "}
                          {format(
                            new Date(data.acceptedQuote.createdAt),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quote list */}
                  {data.quotes.length > 0 && (
                    <div className="space-y-2.5">
                      {data.quotes.map((q) => (
                        <div
                          key={q.id}
                          className={cn(
                            "rounded-xl border p-4 space-y-3 transition-colors",
                            q.id === data.acceptedQuoteId
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-border/50 bg-card",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">
                                  ${Number(q.price).toLocaleString()}{" "}
                                  {q.currency}
                                </span>
                                <QuoteBadge status={q.status} />
                                <span className="text-[10px] text-muted-foreground">
                                  Rev. {q.revision}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                by {q.createdBy.fullName ?? q.createdBy.email}
                                {q.validUntil &&
                                  ` · valid until ${format(new Date(q.validUntil), "MMM d")}`}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg"
                                  disabled={isPending}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                {(
                                  [
                                    "DRAFT",
                                    "SENT",
                                    "ACCEPTED",
                                    "REJECTED",
                                  ] as QuoteStatus[]
                                )
                                  .filter((qs) => qs !== q.status)
                                  .map((qs) => (
                                    <DropdownMenuItem
                                      key={qs}
                                      onClick={() =>
                                        handleQuoteStatus(q.id, qs)
                                      }
                                      className="text-xs gap-2"
                                    >
                                      → {QS[qs].label}
                                    </DropdownMenuItem>
                                  ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteQuote(q.id)}
                                  className="text-xs text-red-500 focus:text-red-500 gap-2"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {q.adminNotes && (
                            <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-2.5 leading-relaxed">
                              {q.adminNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create quote form */}
                  <div className="rounded-xl border border-dashed border-border/60 p-4 space-y-3.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#7b57fc]" /> New Quote
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>
                          Price <span className="text-[#7b57fc]">*</span>
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={qForm.price}
                            onChange={(e) =>
                              setQForm((p) => ({ ...p, price: e.target.value }))
                            }
                            placeholder="0.00"
                            dir="ltr"
                            className={cn(inputCls, "pl-8")}
                          />
                        </div>
                      </div>
                      {/* shadcn Select — currency */}
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Currency</Label>
                        <Select
                          value={qForm.currency}
                          onValueChange={(v) =>
                            setQForm((p) => ({ ...p, currency: v }))
                          }
                        >
                          <SelectTrigger className={cn(inputCls, "w-full")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["USD", "EUR", "GBP", "SAR", "AED"].map((c) => (
                              <SelectItem key={c} value={c} className="text-xs">
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* shadcn Select — status */}
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Status</Label>
                        <Select
                          value={qForm.status}
                          onValueChange={(v) =>
                            setQForm((p) => ({
                              ...p,
                              status: v as QuoteStatus,
                            }))
                          }
                        >
                          <SelectTrigger className={cn(inputCls, "w-full")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["DRAFT", "SENT"] as const).map((qs) => (
                              <SelectItem
                                key={qs}
                                value={qs}
                                className="text-xs"
                              >
                                {QS[qs].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Valid Until</Label>
                        <Input
                          type="date"
                          value={qForm.validUntil}
                          onChange={(e) =>
                            setQForm((p) => ({
                              ...p,
                              validUntil: e.target.value,
                            }))
                          }
                          className={inputCls}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Admin Notes</Label>
                      <Textarea
                        value={qForm.adminNotes}
                        onChange={(e) =>
                          setQForm((p) => ({
                            ...p,
                            adminNotes: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Internal notes about this quote…"
                        className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
                      />
                    </div>
                    <Button
                      disabled={isPending || !qForm.price}
                      className="h-9 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-xs gap-1.5"
                      onClick={handleCreateQuote}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                          Creating…
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Create Quote
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── FILES ────────────────────────────────────────────────── */}
              {section === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Upload zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileUpload(f);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-border/40 rounded-xl p-7 text-center cursor-pointer hover:border-[#7b57fc]/40 hover:bg-[#7b57fc]/3 transition-all"
                  >
                    <Input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f);
                        e.target.value = "";
                      }}
                    />
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Uploading…</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-7 h-7 mx-auto text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                          Drop a file or{" "}
                          <span className="text-[#7b57fc] underline underline-offset-2">
                            browse
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                          PDF · Images · Office · ZIP — max 20 MB
                        </p>
                      </div>
                    )}
                  </div>

                  {data.files.length === 0 ? (
                    <p className="text-center py-8 text-xs text-muted-foreground">
                      No files attached yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {f.fileName ?? "file"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {f.fileSize
                                ? `${(f.fileSize / 1024).toFixed(1)} KB · `
                                : ""}
                              {f.fileType}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              asChild
                            >
                              <Link
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              disabled={isPending}
                              onClick={() => handleDeleteFile(f.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── SHIPPING ─────────────────────────────────────────────── */}
              {section === "shipping" && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Existing estimate */}
                  {data.shippingEstimate && (
                    <div className="p-4 rounded-xl border border-sky-500/25 bg-sky-500/5 space-y-3">
                      <p className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5" /> Latest Estimate
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            l: "Route",
                            v: `${data.shippingEstimate.originCountry} → ${data.shippingEstimate.destinationCountry}`,
                          },
                          {
                            l: "Type",
                            v:
                              data.shippingEstimate.freightType === "air"
                                ? "✈ Air"
                                : "🚢 Sea",
                          },
                          {
                            l: "Cost",
                            v: `$${data.shippingEstimate.estimatedCost.toLocaleString()} ${data.shippingEstimate.currency}`,
                          },
                          {
                            l: "Transit",
                            v: data.shippingEstimate.transitDays
                              ? `${data.shippingEstimate.transitDays} days`
                              : "—",
                          },
                          {
                            l: "Weight",
                            v: `${data.shippingEstimate.weightKg} kg`,
                          },
                          {
                            l: "Volume",
                            v: data.shippingEstimate.volumeCbm
                              ? `${data.shippingEstimate.volumeCbm} CBM`
                              : "—",
                          },
                        ].map(({ l, v }) => (
                          <div
                            key={l}
                            className="bg-background/60 rounded-lg p-2.5"
                          >
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                              {l}
                            </p>
                            <p className="text-xs font-semibold text-foreground mt-0.5">
                              {v}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new estimate form */}
                  <div className="rounded-xl border border-dashed border-border/60 p-4 space-y-3.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#7b57fc]" /> Add
                      Shipping Estimate
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Origin</Label>
                        <Input
                          value={sForm.originCountry}
                          onChange={(e) =>
                            setSForm((p) => ({
                              ...p,
                              originCountry: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="CN"
                          maxLength={2}
                          dir="ltr"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Destination</Label>
                        <Input
                          value={sForm.destinationCountry}
                          onChange={(e) =>
                            setSForm((p) => ({
                              ...p,
                              destinationCountry: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder={data.shippingCountry}
                          maxLength={2}
                          dir="ltr"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* shadcn Select — freight type */}
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Type</Label>
                        <Select
                          value={sForm.freightType}
                          onValueChange={(v) =>
                            setSForm((p) => ({
                              ...p,
                              freightType: v as "air" | "sea",
                            }))
                          }
                        >
                          <SelectTrigger className={cn(inputCls, "w-full")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sea" className="text-xs">
                              🚢 Sea
                            </SelectItem>
                            <SelectItem value="air" className="text-xs">
                              ✈ Air
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Transit Days</Label>
                        <Input
                          type="number"
                          min="1"
                          value={sForm.transitDays}
                          onChange={(e) =>
                            setSForm((p) => ({
                              ...p,
                              transitDays: e.target.value,
                            }))
                          }
                          placeholder="25"
                          dir="ltr"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Weight (kg)</Label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={sForm.weightKg}
                          onChange={(e) =>
                            setSForm((p) => ({
                              ...p,
                              weightKg: e.target.value,
                            }))
                          }
                          placeholder="10.5"
                          dir="ltr"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Volume (CBM)</Label>
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={sForm.volumeCbm}
                          onChange={(e) =>
                            setSForm((p) => ({
                              ...p,
                              volumeCbm: e.target.value,
                            }))
                          }
                          placeholder="0.05"
                          dir="ltr"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>
                          Cost <span className="text-[#7b57fc]">*</span>
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={sForm.estimatedCost}
                            onChange={(e) =>
                              setSForm((p) => ({
                                ...p,
                                estimatedCost: e.target.value,
                              }))
                            }
                            placeholder="450.00"
                            dir="ltr"
                            className={cn(inputCls, "pl-8")}
                          />
                        </div>
                      </div>
                      {/* shadcn Select — currency */}
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Currency</Label>
                        <Select
                          value={sForm.currency}
                          onValueChange={(v) =>
                            setSForm((p) => ({ ...p, currency: v }))
                          }
                        >
                          <SelectTrigger className={cn(inputCls, "w-full")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["USD", "EUR", "SAR", "AED"].map((c) => (
                              <SelectItem key={c} value={c} className="text-xs">
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      disabled={
                        isPending || !sForm.weightKg || !sForm.estimatedCost
                      }
                      className="h-9 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-xs gap-1.5"
                      onClick={handleCreateShipping}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                          Saving…
                        </>
                      ) : (
                        <>
                          <Ship className="w-3.5 h-3.5" /> Save Estimate
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── HISTORY ──────────────────────────────────────────────── */}
              {section === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {data.statusHistory.length === 0 ? (
                    <p className="text-center py-10 text-xs text-muted-foreground">
                      No status changes yet
                    </p>
                  ) : (
                    <div className="relative pl-5">
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-border/50" />
                      {data.statusHistory.map((h) => (
                        <div key={h.id} className="relative mb-4 last:mb-0">
                          <div
                            className={cn(
                              "absolute -left-3.5 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                              S[h.newStatus]?.dot ?? "bg-muted",
                            )}
                          />
                          <div className="bg-muted/20 rounded-xl border border-border/40 p-3.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={h.oldStatus} />
                                <ChevronDown className="w-3 h-3 text-muted-foreground -rotate-90 shrink-0" />
                                <StatusBadge status={h.newStatus} />
                              </div>
                              <RelativeTime
                                date={h.changedAt}
                                className="text-[10px] text-muted-foreground whitespace-nowrap"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              by {h.changedBy.fullName ?? h.changedBy.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <div>
            {!showDelete ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/8 gap-1.5"
                disabled={isPending || !data}
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete request
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Confirm?</p>
                <Button
                  size="sm"
                  className="h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs border-0"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 rounded-lg text-xs"
                  onClick={() => setShowDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-4 rounded-xl text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Requests table + mobile cards
// ─────────────────────────────────────────────────────────────────────────────

function RequestsTable({
  requests,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
  onQuickStatus,
  isPending,
}: {
  requests: SerializedRequest[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onOpen: (id: string) => void;
  onQuickStatus: (id: string, s: RequestStatus) => void;
  isPending: boolean;
}) {
  const allChecked =
    requests.length > 0 && requests.every((r) => selectedIds.includes(r.id));

  if (requests.length === 0)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-border/50 bg-card"
      >
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Package className="w-7 h-7 text-muted-foreground/30" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground/70">
            No requests found
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Try adjusting your filters
          </p>
        </div>
      </motion.div>
    );

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-205">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-4 py-2.5 w-10">
                  <Input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => onToggleAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-[#7b57fc] cursor-pointer"
                  />
                </th>
                {[
                  "Client",
                  "Request",
                  "Qty",
                  "Status",
                  "Priority",
                  "Quotes",
                  "Country",
                  "Created",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {requests.map((req) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpen(req.id)}
                    className={cn(
                      "group border-b border-border/30 hover:bg-muted/10 cursor-pointer transition-colors last:border-0",
                      selectedIds.includes(req.id) && "bg-[#7b57fc]/3",
                    )}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        type="checkbox"
                        checked={selectedIds.includes(req.id)}
                        onChange={() => onToggle(req.id)}
                        className="w-3.5 h-3.5 rounded accent-[#7b57fc] cursor-pointer"
                      />
                    </td>

                    {/* Client */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar client={req.client} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate max-w-27.5">
                            {req.client.fullName ?? "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-32.5">
                            {req.client.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-3.5 max-w-50">
                      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                        {req.description ?? req.productLink ?? (
                          <span className="text-muted-foreground/40 italic">
                            No description
                          </span>
                        )}
                      </p>
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3.5">
                      <span className="text-xs font-mono text-foreground/70">
                        {req.quantity.toLocaleString()}
                      </span>
                    </td>

                    {/* Status — inline picker */}
                    <td
                      className="px-3 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 focus:outline-none">
                          <StatusBadge status={req.status} />
                          <ChevronDown className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          {STATUS_FLOW[req.status].length === 0 ? (
                            <DropdownMenuItem
                              disabled
                              className="text-xs text-muted-foreground"
                            >
                              No transitions
                            </DropdownMenuItem>
                          ) : (
                            STATUS_FLOW[req.status].map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => onQuickStatus(req.id, s)}
                                disabled={isPending}
                                className="text-xs gap-2"
                              >
                                <span
                                  className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    S[s].dot,
                                  )}
                                />{" "}
                                → {S[s].label}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-3.5">
                      <PriorityDots value={req.priority} />
                    </td>

                    {/* Quotes */}
                    <td className="px-3 py-3.5">
                      {req._count.quotes > 0 ? (
                        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {req._count.quotes}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </td>

                    {/* Country */}
                    <td className="px-3 py-3.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {req.shippingCountry}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <RelativeTime
                        date={req.createdAt}
                        className="text-[11px] text-muted-foreground"
                      />
                    </td>

                    {/* View */}
                    <td className="px-3 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpen(req.id)}
              className={cn(
                "rounded-2xl border bg-card p-4 cursor-pointer transition-all",
                selectedIds.includes(req.id)
                  ? "border-[#7b57fc]/40 bg-[#7b57fc]/3"
                  : "border-border/50 hover:border-[#7b57fc]/30 hover:shadow-sm",
              )}
            >
              <div className="flex items-start gap-3">
                <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                  <Input
                    type="checkbox"
                    checked={selectedIds.includes(req.id)}
                    onChange={() => onToggle(req.id)}
                    className="w-3.5 h-3.5 rounded accent-[#7b57fc] cursor-pointer"
                  />
                </div>
                <Avatar client={req.client} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {req.client.fullName ?? req.client.email}
                    </p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {req.client.email}
                  </p>
                  {(req.description || req.productLink) && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {req.description ?? req.productLink}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-2.5 border-t border-border/30">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {req.quantity.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {req.shippingCountry}
                </span>
                <PriorityDots value={req.priority} />
                {req._count.quotes > 0 && (
                  <span className="text-[11px] font-semibold text-violet-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> {req._count.quotes}
                  </span>
                )}
                <RelativeTime
                  date={req.createdAt}
                  className="text-[11px] text-muted-foreground ml-auto"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialRequests: SerializedRequest[];
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  initialStats: {
    byStatus: Record<string, number>;
    submittedToday: number;
    submittedWeek: number;
    pendingQuotes: number;
    totalActive: number;
    avgResolutionDays: number;
    topShippingCountries: { country: string; count: number }[];
  } | null;
  filters: {
    page: number;
    pageSize: number;
    status?: RequestStatus;
    priority?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function RequestPageClient({
  initialRequests,
  initialPagination,
  initialStats,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, start] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const base = new URLSearchParams();
        const merged: Record<string, string | undefined> = {
          page: String(filters.page),
          status: filters.status,
          priority:
            filters.priority !== undefined
              ? String(filters.priority)
              : undefined,
          search: filters.search,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          ...patch,
        };
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== "") base.set(k, v);
        });
        router.push(`${pathname}?${base.toString()}`);
      });
    },
    [filters, router, pathname],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  const handleOpen = (id: string) => {
    setActiveId(id);
    setDialogOpen(true);
  };
  const handleClose = () => {
    setDialogOpen(false);
    setActiveId(null);
  };

  const handleQuickStatus = (id: string, status: RequestStatus) => {
    start(async () => {
      const r = await updateRequestStatus(id, status);
      if (r.success) {
        toast.success(`→ ${S[status].label}`);
        refresh();
      } else toast.error(r.error);
    });
  };

  const handleBulkStatus = (status: RequestStatus) => {
    if (!selectedIds.length) return;
    start(async () => {
      const r = await bulkUpdateRequestStatus(selectedIds, status);
      if (r.success) {
        toast.success(`${r.data.count} requests → ${S[status].label}`);
        setSelectedIds([]);
        refresh();
      } else toast.error(r.error);
    });
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? initialRequests.map((r) => r.id) : []);

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      {initialStats && <StatsStrip stats={initialStats} />}

      {/* Status pipeline — desktop only */}
      <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto pb-1">
        {ALL_STATUSES.map((status) => {
          const count = initialStats?.byStatus[status] ?? 0;
          const active = filters.status === status;
          return (
            <button
              key={status}
              onClick={() =>
                applyFilters({ status: active ? undefined : status, page: "1" })
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shrink-0",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border/80 bg-card",
              )}
            >
              <span
                className={cn("w-2 h-2 rounded-full shrink-0", S[status].dot)}
              />
              {S[status].label}
              {count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                    active
                      ? "bg-background/20 text-background"
                      : "bg-muted/60 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onApply={applyFilters}
        isPending={isPending}
        selectedIds={selectedIds}
        onBulkStatus={handleBulkStatus}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 -mt-1">
        <p className="text-xs text-muted-foreground">
          {initialPagination.totalCount.toLocaleString()} request
          {initialPagination.totalCount !== 1 ? "s" : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 rounded-xl gap-1.5 text-xs text-muted-foreground"
          onClick={refresh}
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Table */}
      <RequestsTable
        requests={initialRequests}
        selectedIds={selectedIds}
        onToggle={toggleSelect}
        onToggleAll={toggleAll}
        onOpen={handleOpen}
        onQuickStatus={handleQuickStatus}
        isPending={isPending}
      />

      {/* Pagination */}
      <Pagination
        pagination={initialPagination}
        onPage={(p) => applyFilters({ page: String(p) })}
      />

      {/* Detail dialog */}
      <RequestDetailDialog
        open={dialogOpen}
        onClose={handleClose}
        onDone={refresh}
        requestId={activeId}
      />
    </div>
  );
}
