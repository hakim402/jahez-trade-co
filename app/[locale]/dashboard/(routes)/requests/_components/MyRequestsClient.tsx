"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  Loader2,
  Upload,
  Trash2,
  Download,
  ExternalLink,
  ChevronDown,
  Check,
  AlertTriangle,
  PackageSearch,
  Star,
  FileText,
  Crown,
  CheckCircle2,
  Send,
  ChevronLeft,
  ChevronRight,
  Package,
  Globe,
  Sparkles,
  Link2,
  StickyNote,
  Hash,
  ArrowRight,
  MapPin,
  Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  createProductRequest,
  uploadClientFile,
  deleteClientFile,
  acceptQuote,
  rejectQuote,
  deleteMyRequest,
} from "../actions";
import {
  STATUS_CONFIG,
  QUOTE_STATUS_CONFIG,
  getFileIcon,
  formatFileSize,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_MB,
  type ClientRequestWithRelations,
  type TransformedFile,
  type PaginationInfo,
  type UserPlanInfo,
  type ClientFiltersType,
} from "./types";
import { RequestStatus } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// FORM SCHEMA — FIX #2 & #3
// z.preprocess avoids the coerce input/output mismatch with useForm<FormValues>
// ─────────────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  productLink: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .min(1, "Description is required")
    .max(2000),

  quantity: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z
      .number()
      .int("Must be an integer")
      .positive("Must be a positive number")
  ),

  shippingCountry: z
    .string()
    .min(2, "Shipping country is required"),

  customNotes: z
    .string()
    .max(1000)
    .optional(),
});

type FormValues = {
  productLink?: string;
  description: string;
  quantity: number;
  shippingCountry: string;
  customNotes?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ring-1 leading-none whitespace-nowrap",
        cfg.chip,
      )}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN BANNER
// ─────────────────────────────────────────────────────────────────────────────

function PlanBanner({ plan }: { plan: UserPlanInfo }) {
  if (plan.limit === Infinity) return null;
  const pct = Math.round((plan.usedCount / plan.limit) * 100);
  const isWarning = pct >= 80;
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 flex items-center gap-4",
        isWarning
          ? "border-amber-400/20 bg-amber-500/5"
          : "border-border/10 bg-card/30",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isWarning ? "bg-amber-500/15" : "bg-muted/30",
        )}
      >
        <Crown
          size={16}
          className={isWarning ? "text-amber-400" : "text-muted-foreground"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">
            {plan.planName} plan
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {plan.usedCount} / {plan.limit} requests
          </p>
        </div>
        <div className="h-1.5 bg-border/20 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isWarning ? "bg-amber-400" : "bg-color",
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
      {isWarning && (
        <button className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0">
          <Crown size={11} /> Upgrade
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD ZONE
// ─────────────────────────────────────────────────────────────────────────────

function FileUploadZone({
  requestId,
  onUploaded,
}: {
  requestId: string;
  onUploaded: (f: TransformedFile) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("requestId", requestId);
      const r = await uploadClientFile(fd);
      setUploading(false);
      if (r.success) {
        onUploaded({
          id: r.data.id,
          url: r.data.url,
          fileType: file.type,
          fileName: r.data.fileName,
          fileSize: file.size,
          requestId,
          quoteId: null,
          uploadedById: null,
          createdAt: new Date(),
        });
      } else {
        setError(r.error);
      }
    },
    [requestId, onUploaded],
  );

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) process(f);
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
          dragging
            ? "border-color/60 bg-color/5"
            : "border-border/20 hover:border-border/40 hover:bg-muted/10",
        )}
      >
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) process(f);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" /> Uploading…
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-muted/30 mb-2.5">
              <Upload size={16} className="text-muted-foreground/60" />
            </div>
            <p className="text-xs font-medium text-foreground/70">
              Drop file or{" "}
              <span className="text-color underline cursor-pointer">
                browse
              </span>
            </p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">
              PDF, PNG, DOC, XLS, ZIP · Max {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE LIST
// ─────────────────────────────────────────────────────────────────────────────

function FileList({
  files,
  canDelete = false,
  onDelete,
}: {
  files: TransformedFile[];
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  if (!files.length)
    return (
      <p className="text-xs text-muted-foreground italic py-2">
        No files attached
      </p>
    );
  return (
    <div className="space-y-1.5">
      {files.map((f) => {
        const Icon = getFileIcon(f.fileName ?? "file.bin");
        return (
          <div
            key={f.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/20 border border-border/10 group hover:bg-muted/30 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
              <Icon size={13} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {f.fileName ?? "File"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(f.fileSize)}
              </p>
            </div>
            <Link
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-color shrink-0 transition-colors"
            >
              <Download size={12} />
            </Link>
            {canDelete && onDelete && (
              <Button
              variant={'ghost'}
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteClientFile(f.id);
                    if (r.success) onDelete(f.id);
                    else toast.error(r.error);
                  })
                }
                className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE CARD
// ─────────────────────────────────────────────────────────────────────────────

interface QuoteCardProps {
  quote: import("./types").TransformedQuote;
  hasAccepted: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isPending: boolean;
}

function QuoteCard({
  quote,
  hasAccepted,
  onAccept,
  onReject,
  isPending,
}: QuoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const price = parseFloat(quote.price);
  const isSent = quote.status === "SENT";
  const qcfg =
    QUOTE_STATUS_CONFIG[quote.status] ?? QUOTE_STATUS_CONFIG["DRAFT"];
  const QIcon = qcfg.icon;
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all",
        expanded
          ? "border-border/30 bg-card/60"
          : "border-border/10 bg-card/20",
        isSent &&
          !hasAccepted &&
          "border-violet-500/20 shadow-sm shadow-violet-500/5",
      )}
    >
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-lg font-bold text-foreground">
              {quote.currency}{" "}
              {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">
              Rev. {quote.revision}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border leading-none",
                qcfg.chip,
              )}
            >
              <QIcon size={9} /> {qcfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            From {quote.createdBy?.fullName ?? "Sourcing team"}
            {quote.validUntil &&
              ` · Valid until ${format(new Date(quote.validUntil), "MMM d, yyyy")}`}
          </p>
        </div>
        {isSent && !hasAccepted && (
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              disabled={isPending}
              onClick={() => onAccept(quote.id)}
              className="flex items-center gap-1 h-7 px-3 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Check size={11} />
              )}
              Accept
            </button>
            <button
              disabled={isPending}
              onClick={() => onReject(quote.id)}
              className="flex items-center gap-1 h-7 px-2.5 text-xs font-semibold rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
            >
              <X size={11} /> Reject
            </button>
          </div>
        )}
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-180",
          )}
        />
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/10 pt-3.5 space-y-3">
              {quote.adminNotes && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Notes from sourcing team
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {quote.adminNotes}
                  </p>
                </div>
              )}
              {quote.files?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Attachments
                  </p>
                  <FileList files={quote.files} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

type DetailTab = "overview" | "quotes" | "files" | "timeline";

function RequestDetailModal({
  request: initialReq,
  onClose,
  onActionComplete,
}: {
  request: ClientRequestWithRelations;
  onClose: () => void;
  onActionComplete: (updated?: Partial<ClientRequestWithRelations>) => void;
}) {
  const [req, setReq] = useState(initialReq);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [isPending, startTransition] = useTransition();

  const cfg = STATUS_CONFIG[req.status];
  const CfgIcon = cfg.icon;

  const handleAccept = (quoteId: string) =>
    startTransition(async () => {
      const r = await acceptQuote(quoteId);
      if (r.success) {
        toast.success("Quote accepted!");
        onActionComplete();
        onClose();
      } else toast.error(r.error);
    });

  const handleReject = (quoteId: string) =>
    startTransition(async () => {
      const r = await rejectQuote(quoteId);
      if (r.success) {
        toast.success("Quote rejected.");
        onActionComplete();
        onClose();
      } else toast.error(r.error);
    });

  const TABS: { id: DetailTab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "quotes", label: "Quotes", count: req.quotes.length },
    { id: "files", label: "Files", count: req.files.length },
    { id: "timeline", label: "Timeline", count: req.statusHistory.length },
  ];

  const sentQuotes = req.quotes.filter((q) => q.status === "SENT");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border/15 bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 border-b border-border/10">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br",
              cfg.gradient,
            )}
          >
            <CfgIcon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={req.status} />
              <span className="text-[10px] text-muted-foreground font-mono">
                #{req.id.slice(-8).toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
              {req.description
                ? req.description.slice(0, 55) +
                  (req.description.length > 55 ? "…" : "")
                : "Product Request"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(req.createdAt), "MMM d, yyyy · h:mm a")}
            </p>
          </div>
          <Button
          variant={'ghost'}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Pending quotes alert */}
        {sentQuotes.length > 0 && !req.acceptedQuoteId && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Send size={12} className="text-violet-400 shrink-0" />
            <p className="text-xs text-violet-300 flex-1">
              <strong>{sentQuotes.length}</strong> quote
              {sentQuotes.length > 1 ? "s" : ""} waiting for your decision.
            </p>
            <button
              onClick={() => setTab("quotes")}
              className="text-xs text-violet-400 hover:underline font-medium shrink-0"
            >
              Review →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border/10 px-4 mt-1 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                tab === t.id
                  ? "border-color text-color"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                    tab === t.id
                      ? "bg-color/15 text-color"
                      : "bg-muted/50 text-muted-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {tab === "overview" && (
            <>
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl p-3.5 border",
                  cfg.chip,
                )}
              >
                <CfgIcon size={13} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{cfg.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      label: "Description",
                      value: req.description,
                      full: true,
                    },
                    {
                      label: "Quantity",
                      value: req.quantity.toLocaleString() + " units",
                    },
                    { label: "Shipping Country", value: req.shippingCountry },
                    req.customNotes
                      ? {
                          label: "Your Notes",
                          value: req.customNotes,
                          full: true,
                        }
                      : null,
                  ] as any[]
                )
                  .filter(Boolean)
                  .map((item: any) => (
                    <div
                      key={item.label}
                      className={cn("space-y-1", item.full && "col-span-2")}
                    >
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {item.value ?? (
                          <span className="italic text-muted-foreground">
                            —
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
              </div>
              {req.productLink && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-muted/20 border border-border/10">
                  <Globe size={13} className="text-muted-foreground shrink-0" />
                  <a
                    href={req.productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-color hover:underline flex items-center gap-1 flex-1 min-w-0 truncate"
                  >
                    {req.productLink}
                    <ExternalLink size={10} className="shrink-0" />
                  </a>
                </div>
              )}
              {req.aiEstimatedPrice && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-400/15">
                  <Sparkles size={13} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      AI Estimate
                    </p>
                    <p className="text-sm font-bold text-amber-400">
                      ${parseFloat(req.aiEstimatedPrice).toLocaleString()}
                      {req.aiConfidence && (
                        <span className="text-xs font-normal text-muted-foreground ml-1.5">
                          {Math.round(req.aiConfidence * 100)}% confidence
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {req.priority > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-px">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={
                          i < req.priority
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/20"
                        }
                      />
                    ))}
                  </div>
                  <span>Priority {req.priority}/5</span>
                </div>
              )}
            </>
          )}

          {tab === "quotes" &&
            (req.quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
                  <FileText size={24} className="text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-foreground/60">
                  No quotes yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Our sourcing team will get back to you soon.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {req.quotes.map((q) => (
                  <QuoteCard
                    key={q.id}
                    quote={q}
                    hasAccepted={!!req.acceptedQuoteId}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    isPending={isPending}
                  />
                ))}
              </div>
            ))}

          {tab === "files" && (
            <div className="space-y-3">
              <FileList
                files={req.files}
                canDelete={["SUBMITTED", "IN_REVIEW"].includes(req.status)}
                onDelete={(id) =>
                  setReq((prev) => ({
                    ...prev,
                    files: prev.files.filter((f) => f.id !== id),
                  }))
                }
              />
              {["SUBMITTED", "IN_REVIEW"].includes(req.status) && (
                <FileUploadZone
                  requestId={req.id}
                  onUploaded={(f) =>
                    setReq((prev) => ({ ...prev, files: [...prev.files, f] }))
                  }
                />
              )}
              {!["SUBMITTED", "IN_REVIEW"].includes(req.status) && (
                <p className="text-xs text-muted-foreground">
                  File uploads are disabled once your request is in progress.
                </p>
              )}
            </div>
          )}

          {tab === "timeline" &&
            (req.statusHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">
                No history yet
              </p>
            ) : (
              <div className="space-y-0">
                {req.statusHistory.map((h, i) => {
                  const newCfg = STATUS_CONFIG[h.newStatus];
                  return (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            i === 0 ? newCfg.dot : "bg-border/60",
                          )}
                        />
                        {i < req.statusHistory.length - 1 && (
                          <div className="w-px flex-1 min-h-6 bg-border/20 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={h.oldStatus} />
                          <span className="text-xs text-muted-foreground">
                            →
                          </span>
                          <StatusBadge status={h.newStatus} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {format(
                            new Date(h.changedAt),
                            "MMM d, yyyy · h:mm a",
                          )}
                          {h.changedBy?.fullName && (
                            <span className="ml-1.5">
                              by {h.changedBy.fullName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/10 bg-muted/5 shrink-0">
          <span className="text-[10px] text-muted-foreground">
            Updated {format(new Date(req.updatedAt), "MMM d, yyyy")}
          </span>
          <button
            onClick={onClose}
            className="h-8 px-3.5 text-xs font-medium rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE REQUEST DIALOG — upgraded with step indicator + framer transitions
// ─────────────────────────────────────────────────────────────────────────────

function StepDot({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all border",
        active && "bg-color border-color text-white shadow-sm shadow-color/30",
        done && "bg-color/15 border-color/30 text-color",
        !active &&
          !done &&
          "bg-muted/30 border-border/20 text-muted-foreground",
      )}
    >
      {done ? <Check size={10} /> : step}
    </div>
  );
}

function CreateRequestDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [files, setFiles] = useState<TransformedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // FIX #2 & #3 — cast resolver to match explicit FormValues type
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      productLink: "",
      description: "",
      quantity: 1,
      shippingCountry: "",
      customNotes: "",
    },
  });

  const reset = () => {
    form.reset();
    setCreatedId(null);
    setFiles([]);
    setError(null);
  };

  const onSubmit = (data: FormValues) => {
    setError(null);
    startTransition(async () => {
      const r = await createProductRequest(data);
      if (r.success) {
        setCreatedId(r.data.id);
      } else {
        setError(
          r.error === "UPGRADE_REQUIRED"
            ? "You need an active plan to submit requests. Please upgrade."
            : r.error,
        );
      }
    });
  };

  if (!open) return null;

  const currentStep = createdId ? 2 : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          reset();
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-xl rounded-2xl border border-border/15 bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 px-5 pt-5 pb-4 border-b border-border/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-color/15">
            <Package size={18} className="text-color" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              New Product Request
            </h2>
            <p className="text-xs text-muted-foreground">
              Tell us what you need sourced
            </p>
          </div>

          {/* Step pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <StepDot step={1} current={currentStep} />
            <div className="w-5 h-px bg-border/30" />
            <StepDot step={2} current={currentStep} />
          </div>

          <Button
          variant={'ghost'}
            onClick={() => {
              reset();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all ml-1"
          >
            <X size={16} />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {createdId ? (
            /* ── Step 2: attach files ──────────────────────────────── */
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-5 space-y-4"
            >
              {/* Success banner */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-500/8 border border-emerald-400/15">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 shrink-0">
                  <Check size={15} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Request submitted!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We'll review it and get back to you soon.
                  </p>
                </div>
              </div>

              {/* Upload area */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Upload size={12} className="text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Attach product images, specs, or reference files
                    <span className="font-normal text-muted-foreground/60 ml-1">
                      (optional)
                    </span>
                  </p>
                </div>
                <FileUploadZone
                  requestId={createdId}
                  onUploaded={(f) => setFiles((prev) => [...prev, f])}
                />
                {files.length > 0 && (
                  <FileList
                    files={files}
                    canDelete
                    onDelete={(id) =>
                      setFiles((prev) => prev.filter((f) => f.id !== id))
                    }
                  />
                )}
              </div>

              <button
                onClick={() => {
                  reset();
                  onSuccess(createdId);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 h-9 text-sm font-semibold rounded-xl bg-color hover:bg-color/90 text-white transition-colors"
              >
                <ArrowRight size={14} /> Done — view my requests
              </button>
            </motion.div>
          ) : (
            /* ── Step 1: form ─────────────────────────────────────── */
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-5"
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <StickyNote size={11} /> Description{" "}
                          <span className="text-red-400 font-normal">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What product do you need? Include brand, specs, colour…"
                            rows={3}
                            className="resize-none text-sm bg-muted/20 border-border/20 rounded-xl focus-visible:border-color/40 focus-visible:ring-1 focus-visible:ring-color/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Hash size={11} /> Quantity{" "}
                            <span className="text-red-400 font-normal">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              className="h-9 text-sm bg-muted/20 border-border/20 rounded-xl focus-visible:border-color/40 focus-visible:ring-1 focus-visible:ring-color/20"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <MapPin size={11} /> Country{" "}
                            <span className="text-red-400 font-normal">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. France"
                              className="h-9 text-sm bg-muted/20 border-border/20 rounded-xl focus-visible:border-color/40 focus-visible:ring-1 focus-visible:ring-color/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="productLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <Link2 size={11} /> Product URL
                          <span className="font-normal text-muted-foreground/60">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://alibaba.com/…"
                            className="h-9 text-sm bg-muted/20 border-border/20 rounded-xl focus-visible:border-color/40 focus-visible:ring-1 focus-visible:ring-color/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <Tag size={11} /> Additional Notes
                          <span className="font-normal text-muted-foreground/60">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Packaging requirements, certifications, deadline…"
                            rows={2}
                            className="resize-none text-sm bg-muted/20 border-border/20 rounded-xl focus-visible:border-color/40 focus-visible:ring-1 focus-visible:ring-color/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-400/15 text-red-400 text-xs">
                      <AlertTriangle size={12} /> {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        reset();
                        onClose();
                      }}
                      className="flex-1 h-9 text-sm font-medium rounded-xl border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 text-sm font-semibold rounded-xl bg-color hover:bg-color/90 text-white transition-colors disabled:opacity-60"
                    >
                      {isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Submit Request
                    </button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST CARD
// ─────────────────────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onClick,
  onDelete,
}: {
  request: ClientRequestWithRelations;
  onClick: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sentQuotes = request.quotes.filter((q) => q.status === "SENT");
  const hasAction = sentQuotes.length > 0 && !request.acceptedQuoteId;
  const cfg = STATUS_CONFIG[request.status];

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl border p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        hasAction
          ? "border-violet-500/25 bg-card/60 shadow-sm shadow-violet-500/5"
          : "border-border/10 bg-card/40 hover:border-border/25 hover:bg-card/60",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-linear-to-r opacity-50",
          cfg.gradient,
        )}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={request.status} />
          {hasAction && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-400/20 px-2 py-0.5 rounded-full leading-none">
              <Send size={9} /> {sentQuotes.length} waiting
            </span>
          )}
          {request.acceptedQuoteId && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded-full leading-none">
              <CheckCircle2 size={9} /> Accepted
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
          {isToday(new Date(request.createdAt))
            ? `Today ${format(new Date(request.createdAt), "h:mm a")}`
            : format(new Date(request.createdAt), "MMM d")}
        </p>
      </div>

      <p className="mt-2.5 text-sm font-medium text-foreground/90 line-clamp-2 leading-snug">
        {request.description ?? (
          <span className="italic text-muted-foreground">No description</span>
        )}
      </p>

      <div className="flex items-center gap-2 mt-2.5 text-[11px] text-muted-foreground flex-wrap">
        <span className="font-mono font-semibold text-foreground/70">
          {request.quantity.toLocaleString()} units
        </span>
        <span className="text-border/60">·</span>
        <span>{request.shippingCountry}</span>
        {request.productLink && (
          <>
            <span className="text-border/60">·</span>
            <a
              href={request.productLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-color hover:underline flex items-center gap-0.5 transition-colors"
            >
              <ExternalLink size={10} /> Link
            </a>
          </>
        )}
        {request.files.length > 0 && (
          <>
            <span className="text-border/60">·</span>
            <span>
              {request.files.length} file{request.files.length > 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/8">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <FileText size={11} />
          {request.quotes.length === 0
            ? "No quotes yet"
            : `${request.quotes.length} quote${request.quotes.length > 1 ? "s" : ""}`}
        </div>
        {request.status === "SUBMITTED" && (
          <Button
          variant={'ghost'}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border/15 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-muted-foreground mb-2.5">
              Permanently delete this request?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-7 text-xs font-medium rounded-lg border border-border/20 text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await deleteMyRequest(request.id);
                    if (r.success) {
                      onDelete(request.id);
                      toast.success("Request deleted");
                    } else toast.error(r.error);
                    setConfirmDelete(false);
                  })
                }
                className="flex-1 flex items-center justify-center gap-1 h-7 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

function ClientPagination({ pagination }: { pagination: PaginationInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { page, totalPages, totalCount, pageSize } = pagination;

  const go = (p: number) => {
    const sp = new URLSearchParams(params);
    sp.set("page", p.toString());
    router.push(`${pathname}?${sp.toString()}`);
  };

  if (totalPages <= 1) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between pt-2">
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
      <div className="flex items-center gap-1">
        <Button
        variant={'ghost'}
          onClick={() => page > 1 && go(page - 1)}
          disabled={page <= 1}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all",
            page > 1
              ? "border-border/20 hover:border-border/40 hover:text-foreground hover:bg-muted/20"
              : "border-border/10 opacity-40 cursor-not-allowed",
          )}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-xs text-muted-foreground px-3 tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
        variant={'ghost'}
          onClick={() => page < totalPages && go(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all",
            page < totalPages
              ? "border-border/20 hover:border-border/40 hover:text-foreground hover:bg-muted/20"
              : "border-border/10 opacity-40 cursor-not-allowed",
          )}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT: MyRequestsClient
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS: { value: RequestStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "QUOTED", label: "Quoted" },
  { value: "APPROVED", label: "Approved" },
  { value: "IN_PRODUCTION", label: "Production" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "COMPLETED", label: "Done" },
];

interface Props {
  initialRequests: ClientRequestWithRelations[];
  initialPagination: PaginationInfo;
  filters: ClientFiltersType;
  plan: UserPlanInfo;
}

export function MyRequestsClient({
  initialRequests,
  initialPagination,
  filters,
  plan,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [requests, setRequests] =
    useState<ClientRequestWithRelations[]>(initialRequests);
  const [pagination, setPagination] =
    useState<PaginationInfo>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReq, setSelectedReq] =
    useState<ClientRequestWithRelations | null>(null);

  const activeStatus = (params.get("status") ?? "") as RequestStatus | "";
  const activePage = parseInt(params.get("page") ?? "1");

  // FIX #1 — guard r.data before accessing its properties
  useEffect(() => {
    let cancelled = false;
    async function fetchPage() {
      setLoading(true);
      try {
        const { getMyRequests } = await import("../actions");
        const r = await getMyRequests({
          page: activePage,
          pageSize: filters.pageSize,
          status: (activeStatus as RequestStatus) || undefined,
        });
        if (!cancelled && r.success && r.data) {
          setRequests(r.data.requests as ClientRequestWithRelations[]);
          setPagination(r.data.pagination);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPage();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, activePage]);

  useEffect(() => {
    setRequests(initialRequests);
    setPagination(initialPagination);
  }, [initialRequests, initialPagination]);

  const setStatusFilter = (s: string) => {
    const sp = new URLSearchParams(params);
    s ? sp.set("status", s) : sp.delete("status");
    sp.set("page", "1");
    router.push(`${pathname}?${sp.toString()}`);
  };

  const handleDeleted = (id: string) =>
    setRequests((prev) => prev.filter((r) => r.id !== id));

  const handleCreated = useCallback(async () => {
    setCreateOpen(false);
    setLoading(true);
    try {
      const { getMyRequests } = await import("../actions");
      const r = await getMyRequests({
        page: 1,
        pageSize: filters.pageSize,
        status: (activeStatus as RequestStatus) || undefined,
      });
      // FIX #1 applied here too
      if (r.success && r.data) {
        setRequests(r.data.requests as ClientRequestWithRelations[]);
        setPagination(r.data.pagination);
      }
    } finally {
      setLoading(false);
    }
    const sp = new URLSearchParams(params);
    sp.set("page", "1");
    router.replace(`${pathname}?${sp.toString()}`);
  }, [activeStatus, filters.pageSize, params, pathname, router]);

  const pendingQuoteCount = requests.reduce(
    (acc, r) => acc + r.quotes.filter((q) => q.status === "SENT").length,
    0,
  );

  return (
    <div className="space-y-5">
      <PlanBanner plan={plan} />

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {pagination.totalCount} request
            {pagination.totalCount !== 1 ? "s" : ""}
            {pendingQuoteCount > 0 && (
              <span className="ml-2 text-violet-400 font-semibold">
                · {pendingQuoteCount} quote{pendingQuoteCount > 1 ? "s" : ""}{" "}
                waiting
              </span>
            )}
          </p>
          {loading && (
            <Loader2 size={12} className="animate-spin text-muted-foreground" />
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          disabled={!plan.hasAccess}
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-xl bg-color hover:bg-color/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> New Request
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map((t) => {
          const active = activeStatus === t.value;
          const scfg = t.value ? STATUS_CONFIG[t.value] : null;
          return (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                active
                  ? "bg-color/15 text-color border-color/25"
                  : "text-muted-foreground bg-muted/15 border-transparent hover:border-border/20 hover:text-foreground",
              )}
            >
              {scfg && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    active ? scfg.dot : "bg-muted-foreground/30",
                  )}
                />
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Grid / skeleton / empty */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/8 bg-card/40 h-44 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-border/10"
          >
            <PackageSearch size={26} className="text-muted-foreground/30" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-foreground/70">
              No requests yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Submit your first product request and our team will source it for
              you.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            disabled={!plan.hasAccess}
            className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-xl bg-color hover:bg-color/90 text-white transition-colors disabled:opacity-50"
          >
            <Plus size={14} /> Submit first request
          </button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {requests.map((r) => (
            <motion.div
              key={r.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <RequestCard
                request={r}
                onClick={() => setSelectedReq(r)}
                onDelete={handleDeleted}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <ClientPagination pagination={pagination} />

      <CreateRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />

      <AnimatePresence>
        {selectedReq && (
          <RequestDetailModal
            request={selectedReq}
            onClose={() => setSelectedReq(null)}
            onActionComplete={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
