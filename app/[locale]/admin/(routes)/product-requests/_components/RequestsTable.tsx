"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  MoreHorizontal,
  Eye,
  FileText,
  Trash2,
  Sparkles,
  Star,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  Truck,
  CheckSquare,
  Edit3,
  Upload,
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
import {
  updateRequestStatus,
  updateRequestPriority,
  deleteProductRequest,
} from "../actions";
import { RequestDetailModal } from "./RequestDetailModal";
import { ConfirmDialog } from "./ConfirmDialog";
import type { RequestWithRelations } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  SUBMITTED: {
    label: "Submitted",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  IN_REVIEW: {
    label: "In Review",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Eye,
  },
  QUOTED: {
    label: "Quoted",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    icon: FileText,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: XCircle,
  },
  IN_PRODUCTION: {
    label: "In Production",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    icon: Package,
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: Truck,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: CheckSquare,
  },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  5: { label: "Critical", color: "text-red-400" },
  4: { label: "High", color: "text-orange-400" },
  3: { label: "Medium", color: "text-yellow-400" },
  2: { label: "Normal", color: "text-blue-400" },
  1: { label: "Low", color: "text-muted-foreground" },
  0: { label: "Minimal", color: "text-muted-foreground/50" },
};

function PriorityStars({ priority }: { priority: number }) {
  return (
    <div
      className={`flex items-center gap-0.5 ${PRIORITY_CONFIG[priority]?.color ?? ""}`}
      title={PRIORITY_CONFIG[priority]?.label}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11} fill={i < priority ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

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

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={`text-xs flex items-center gap-1 ${cfg.color}`}
    >
      <Icon size={10} />
      {cfg.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CHANGE DROPDOWN (inline in table)
// ─────────────────────────────────────────────────────────────────────────────

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
        <Button className="flex items-center gap-1 group cursor-pointer" disabled={isPending} variant={"ghost"}>
          <StatusBadge status={current}/>
          <ChevronDown
            size={12}
            className="text-muted-foreground group-hover:text-foreground transition-colors"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover border-border">
        <p className="text-xs text-muted-foreground px-2 py-1">Move to…</p>
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
              className="cursor-pointer text-sm flex items-center gap-2"
            >
              <Icon size={13} />
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
        <Button className="flex items-center gap-1 group cursor-pointer" disabled={isPending} variant={"ghost"}>
          <PriorityStars priority={current} />
          <ChevronDown size={10} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover border-border">
        {[5, 4, 3, 2, 1, 0].map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() =>
              startTransition(async () => {
                await updateRequestPriority(requestId, p);
                onDone();
              })
            }
            className={`cursor-pointer text-sm ${current === p ? "text-color" : ""}`}
          >
            <PriorityStars priority={p} />
            <span className="ml-2 text-xs text-muted-foreground">
              {PRIORITY_CONFIG[p].label}
            </span>
          </DropdownMenuItem>
        ))}
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

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border/5 bg-card/50">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Package size={40} className="opacity-20" />
          <p className="text-sm">No product requests found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border/5 bg-card/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground font-medium w-12">
                #
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Client
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Product
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium w-20 text-center">
                Qty
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Status
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Priority
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Quotes
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                AI Est.
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Created
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req, idx) => (
              <TableRow
                key={req.id}
                className="border-border/20 hover:bg-accent/5 cursor-pointer"
                onClick={() => setDetailId(req.id)}
              >
                {/* Index */}
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {String(idx + 1).padStart(3, "0")}
                </TableCell>

                {/* Client */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7 border border-border/20">
                      <AvatarImage src={req.client.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                        {initials(req.client.fullName, req.client.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-30">
                        {req.client.fullName ?? req.client.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-30">
                        {req.client.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Product */}
                <TableCell>
                  <div className="min-w-0">
                    <p className="text-sm truncate max-w-45">
                      {req.description ? (
                        req.description.slice(0, 50) +
                        (req.description.length > 50 ? "…" : "")
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
                        className="text-xs text-color hover:underline flex items-center gap-0.5 truncate max-w-45"
                      >
                        <ExternalLink size={10} />
                        {
                          new URL(
                            req.productLink.startsWith("http")
                              ? req.productLink
                              : `https://${req.productLink}`,
                          ).hostname
                        }
                      </a>
                    )}
                  </div>
                </TableCell>

                {/* Qty */}
                <TableCell className="text-center">
                  <span className="text-sm font-mono font-medium">
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
                    <span className="text-sm font-medium">
                      {req.quotes.length}
                    </span>
                    {req.quotes.some((q) => q.status === "ACCEPTED") && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        title="Accepted quote"
                      />
                    )}
                    {req.quotes.some((q) => q.status === "SENT") && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-violet-400"
                        title="Quote sent"
                      />
                    )}
                  </div>
                </TableCell>

                {/* AI Estimate */}
                <TableCell>
                  {req.aiEstimatedPrice ? (
                    <div className="flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-400" />
                      <span className="text-sm font-medium">
                        ${parseFloat(req.aiEstimatedPrice).toLocaleString()}
                      </span>
                      {req.aiConfidence && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(req.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Created */}
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(req.createdAt), "MMM d, yyyy")}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal size={15} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-popover border-border"
                    >
                      <DropdownMenuItem
                        onClick={() => setDetailId(req.id)}
                        className="cursor-pointer text-sm gap-2"
                      >
                        <Eye size={14} /> View details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(req.id)}
                        className="cursor-pointer text-sm gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
                      >
                        <Trash2 size={14} /> Delete
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
        description="This will soft-delete the request and all its quotes. This action can be reversed by an administrator."
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </>
  );
}
