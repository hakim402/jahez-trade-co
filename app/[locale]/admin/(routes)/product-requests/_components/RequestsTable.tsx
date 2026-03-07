"use client";

// app/[locale]/admin/(routes)/product-requests/_components/RequestsTable.tsx

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  MoreHorizontal,
  Eye,
  Trash2,
  Sparkles,
  Star,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  CheckSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  updateRequestStatus,
  updateRequestPriority,
  deleteProductRequest,
} from "../actions";
import { RequestDetailModal } from "./RequestDetailModal";
import { ConfirmDialog } from "./ConfirmDialog";
import type { RequestWithRelations } from "./types";
import { RequestFilters } from "./RequestFilters";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG  (keys = real Prisma enum values)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  RequestStatus,
  {
    label: string;
    chip: string;
    dot: string;
    icon: React.ElementType;
  }
> = {
  SUBMITTED: {
    label: "Submitted",
    dot: "bg-blue-400",
    icon: Clock,
    chip: "text-blue-600    dark:text-blue-400    ring-blue-400/30    bg-blue-500/8",
  },
  IN_REVIEW: {
    label: "In Review",
    dot: "bg-amber-400",
    icon: Eye,
    chip: "text-amber-600   dark:text-amber-400   ring-amber-400/30   bg-amber-500/8",
  },
  QUOTED: {
    label: "Quoted",
    dot: "bg-violet-400",
    icon: FileText,
    chip: "text-violet-600  dark:text-violet-400  ring-violet-400/30  bg-violet-500/8",
  },
  APPROVED: {
    label: "Approved",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
    chip: "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 bg-emerald-500/8",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-400",
    icon: XCircle,
    chip: "text-red-600     dark:text-red-400     ring-red-400/30     bg-red-500/8",
  },
  IN_PRODUCTION: {
    label: "In Production",
    dot: "bg-orange-400",
    icon: Package,
    chip: "text-orange-600  dark:text-orange-400  ring-orange-400/30  bg-orange-500/8",
  },
  SHIPPED: {
    label: "Shipped",
    dot: "bg-cyan-400",
    icon: Truck,
    chip: "text-cyan-600    dark:text-cyan-400    ring-cyan-400/30    bg-cyan-500/8",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-green-400",
    icon: CheckSquare,
    chip: "text-green-600   dark:text-green-400   ring-green-400/30   bg-green-500/8",
  },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  5: { label: "Critical", color: "text-red-400" },
  4: { label: "High", color: "text-orange-400" },
  3: { label: "Medium", color: "text-yellow-400" },
  2: { label: "Normal", color: "text-blue-400" },
  1: { label: "Low", color: "text-muted-foreground" },
  0: { label: "Minimal", color: "text-muted-foreground/40" },
};

const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string) {
  if (name)
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function avatarColor(email: string) {
  const palette = [
    "bg-violet-500/20 text-violet-500",
    "bg-blue-500/20 text-blue-500",
    "bg-emerald-500/20 text-emerald-500",
    "bg-amber-500/20 text-amber-500",
    "bg-rose-500/20 text-rose-500",
    "bg-[#7b57fc]/20 text-[#7b57fc]",
  ];
  const idx =
    email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE  (exported — used by RequestDetailModal)
// ─────────────────────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 leading-none whitespace-nowrap",
        cfg.chip,
      )}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY STARS
// ─────────────────────────────────────────────────────────────────────────────

function PriorityStars({ priority }: { priority: number }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG[0];
  return (
    <div
      className={cn("flex items-center gap-px", cfg.color)}
      title={cfg.label}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11} fill={i < priority ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS DROPDOWN (inline cell)
// ─────────────────────────────────────────────────────────────────────────────

function StatusDropdown({
  requestId,
  current,
  onDone,
}: {
  requestId: string;
  current: RequestStatus;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const transitions = STATUS_TRANSITIONS[current];

  if (!transitions.length) return <StatusBadge status={current} />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          disabled={isPending}
          className="flex items-center gap-1 group focus:outline-none"
        >
          <StatusBadge status={current} />
          <ChevronDown
            size={11}
            className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors shrink-0"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-44 rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1"
      >
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Move to…
        </p>
        {transitions.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <DropdownMenuItem
              key={s}
              onClick={() =>
                startTransition(async () => {
                  await updateRequestStatus(requestId, s);
                  onDone();
                })
              }
              className={cn(
                "flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer",
                "focus:bg-muted/60 focus:text-foreground",
              )}
            >
              <span
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded-md",
                  cfg.chip.replace("ring-", "bg-").split(" ")[2],
                )}
              >
                <Icon size={12} className={cfg.chip.split(" ")[0]} />
              </span>
              {cfg.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────

function PriorityDropdown({
  requestId,
  current,
  onDone,
}: {
  requestId: string;
  current: number;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          disabled={isPending}
          className="flex items-center gap-1 group focus:outline-none"
        >
          <PriorityStars priority={current} />
          <ChevronDown
            size={10}
            className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-44 rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1"
      >
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Set priority
        </p>
        {[5, 4, 3, 2, 1, 0].map((p) => {
          const cfg = PRIORITY_CONFIG[p];
          return (
            <DropdownMenuItem
              key={p}
              onClick={() =>
                startTransition(async () => {
                  await updateRequestPriority(requestId, p);
                  onDone();
                })
              }
              className={cn(
                "flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer",
                current === p ? "bg-muted/40" : "",
                "focus:bg-muted/60 focus:text-foreground",
              )}
            >
              <PriorityStars priority={p} />
              <span className="text-xs text-muted-foreground ml-1">
                {cfg.label}
              </span>
              {current === p && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7b57fc]" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TABLE
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  requests: RequestWithRelations[];
  onActionComplete: () => void;
}

export function RequestsTable({ requests, onActionComplete }: Props) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteProductRequest(id);
      setDeleteId(null);
      onActionComplete();
    });
  };

  if (requests.length === 0) return null;
  

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              {[
                "#",
                "Client",
                "Product",
                "Qty",
                "Status",
                "Priority",
                "Quotes",
                "AI Est.",
                "Created",
                "",
              ].map((h, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20",
                    i === 3 && "text-center w-16",
                    i === 9 && "w-10",
                    i === 0 && "w-12",
                  )}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {requests.map((req, idx) => (
              <TableRow
                key={req.id}
                className="group border-border/30 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setDetailId(req.id)}
              >
                {/* # */}
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {String(idx + 1).padStart(3, "0")}
                </TableCell>

                {/* Client */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarImage src={req.client.avatarUrl ?? undefined} />
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold",
                          avatarColor(req.client.email),
                        )}
                      >
                        {initials(req.client.fullName, req.client.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate max-w-28">
                        {req.client.fullName ?? req.client.email}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-28">
                        {req.client.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Product */}
                <TableCell>
                  <div className="min-w-0 max-w-44">
                    <p className="text-xs truncate">
                      {req.description ? (
                        req.description.slice(0, 55) +
                        (req.description.length > 55 ? "…" : "")
                      ) : (
                        <span className="text-muted-foreground italic">
                          No description
                        </span>
                      )}
                    </p>
                    {req.productLink && (
                      <a
                        href={req.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-[#7b57fc] hover:underline flex items-center gap-0.5 truncate mt-0.5"
                      >
                        <ExternalLink size={9} />
                        {(() => {
                          try {
                            return new URL(
                              req.productLink.startsWith("http")
                                ? req.productLink
                                : `https://${req.productLink}`,
                            ).hostname;
                          } catch {
                            return req.productLink.slice(0, 25);
                          }
                        })()}
                      </a>
                    )}
                  </div>
                </TableCell>

                {/* Qty */}
                <TableCell className="text-center">
                  <span className="text-xs font-mono font-semibold">
                    {req.quantity.toLocaleString()}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    requestId={req.id}
                    current={req.status}
                    onDone={onActionComplete}
                  />
                </TableCell>

                {/* Priority */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <PriorityDropdown
                    requestId={req.id}
                    current={req.priority}
                    onDone={onActionComplete}
                  />
                </TableCell>

                {/* Quotes */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold tabular-nums">
                      {req.quotes.length}
                    </span>
                    {req.quotes.some((q) => q.status === "ACCEPTED") && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                        title="Accepted quote"
                      />
                    )}
                    {req.quotes.some((q) => q.status === "SENT") && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-violet-400"
                        title="Quote sent"
                      />
                    )}
                  </div>
                </TableCell>

                {/* AI estimate */}
                <TableCell>
                  {req.aiEstimatedPrice ? (
                    <div className="flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-semibold tabular-nums">
                        ${parseFloat(req.aiEstimatedPrice).toLocaleString()}
                      </span>
                      {req.aiConfidence && (
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(req.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                {/* Created */}
                <TableCell>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(req.createdAt), "MMM d, yyyy")}
                  </span>
                </TableCell>

                {/* Actions menu */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={"ghost"}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground"
                      >
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1"
                    >
                      <DropdownMenuItem
                        onClick={() => setDetailId(req.id)}
                        className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-muted/60"
                      >
                        <span className="h-6 w-6 flex items-center justify-center rounded-md bg-muted/60">
                          <Eye size={12} />
                        </span>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/40 my-1" />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(req.id)}
                        className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                      >
                        <span className="h-6 w-6 flex items-center justify-center rounded-md bg-red-500/10">
                          <Trash2 size={12} />
                        </span>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail modal */}
      {detailId && (
        <RequestDetailModal
          requestId={detailId}
          onClose={() => setDetailId(null)}
          onActionComplete={() => {
            onActionComplete();
            setDetailId(null);
          }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete request?"
        description="This will soft-delete the request and all its quotes. It can be restored by an administrator."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </>
  );
}
