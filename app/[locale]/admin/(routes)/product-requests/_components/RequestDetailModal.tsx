"use client";

// app/[locale]/admin/(routes)/product-requests/_components/RequestDetailModal.tsx

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  FileText,
  ExternalLink,
  Loader2,
  Check,
  AlertTriangle,
  ChevronDown,
  Send,
  Clock,
  DollarSign,
  Bot,
  Star,
  Eye,
  RefreshCw,
  Download,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuoteStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  getProductRequest,
  createQuote,
  updateQuoteStatus,
  deleteQuote,
  uploadFile,
  deleteFile,
  generateAIQuote,
  updateRequestStatus,
} from "../actions";
import { StatusBadge } from "./RequestsTable";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  getFileIcon,
  formatFileSize,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_MB,
} from "./types";
import type {
  RequestWithRelations,
  TransformedQuote,
  TransformedFile,
} from "./types";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const QUOTE_STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; chip: string }
> = {
  DRAFT: {
    label: "Draft",
    chip: "text-muted-foreground ring-border/30 bg-muted/40",
  },
  SENT: {
    label: "Sent",
    chip: "text-violet-600  dark:text-violet-400 ring-violet-400/30 bg-violet-500/8",
  },
  ACCEPTED: {
    label: "Accepted",
    chip: "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 bg-emerald-500/8",
  },
  REJECTED: {
    label: "Rejected",
    chip: "text-red-600     dark:text-red-400    ring-red-400/30    bg-red-500/8",
  },
};

function QuoteBadge({ status }: { status: QuoteStatus }) {
  const cfg = QUOTE_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 leading-none",
        cfg.chip,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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
// FILE UPLOAD ZONE
// ─────────────────────────────────────────────────────────────────────────────

interface FileUploadZoneProps {
  requestId?: string;
  quoteId?: string;
  onUploaded: (file: TransformedFile) => void;
}

function FileUploadZone({
  requestId,
  quoteId,
  onUploaded,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      if (requestId) fd.append("requestId", requestId);
      if (quoteId) fd.append("quoteId", quoteId);
      const r = await uploadFile(fd);
      setUploading(false);
      if (r.success) {
        onUploaded({
          id: r.data.id,
          url: r.data.url,
          fileType: file.type,
          fileName: r.data.fileName,
          fileSize: file.size,
          requestId: requestId ?? null,
          quoteId: quoteId ?? null,
          uploadedById: null,
          createdAt: new Date(),
        });
      } else {
        setError(r.error);
      }
    },
    [requestId, quoteId, onUploaded],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) processFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
          isDragging
            ? "border-[#7b57fc]/50 bg-[#7b57fc]/5"
            : "border-border/40 hover:border-border/70 hover:bg-muted/20",
        )}
      >
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={15} className="animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload
              size={18}
              className="mx-auto text-muted-foreground/40 mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Drop a file or{" "}
              <span className="text-[#7b57fc] underline">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              PDF, PNG, JPG, DOC, XLS, ZIP · Max {MAX_FILE_SIZE_MB}MB
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
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
  onDelete,
  canDelete = true,
}: {
  files: TransformedFile[];
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!files.length)
    return (
      <p className="text-xs text-muted-foreground italic">No files attached</p>
    );

  return (
    <div className="space-y-1.5">
      {files.map((f) => {
        const Icon = getFileIcon(f.fileName ?? "file.bin");
        return (
          <div
            key={f.id}
            className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/20 border border-border/30 hover:border-border/50 transition-colors"
          >
            <span className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg bg-muted/60">
              <Icon size={13} className="text-muted-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {f.fileName ?? "Unknown file"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(f.fileSize)}
              </p>
            </div>
            <Link
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-[#7b57fc] transition-colors shrink-0"
            >
              <Download size={13} />
            </Link>
            {canDelete && onDelete && (
              <Button
                variant={"ghost"}
                type="button"
                onClick={() => setDeletingId(f.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </Button>
            )}
            <ConfirmDialog
              open={deletingId === f.id}
              onOpenChange={(open) => !open && setDeletingId(null)}
              title="Delete file?"
              description={`Remove "${f.fileName}" permanently?`}
              variant="danger"
              confirmLabel="Delete"
              onConfirm={() => {
                startTransition(async () => {
                  await deleteFile(f.id);
                  setDeletingId(null);
                  onDelete?.(f.id);
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE QUOTE FORM
// ─────────────────────────────────────────────────────────────────────────────

interface QuoteFormProps {
  requestId: string;
  aiEstimate?: string;
  onCreated: (id: string) => void;
  onCancel: () => void;
}

function CreateQuoteForm({
  requestId,
  aiEstimate,
  onCreated,
  onCancel,
}: QuoteFormProps) {
  const [price, setPrice] = useState(aiEstimate ?? "");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [files, setFiles] = useState<TransformedFile[]>([]);

  const handleSubmit = () => {
    const priceNum = parseFloat(price);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Enter a valid price");
      return;
    }

    setError(null);

    startTransition(async () => {
      const r = await createQuote({
        requestId,
        price: priceNum,
        currency,
        adminNotes: notes || undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        status,
      });

      if (r.success && r.data) {
        setCreatedId(r.data.id);
      } else {
        setError(r.error ?? "Something went wrong");
      }
    });
  };

  if (createdId) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-emerald-500">
          <span className="h-6 w-6 flex items-center justify-center rounded-full bg-emerald-500/15">
            <Check size={12} />
          </span>
          <span className="text-sm font-semibold">Quote created</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Optionally attach files to this quote:
        </p>
        <FileUploadZone
          quoteId={createdId}
          onUploaded={(f) => setFiles((p) => [...p, f])}
        />
        <FileList
          files={files}
          onDelete={(id) => setFiles((p) => p.filter((f) => f.id !== id))}
        />
        <button
          type="button"
          onClick={() => onCreated(createdId)}
          className="w-full h-8 text-xs font-medium rounded-xl bg-[#7b57fc] hover:bg-[#6a48e8] text-white transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 space-y-4">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-5 w-5 flex items-center justify-center rounded-md bg-[#7b57fc]/10">
          <Plus size={12} className="text-[#7b57fc]" />
        </span>
        New Quote
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Price *
          </label>
          <div className="relative">
            <DollarSign
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="pl-7 h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Currency
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full h-8 text-sm px-3 flex items-center justify-between rounded-lg border border-border/50 bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                {currency}{" "}
                <ChevronDown size={12} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1">
              {["USD", "EUR", "GBP", "CNY"].map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-muted/60",
                    currency === c ? "text-[#7b57fc]" : "",
                  )}
                >
                  {c}{" "}
                  {currency === c && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7b57fc]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Valid Until
        </label>
        <Input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          className="h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Admin Notes (visible to client)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Pricing breakdown, lead time, MOQ details…"
          rows={3}
          className="text-xs resize-none bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Save as:
        </span>
        {(["DRAFT", "SENT"] as QuoteStatus[]).map((s) => {
          const cfg = QUOTE_STATUS_CONFIG[s];
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg border font-medium transition-all",
                active
                  ? `ring-1 border-transparent ${cfg.chip}`
                  : "border-border/50 text-muted-foreground hover:border-border",
              )}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-8 text-xs font-medium rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 h-8 text-xs font-medium rounded-xl bg-[#7b57fc] hover:bg-[#6a48e8] text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          Create Quote
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI QUOTE PANEL
// ─────────────────────────────────────────────────────────────────────────────

function AIQuotePanel({
  requestId,
  hasEstimate,
  onGenerated,
}: {
  requestId: string;
  hasEstimate: boolean;
  onGenerated: (estimate: string, notes: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    estimatedPrice: string;
    confidence: number;
    reasoning: string;
    suggestedNotes: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const r = await generateAIQuote(requestId);
      if (r.success) {
        setResult(r.data);
        setOpen(true);
        onGenerated(r.data.estimatedPrice, r.data.suggestedNotes);
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 flex items-center justify-center rounded-lg bg-amber-500/15">
            <Sparkles size={14} className="text-amber-500" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            AI Quote Generator
          </span>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="h-7 px-3 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Analysing…
            </>
          ) : (
            <>
              <Bot size={11} /> {hasEstimate ? "Regenerate" : "Generate"}
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Uses AI to analyse the request and suggest a competitive price,
        confidence score, and client-ready notes.
      </p>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}

      {result && open && (
        <div className="space-y-3 pt-2 border-t border-amber-400/15">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">
              ${parseFloat(result.estimatedPrice).toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                USD
              </span>
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 bg-border/30 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" />
              </div>
              <span className="text-xs text-amber-500 font-semibold">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Reasoning
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {result.reasoning}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Suggested client notes
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed italic">
              "{result.suggestedNotes}"
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X size={10} /> Collapse
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTES LIST
// ─────────────────────────────────────────────────────────────────────────────

function QuotesList({
  quotes,
  onRefresh,
}: {
  quotes: TransformedQuote[];
  onRefresh: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (quoteId: string, newStatus: QuoteStatus) => {
    startTransition(async () => {
      await updateQuoteStatus(quoteId, newStatus);
      onRefresh();
    });
  };

  if (!quotes.length)
    return (
      <p className="text-xs text-muted-foreground italic">No quotes yet</p>
    );

  return (
    <div className="space-y-2">
      {quotes.map((q) => {
        const isExpanded = expandedId === q.id;
        return (
          <div
            key={q.id}
            className={cn(
              "rounded-2xl border transition-all",
              isExpanded
                ? "border-border/50 bg-card/60"
                : "border-border/30 bg-card/30",
            )}
          >
            {/* Header row */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums">
                    ${parseFloat(q.price).toLocaleString()} {q.currency}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Rev. {q.revision}
                  </span>
                  <QuoteBadge status={q.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <span>by {q.createdBy.fullName ?? q.createdBy.email}</span>
                  {q.validUntil && (
                    <span className="flex items-center gap-0.5">
                      <Clock size={9} /> Until{" "}
                      {format(new Date(q.validUntil), "MMM d")}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {q.status === "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(q.id, "SENT")}
                    className="h-7 px-2 text-xs font-medium rounded-lg text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 flex items-center gap-1 transition-colors"
                  >
                    <Send size={11} /> Send
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={"ghost"}
                      type="button"
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
                    >
                      <ChevronDown size={13} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1"
                  >
                    {q.status !== "SENT" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(q.id, "SENT")}
                        className="flex items-center gap-2 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-muted/60"
                      >
                        <Send size={12} /> Mark Sent
                      </DropdownMenuItem>
                    )}
                    {q.status !== "DRAFT" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(q.id, "DRAFT")}
                        className="flex items-center gap-2 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-muted/60"
                      >
                        <Edit3 size={12} /> Revert to Draft
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setDeleteId(q.id)}
                      className="flex items-center gap-2 text-xs px-2 py-2 rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                    >
                      <Trash2 size={12} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Expanded */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3">
                {q.adminNotes && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Notes
                    </p>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {q.adminNotes}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={10} /> Attachments
                  </p>
                  <FileList files={q.files} canDelete />
                  <div className="mt-2">
                    <FileUploadZone
                      quoteId={q.id}
                      onUploaded={() => onRefresh()}
                    />
                  </div>
                </div>
                {q.statusHistory.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      History
                    </p>
                    <div className="space-y-1">
                      {q.statusHistory.slice(0, 3).map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center gap-2 text-[10px] text-muted-foreground"
                        >
                          <Clock size={9} />
                          <span>
                            {h.oldStatus} → {h.newStatus}
                          </span>
                          <span>
                            by {h.changedBy.fullName ?? h.changedBy.email}
                          </span>
                          <span className="ml-auto tabular-nums">
                            {format(new Date(h.changedAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <ConfirmDialog
              open={deleteId === q.id}
              onOpenChange={(open) => !open && setDeleteId(null)}
              title="Delete quote?"
              description="This will permanently soft-delete this quote revision."
              variant="danger"
              confirmLabel="Delete"
              onConfirm={() => {
                startTransition(async () => {
                  await deleteQuote(q.id);
                  setDeleteId(null);
                  onRefresh();
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "overview" | "quotes" | "files" | "history";

interface Props {
  requestId: string;
  onClose: () => void;
  onActionComplete: () => void;
}

export function RequestDetailModal({
  requestId,
  onClose,
  onActionComplete,
}: Props) {
  const [req, setReq] = useState<RequestWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<string | null>(null);
  const [aiNotes, setAiNotes] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    const r = await getProductRequest(requestId);
    if (r.success) setReq(r.data as RequestWithRelations);
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleRefresh = () => {
    loadRequest();
    onActionComplete();
  };

  if (loading)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  if (!req) return null;

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "quotes", label: "Quotes", count: req.quotes.length },
    { id: "files", label: "Files", count: req.files.length },
    { id: "history", label: "History", count: req.statusHistory.length },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden">
        {/* ── Modal header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0 bg-muted/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={req.client.avatarUrl ?? undefined} />
              <AvatarFallback
                className={cn(
                  "text-xs font-semibold",
                  avatarColor(req.client.email),
                )}
              >
                {(req.client.fullName ?? req.client.email)
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">
                  {req.client.fullName ?? req.client.email}
                </p>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                #{req.id.slice(-8).toUpperCase()} ·{" "}
                {format(new Date(req.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={"ghost"}
              type="button"
              onClick={handleRefresh}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw size={14} />
            </Button>
            <Button
              variant={"ghost"}
              type="button"
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex gap-0 px-5 border-b border-border/40 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                tab === t.id
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none",
                    tab === t.id
                      ? "bg-[#7b57fc]/15 text-[#7b57fc]"
                      : "bg-muted/60 text-muted-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <>
              {/* Client card */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border/30">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={req.client.avatarUrl ?? undefined} />
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold",
                      avatarColor(req.client.email),
                    )}
                  >
                    {(req.client.fullName ?? req.client.email)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {req.client.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {req.client.email}
                  </p>
                  {req.client.phone && (
                    <p className="text-xs text-muted-foreground">
                      {req.client.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Request fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <SectionLabel>Description</SectionLabel>
                    <p className="text-sm text-foreground leading-relaxed mt-1.5">
                      {req.description ?? (
                        <span className="italic text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </p>
                  </div>

                  {req.productLink && (
                    <div>
                      <SectionLabel>Product Link</SectionLabel>
                      <a
                        href={req.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 text-xs text-[#7b57fc] hover:underline flex items-center gap-1 break-all"
                      >
                        <ExternalLink size={11} />
                        {req.productLink.length > 50
                          ? req.productLink.slice(0, 50) + "…"
                          : req.productLink}
                      </a>
                    </div>
                  )}

                  {req.customNotes && (
                    <div>
                      <SectionLabel>Client Notes</SectionLabel>
                      <p className="text-xs text-foreground/80 leading-relaxed mt-1.5">
                        {req.customNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <SectionLabel>Quantity</SectionLabel>
                      <p className="text-xl font-bold font-mono tabular-nums mt-1">
                        {req.quantity.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <SectionLabel>Ship to</SectionLabel>
                      <p className="text-sm font-semibold mt-1">
                        {req.shippingCountry}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                    <SectionLabel>Priority</SectionLabel>
                    <div className="flex items-center gap-2 mt-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < req.priority
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground/20 fill-muted-foreground/20"
                          }
                        />
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {req.priority}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <AIQuotePanel
                requestId={req.id}
                hasEstimate={!!req.aiEstimatedPrice}
                onGenerated={(estimate, notes) => {
                  setAiEstimate(estimate);
                  setAiNotes(notes);
                  setTab("quotes");
                  setShowQuoteForm(true);
                }}
              />
            </>
          )}

          {/* QUOTES */}
          {tab === "quotes" && (
            <>
              <QuotesList quotes={req.quotes} onRefresh={handleRefresh} />
              {showQuoteForm ? (
                <CreateQuoteForm
                  requestId={req.id}
                  aiEstimate={aiEstimate ?? undefined}
                  onCreated={() => {
                    setShowQuoteForm(false);
                    handleRefresh();
                  }}
                  onCancel={() => setShowQuoteForm(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full h-9 text-xs font-medium rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 hover:bg-muted/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={13} /> Add Quote
                  {aiEstimate && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Sparkles size={10} /> AI: $
                      {parseFloat(aiEstimate).toLocaleString()}
                    </span>
                  )}
                </button>
              )}
            </>
          )}

          {/* FILES */}
          {tab === "files" && (
            <>
              <FileList
                files={req.files}
                canDelete
                onDelete={() => handleRefresh()}
              />
              <FileUploadZone
                requestId={req.id}
                onUploaded={() => handleRefresh()}
              />
            </>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <div className="space-y-2">
              {req.statusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No status changes yet
                </p>
              ) : (
                req.statusHistory.map((h, i) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-0.5",
                          i === 0 ? "bg-[#7b57fc]" : "bg-border",
                        )}
                      />
                      {i < req.statusHistory.length - 1 && (
                        <div className="w-px h-6 bg-border/30" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={h.oldStatus} />
                        <span className="text-xs text-muted-foreground">→</span>
                        <StatusBadge status={h.newStatus} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        by {h.changedBy.fullName ?? h.changedBy.email}
                        {" · "}
                        {format(new Date(h.changedAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-border/40 shrink-0 flex items-center justify-between bg-muted/10">
          <span className="text-[10px] text-muted-foreground">
            Updated {format(new Date(req.updatedAt), "MMM d, yyyy h:mm a")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-7 px-3 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
