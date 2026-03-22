"use client";
// app/[locale]/admin/(routes)/consulting/_components/ConsultingPageClient.tsx

import {
  useState,
  useTransition,
  useRef,
  useCallback,
  useEffect,
  Fragment,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  // Layout & navigation
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Eye,
  MoreHorizontal,
  // Status & feedback
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  // Content icons
  MessageSquare,
  Briefcase,
  Users,
  BarChart3,
  TrendingUp,
  Star,
  Package,
  Settings,
  Trash2,
  Edit3,
  Send,
  StickyNote,
  // Topic icons
  ShoppingCart,
  Ship,
  Truck,
  Globe,
  Factory,
  Clock,
  // Service icons
  DollarSign,
  Calendar,
  Layers,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Tag,
  ListChecks,
  FileText,
  Sparkles,
  Eye as EyeIcon,
  // Image management
  Upload,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  // Request actions
  updateConsultingStatus,
  updateConsultingNotes,
  deleteConsultingRequest,
  replyToConsultingRequest,
  // Service actions
  createConsultingService,
  updateConsultingService,
  deleteConsultingService,
  toggleConsultingServiceActive,
  // Image actions
  uploadServiceImage,
  deleteServiceImage,
  setPrimaryServiceImage,
  reorderServiceImages,
} from "../actions";
import type {
  ConsultingRequestWithUser,
  ConsultingStatus,
  ConsultingServiceFull,
  ConsultingTopic,
  ServiceImage,
} from "../actions";
import {
  ConsultingServiceTopic,
  ConsultingDeliveryFormat,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const REQ_STATUS_CFG = {
  NEW: {
    label: "New",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-500",
  },
  IN_REVIEW: {
    label: "In Review",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-500",
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    color: "text-muted-foreground",
    bg: "bg-muted/40 border-border/50",
    dot: "bg-muted-foreground",
  },
} as const;

const ALL_REQ_STATUSES = ["NEW", "IN_REVIEW", "SCHEDULED", "CLOSED"] as const;

const TOPIC_CFG = {
  sourcing: { label: "Product Sourcing", icon: ShoppingCart },
  import: { label: "Import & Customs", icon: Ship },
  logistics: { label: "Logistics", icon: Truck },
  market_entry: { label: "Market Entry", icon: Globe },
  supplier: { label: "Supplier Sourcing", icon: Factory },
  other: { label: "General Consulting", icon: Briefcase },
} as const;

const DELIVERY_CFG = {
  video_call: "Video Call",
  written_report: "Written Report",
  on_site: "On-Site",
  hybrid: "Hybrid",
  async: "Async",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg =
    REQ_STATUS_CFG[status as keyof typeof REQ_STATUS_CFG] ?? REQ_STATUS_CFG.NEW;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap",
        cfg.bg,
        cfg.color,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function TopicTag({ topic, small }: { topic: string; small?: boolean }) {
  const cfg = TOPIC_CFG[topic as keyof typeof TOPIC_CFG];
  if (!cfg)
    return <span className="text-xs text-muted-foreground">{topic}</span>;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-muted-foreground",
        small ? "text-[10px]" : "text-xs",
      )}
    >
      <Icon className={small ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {cfg.label}
    </span>
  );
}

function Pagination({
  pagination,
  paramKey = "page",
  onPage,
}: {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  paramKey?: string;
  onPage: (p: number) => void;
}) {
  const { page, pageSize, totalCount, totalPages } = pagination;
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const range = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - range && i <= page + range))
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
              variant={p === page ? "default" : "outline"}
              size="icon"
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
    requests: {
      total: number;
      byStatus: Record<string, number>;
      thisWeek: number;
    };
    services: {
      total: number;
      active: number;
      featured: number;
      totalRequests: number;
    };
  };
}) {
  const cards = [
    {
      label: "Total Requests",
      value: stats.requests.total,
      icon: MessageSquare,
      gradient: "from-[#7b57fc] to-[#2b1cff]",
      shadow: "shadow-[#7b57fc]/20",
    },
    {
      label: "New",
      value: stats.requests.byStatus["NEW"] ?? 0,
      icon: AlertCircle,
      gradient: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
    },
    {
      label: "This Week",
      value: stats.requests.thisWeek,
      icon: TrendingUp,
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Active Services",
      value: stats.services.active,
      icon: Briefcase,
      gradient: "from-pink-500 to-rose-500",
      shadow: "shadow-pink-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, gradient, shadow }, i) => (
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
              gradient,
            )}
          />
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
              gradient,
              shadow,
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

// ═════════════════════════════════════════════════════════════════════════════
// ── TAB 1: REQUESTS ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Request Detail Dialog
// ─────────────────────────────────────────────────────────────────────────────

function RequestDetailDialog({
  item,
  open,
  onClose,
  onDone,
}: {
  item: ConsultingRequestWithUser | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [activeSection, setActiveSection] = useState<
    "info" | "notes" | "reply"
  >("info");
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (item) {
      setNotes(item.adminNotes ?? "");
      setNotesSaved(false);
      setReplySent(false);
      setReplyText("");
      setActiveSection("info");
      setShowDelete(false);
    }
  }, [item?.id]);

  if (!item) return null;
  const TopicIcon =
    TOPIC_CFG[item.topic as keyof typeof TOPIC_CFG]?.icon ?? Briefcase;
  const initials = item.fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleStatus = (status: ConsultingStatus) => {
    start(async () => {
      const r = await updateConsultingStatus(item.id, status);
      if (r.success) {
        toast.success(`Moved to ${REQ_STATUS_CFG[status].label}`);
        onDone();
      } else toast.error(r.error);
    });
  };

  const handleNotesSave = async () => {
    if (notes === (item.adminNotes ?? "")) return;
    setNotesSaving(true);
    const r = await updateConsultingNotes(item.id, notes);
    setNotesSaving(false);
    if (r.success) {
      setNotesSaved(true);
      onDone();
      setTimeout(() => setNotesSaved(false), 2500);
    } else toast.error(r.error);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    start(async () => {
      const r = await replyToConsultingRequest(item.id, replyText.trim());
      if (r.success) {
        setReplySent(true);
        setReplyText("");
        toast.success(item.userId ? "Notification sent" : "Reply logged");
        onDone();
      } else toast.error(r.error);
    });
  };

  const handleDelete = () => {
    start(async () => {
      const r = await deleteConsultingRequest(item.id);
      if (r.success) {
        toast.success("Deleted");
        onClose();
        onDone();
      } else toast.error(r.error);
    });
  };

  const sections = [
    { id: "info", label: "Details", icon: Info },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "reply", label: "Reply", icon: Send },
  ] as const;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className={cn(
  "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
  "[&>button:last-child]:hidden",
)}>
        {/* Header */}
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#7b57fc]/10 flex items-center justify-center text-sm font-bold text-[#7b57fc] shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-foreground truncate max-w-50">
                {item.fullName}
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground truncate">
                {item.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Inline status picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="flex items-center gap-1 focus:outline-none"
                  disabled={isPending}
                >
                  <StatusBadge status={item.status} />
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {ALL_REQ_STATUSES.filter((s) => s !== item.status).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => handleStatus(s)}
                    className="text-xs gap-2"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        REQ_STATUS_CFG[s].dot,
                      )}
                    />
                    Move to {REQ_STATUS_CFG[s].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant={"ghost"}
              onClick={onClose}
              className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Section tabs */}
        <div className="shrink-0 flex border-b border-border/40 px-6">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "flex items-center gap-1.5 px-1 py-2.5 mr-5 text-xs font-semibold border-b-2 transition-colors",
                activeSection === id
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {/* Info section */}
            {activeSection === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Client card */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: MessageSquare,
                      label: "Email",
                      val: item.email,
                      href: `mailto:${item.email}`,
                    },
                    {
                      icon: Clock,
                      label: "Phone",
                      val: item.phone,
                      href: item.phone ? `tel:${item.phone}` : undefined,
                    },
                    {
                      icon: Factory,
                      label: "Company",
                      val: item.company,
                      href: undefined,
                    },
                    {
                      icon: DollarSign,
                      label: "Budget",
                      val: item.budget,
                      href: undefined,
                    },
                  ]
                    .filter((r) => r.val)
                    .map(({ icon: Icon, label, val, href }) => (
                      <div
                        key={label}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40"
                      >
                        <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
                            {label}
                          </p>
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
                    ))}
                </div>

                {/* Topic + linked service */}
                <div className="flex items-center gap-3 flex-wrap">
                  <TopicTag topic={item.topic} />
                  {item.linkedService && (
                    <span className="text-xs text-[#7b57fc] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7b57fc]/8 border border-[#7b57fc]/20">
                      <Briefcase className="w-3 h-3" /> via{" "}
                      {item.linkedService.title}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />{" "}
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Description
                  </p>
                  <div className="bg-muted/20 rounded-xl border border-border/40 p-4">
                    <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notes section */}
            {activeSection === "notes" && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground">
                  Internal notes — client sees them only when status is
                  Scheduled or Closed.
                </p>
                <div className="relative">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesSave}
                    rows={8}
                    placeholder="Add follow-up details, meeting links, schedule notes…"
                    className="resize-none rounded-xl border-border/60 bg-muted/20 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {notesSaving && (
                      <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                    )}
                    {notesSaved && (
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                </div>
                <button
                  onClick={handleNotesSave}
                  disabled={notesSaving || notes === (item.adminNotes ?? "")}
                  className="text-xs text-[#7b57fc] hover:underline underline-offset-2 disabled:opacity-40"
                >
                  {notesSaving
                    ? "Saving…"
                    : notesSaved
                      ? "Saved ✓"
                      : "Save notes"}
                </button>
              </motion.div>
            )}

            {/* Reply section */}
            {activeSection === "reply" && (
              <motion.div
                key="reply"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {item.userId ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Sends an in-app notification to the client's dashboard.
                    </p>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={6}
                      placeholder="We've reviewed your request and will contact you…"
                      className="resize-none rounded-xl border-border/60 bg-muted/20 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
                    />
                    {replySent && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Notification
                        sent
                      </p>
                    )}
                    <Button
                      onClick={handleReply}
                      disabled={isPending || !replyText.trim()}
                      className="h-9 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-xs"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />{" "}
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1.5" /> Send
                          notification
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="rounded-xl border border-border/40 bg-muted/20 p-5 text-center space-y-2">
                    <MessageSquare className="w-7 h-7 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      Contact-form submission — no platform account. Reply
                      directly at{" "}
                      <a
                        href={`mailto:${item.email}`}
                        className="text-[#7b57fc] hover:underline"
                      >
                        {item.email}
                      </a>
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <div>
            {!showDelete ? (
              <Button
                variant={"ghost"}
                onClick={() => setShowDelete(true)}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete request
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Are you sure?</p>
                <Button
                  variant={"ghost"}
                  onClick={handleDelete}
                  disabled={isPending}
                  className="h-7 px-3 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
                <Button
                  variant={"ghost"}
                  onClick={() => setShowDelete(false)}
                  className="h-7 px-3 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground"
                >
                  No
                </Button>
              </div>
            )}
          </div>
          <Button
            variant={"ghost"}
            onClick={onClose}
            className="h-8 px-4 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Requests tab
// ─────────────────────────────────────────────────────────────────────────────

function RequestsTab({
  items,
  pagination,
  filters,
  onApplyFilters,
  onActionComplete,
}: {
  items: ConsultingRequestWithUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  filters: { status?: string; topic?: string; search?: string };
  onApplyFilters: (patch: Record<string, string | undefined>) => void;
  onActionComplete: () => void;
}) {
  const [searchVal, setSearchVal] = useState(filters.search ?? "");
  const [selectedItem, setSelectedItem] =
    useState<ConsultingRequestWithUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, start] = useTransition();
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setSearchVal(val);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(
      () => onApplyFilters({ search: val || undefined, spage: "1" }),
      400,
    );
  };

  const openDetail = (item: ConsultingRequestWithUser) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const quickStatus = (
    id: string,
    status: ConsultingStatus,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    start(async () => {
      const r = await updateConsultingStatus(id, status);
      if (r.success) {
        toast.success(`→ ${REQ_STATUS_CFG[status].label}`);
        onActionComplete();
      } else toast.error(r.error);
    });
  };

  const isEmpty = items.length === 0;

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-sm">
            {isPending ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            )}
            <Input
              value={searchVal}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search name, email, company…"
              className="pl-9 h-9 rounded-xl text-sm border-border/60"
            />
            {searchVal && (
              <Button
                variant={"ghost"}
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Status filter */}
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
                {filters.status
                  ? REQ_STATUS_CFG[
                      filters.status as keyof typeof REQ_STATUS_CFG
                    ]?.label
                  : "Status"}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem
                onClick={() => onApplyFilters({ status: undefined, page: "1" })}
                className="text-xs"
              >
                All statuses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ALL_REQ_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onApplyFilters({ status: s, page: "1" })}
                  className="text-xs gap-2"
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      REQ_STATUS_CFG[s].dot,
                    )}
                  />{" "}
                  {REQ_STATUS_CFG[s].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Topic filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 rounded-xl gap-1.5 text-xs border-border/60",
                  filters.topic &&
                    "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
                )}
              >
                <Briefcase className="w-3.5 h-3.5" />
                {filters.topic
                  ? TOPIC_CFG[filters.topic as keyof typeof TOPIC_CFG]?.label
                  : "Topic"}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => onApplyFilters({ topic: undefined, page: "1" })}
                className="text-xs"
              >
                All topics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(TOPIC_CFG).map(([key, { label, icon: Icon }]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onApplyFilters({ topic: key, page: "1" })}
                  className="text-xs gap-2"
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(filters.status || filters.topic || filters.search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                setSearchVal("");
                onApplyFilters({
                  status: undefined,
                  topic: undefined,
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
        {(filters.status || filters.topic || filters.search) && (
          <div className="flex flex-wrap gap-1.5 -mt-1">
            {filters.status && (
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    REQ_STATUS_CFG[
                      filters.status as keyof typeof REQ_STATUS_CFG
                    ]?.dot,
                  )}
                />
                {
                  REQ_STATUS_CFG[filters.status as keyof typeof REQ_STATUS_CFG]
                    ?.label
                }
                <Button
                  variant={"ghost"}
                  onClick={() =>
                    onApplyFilters({ status: undefined, page: "1" })
                  }
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </span>
            )}
            {filters.topic && (
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
                {TOPIC_CFG[filters.topic as keyof typeof TOPIC_CFG]?.label}
                <Button
                  variant={"ghost"}
                  onClick={() =>
                    onApplyFilters({ topic: undefined, page: "1" })
                  }
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
                    setSearchVal("");
                    onApplyFilters({ search: undefined, page: "1" });
                  }}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </span>
            )}
          </div>
        )}

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-border/50 bg-card text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/70">
                No requests found
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Try adjusting your filters
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {[
                        "Client",
                        "Topic",
                        "Request",
                        "Status",
                        "Service",
                        "Created",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={cn(
                            "px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wide",
                            i === 0 && "w-45",
                            i === 1 && "w-43.5",
                            i === 3 && "w-27.5",
                            i === 4 && "w-30",
                            i === 5 && "w-25",
                            i === 6 && "w-12.5",
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {items.map((item) => {
                        const initials = item.fullName
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase();
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => openDetail(item)}
                            className="group border-b border-border/30 hover:bg-muted/10 cursor-pointer transition-colors last:border-0"
                          >
                            {/* Client */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#7b57fc]/10 flex items-center justify-center text-[10px] font-bold text-[#7b57fc] shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate max-w-30">
                                    {item.fullName}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-30">
                                    {item.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* Topic */}
                            <td className="px-4 py-3">
                              <TopicTag topic={item.topic} small />
                            </td>
                            {/* Request */}
                            <td className="px-4 py-3 max-w-55">
                              <p className="text-xs text-foreground/80 line-clamp-2">
                                {item.description}
                              </p>
                            </td>
                            {/* Status */}
                            <td
                              className="px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1 focus:outline-none">
                                  <StatusBadge status={item.status} />
                                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="start"
                                  className="w-44"
                                >
                                  {ALL_REQ_STATUSES.filter(
                                    (s) => s !== item.status,
                                  ).map((s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={(e) =>
                                        quickStatus(item.id, s, e)
                                      }
                                      className="text-xs gap-2"
                                    >
                                      <span
                                        className={cn(
                                          "w-2 h-2 rounded-full",
                                          REQ_STATUS_CFG[s].dot,
                                        )}
                                      />
                                      {REQ_STATUS_CFG[s].label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                            {/* Linked service */}
                            <td className="px-4 py-3">
                              {item.linkedService ? (
                                <span className="text-[11px] text-[#7b57fc] truncate max-w-25 block">
                                  {item.linkedService.title}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/40">
                                  —
                                </span>
                              )}
                            </td>
                            {/* Created */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-[11px] text-muted-foreground">
                                {formatDistanceToNow(new Date(item.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </td>
                            {/* View */}
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const initials = item.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => openDetail(item)}
                      className="rounded-2xl border border-border/50 bg-card p-4 cursor-pointer hover:border-[#7b57fc]/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#7b57fc]/10 flex items-center justify-center text-[11px] font-bold text-[#7b57fc] shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {item.fullName}
                            </p>
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30">
                            <TopicTag topic={item.topic} small />
                            <span className="text-[11px] text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        <Pagination
          pagination={pagination}
          onPage={(p) => onApplyFilters({ page: String(p) })}
        />
      </div>

      <RequestDetailDialog
        item={selectedItem}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onDone={() => {
          onActionComplete();
          setDialogOpen(false);
        }}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── TAB 2: SERVICES ───────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Service Form Dialog (create + edit)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ImageManager  — upload zone + sortable image grid with primary + delete
// ─────────────────────────────────────────────────────────────────────────────

function ImageManager({
  serviceId,
  images,
  onChanged, // refreshes parent (router.refresh or local state update)
}: {
  serviceId: string;
  images: ServiceImage[];
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<ServiceImage[]>(images);

  // Keep local copy in sync when parent refreshes
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const processFile = async (file: File) => {
    setUploadError(null);
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPEG, PNG, WebP or GIF — max 5 MB");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5 MB");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadServiceImage(serviceId, fd);
    setUploading(false);
    if (r.success) {
      setLocalImages((p) => [...p, r.data]);
      onChanged();
      toast.success("Image uploaded");
    } else {
      setUploadError(r.error);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (img: ServiceImage) => {
    setDeletingId(img.id);
    const r = await deleteServiceImage(img.id);
    setDeletingId(null);
    if (r.success) {
      setLocalImages((p) => p.filter((i) => i.id !== img.id));
      onChanged();
      toast.success("Image deleted");
    } else {
      toast.error(r.error);
    }
  };

  // ── Set primary ─────────────────────────────────────────────────────────────
  const handleSetPrimary = async (img: ServiceImage) => {
    if (img.isPrimary) return;
    setPrimaryId(img.id);
    const r = await setPrimaryServiceImage(serviceId, img.id);
    setPrimaryId(null);
    if (r.success) {
      setLocalImages((p) =>
        p.map((i) => ({ ...i, isPrimary: i.id === img.id })),
      );
      onChanged();
      toast.success("Primary image updated");
    } else {
      toast.error(r.error);
    }
  };

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────
  const handleDragStart = (idx: number) => setDraggingIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const updated = [...localImages];
    const [moved] = updated.splice(draggingIdx, 1);
    updated.splice(idx, 0, moved);
    setLocalImages(updated);
    setDraggingIdx(idx);
  };
  const handleDragEnd = async () => {
    setDraggingIdx(null);
    const r = await reorderServiceImages(localImages.map((i) => i.id));
    if (r.success) onChanged();
    else toast.error(r.error);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Drag thumbnails to reorder. Click ⭐ to set as primary (shown on cards).
        Max 5 MB per image.
      </p>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) processFile(file);
        }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none",
          isDragging
            ? "border-[#7b57fc]/60 bg-[#7b57fc]/5"
            : "border-border/40 hover:border-[#7b57fc]/40 hover:bg-muted/20",
        )}
      >
        <Input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Uploading…</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Upload className="w-7 h-7 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Drop an image here or{" "}
              <span className="text-[#7b57fc] underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              JPEG · PNG · WebP · GIF &nbsp;·&nbsp; max 5 MB
            </p>
          </div>
        )}
      </div>
      {uploadError && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {uploadError}
        </p>
      )}

      {/* Image grid */}
      {localImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {localImages.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing select-none",
                img.isPrimary
                  ? "border-[#7b57fc] ring-2 ring-[#7b57fc]/20"
                  : "border-border/40 hover:border-border/70",
                draggingIdx === idx && "opacity-50 scale-95",
              )}
            >
              <img
                src={img.url}
                alt={img.altText ?? `Image ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7b57fc] text-white shadow-md">
                  <Star className="w-2.5 h-2.5 fill-white" /> Primary
                </div>
              )}

              {/* Drag handle hint */}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-5 h-5 rounded-md bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <GripVertical className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Action overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent pt-6 pb-1.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end gap-1.5">
                {/* Set primary */}
                {!img.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    disabled={primaryId === img.id}
                    title="Set as primary"
                    className="flex-1 h-6 flex items-center justify-center gap-1 rounded-lg bg-[#7b57fc]/80 hover:bg-[#7b57fc] text-white text-[10px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {primaryId === img.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Star className="w-2.5 h-2.5" /> Primary
                      </>
                    )}
                  </button>
                )}
                {/* Delete */}
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deletingId === img.id}
                  title="Delete image"
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 py-8 text-center">
          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">
            No images yet — upload one above
          </p>
        </div>
      )}
    </div>
  );
}

const EMPTY_SERVICE_FORM = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  shortDesc: "",
  shortDescAr: "",
  topic: "other" as ConsultingServiceTopic,
  category: "",
  categoryAr: "",
  tagsInput: "", // comma-separated input
  priceFrom: "",
  priceCurrency: "USD",
  duration: "",
  durationAr: "",
  deliveryFormat: "" as ConsultingDeliveryFormat | "",
  includesEnInput: "", // newline-separated
  includesArInput: "",
  isFeatured: false,
  isActive: true,
  sortOrder: "0",
};

function ServiceFormDialog({
  open,
  onClose,
  onDone,
  editService,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  editService?: ConsultingServiceFull | null;
}) {
  const isEdit = !!editService;
  const [isPending, start] = useTransition();
  const [form, setForm] = useState(EMPTY_SERVICE_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<
    "basic" | "details" | "content" | "images"
  >("basic");
  // After create: show the images step with the new serviceId
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);
  const [createdImages, setCreatedImages] = useState<ServiceImage[]>([]);

  // Sync form when editService changes
  useEffect(() => {
    if (open) {
      if (editService) {
        setForm({
          title: editService.title,
          titleAr: editService.titleAr ?? "",
          description: editService.description,
          descriptionAr: editService.descriptionAr ?? "",
          shortDesc: editService.shortDesc ?? "",
          shortDescAr: editService.shortDescAr ?? "",
          topic: editService.topic,
          category: editService.category ?? "",
          categoryAr: editService.categoryAr ?? "",
          tagsInput: editService.tags.join(", "),
          priceFrom:
            editService.priceFrom !== null ? String(editService.priceFrom) : "",
          priceCurrency: editService.priceCurrency,
          duration: editService.duration ?? "",
          durationAr: editService.durationAr ?? "",
          deliveryFormat:
            (editService.deliveryFormat as ConsultingDeliveryFormat) ?? "",
          includesEnInput: editService.includesEn.join("\n"),
          includesArInput: editService.includesAr.join("\n"),
          isFeatured: editService.isFeatured,
          isActive: editService.isActive,
          sortOrder: String(editService.sortOrder),
        });
      } else {
        setForm(EMPTY_SERVICE_FORM);
        setCreatedServiceId(null);
        setCreatedImages([]);
      }
      setErrors({});
      setActiveTab("basic");
    }
  }, [open, editService?.id]);

  const set =
    (k: keyof typeof EMPTY_SERVICE_FORM) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const setCheck = (k: keyof typeof EMPTY_SERVICE_FORM) => (v: boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.priceFrom && isNaN(Number(form.priceFrom)))
      e.priceFrom = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildData = () => ({
    title: form.title.trim(),
    titleAr: form.titleAr.trim() || undefined,
    description: form.description.trim(),
    descriptionAr: form.descriptionAr.trim() || undefined,
    shortDesc: form.shortDesc.trim() || undefined,
    shortDescAr: form.shortDescAr.trim() || undefined,
    topic: form.topic,
    category: form.category.trim() || undefined,
    categoryAr: form.categoryAr.trim() || undefined,
    tags: form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
    priceCurrency: form.priceCurrency,
    duration: form.duration.trim() || undefined,
    durationAr: form.durationAr.trim() || undefined,
    deliveryFormat:
      (form.deliveryFormat as ConsultingDeliveryFormat) || undefined,
    includesEn: form.includesEnInput
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean),
    includesAr: form.includesArInput
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean),
    isFeatured: form.isFeatured,
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder) || 0,
  });

  const handleSubmit = () => {
    if (!validate()) return;
    start(async () => {
      const data = buildData();
      if (isEdit && editService) {
        const r = await updateConsultingService(editService.id, data);
        if (r.success) {
          toast.success("Service updated");
          onClose();
          onDone();
        } else toast.error(r.error);
      } else {
        const r = await createConsultingService(data as any);
        if (r.success) {
          toast.success("Service created — now add images");
          // Stay in the dialog and switch to images step
          setCreatedServiceId(r.data.id);
          setCreatedImages([]);
        } else {
          toast.error(r.error);
        }
      }
    });
  };

  const handleFinishCreate = () => {
    onDone();
    onClose();
  };

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50 text-sm";
  const selectCls = cn(inputCls, "px-3 appearance-none");

  // Tabs: in edit mode show "Images" tab; in create mode images only show post-submit
  const formTabs = [
    { id: "basic", label: "Basic", icon: FileText },
    { id: "details", label: "Details", icon: Tag },
    { id: "content", label: "Content", icon: ListChecks },
    ...(isEdit
      ? [{ id: "images" as const, label: "Images", icon: ImageIcon }]
      : []),
  ] as const;

  // The "images" tab in edit mode uses the existing service images
  const imagesForManager = isEdit ? (editService?.images ?? []) : createdImages;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className={cn(
  "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
  "[&>button:last-child]:hidden",
)} >
        {/* Header */}
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center">
              {createdServiceId ? (
                <ImageIcon className="w-4 h-4 text-[#7b57fc]" />
              ) : isEdit ? (
                <Edit3 className="w-4 h-4 text-[#7b57fc]" />
              ) : (
                <Plus className="w-4 h-4 text-[#7b57fc]" />
              )}
            </div>
            <DialogTitle className="text-sm font-bold text-foreground">
              {createdServiceId
                ? "Add images to your new service"
                : isEdit
                  ? `Edit: ${editService?.title}`
                  : "New Consulting Service"}
            </DialogTitle>
          </div>
          <Button
            variant={"ghost"}
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>

        {/* ── POST-CREATE: images step ── */}
        {createdServiceId ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Service created successfully! You can now add images or skip
                  for now.
                </p>
              </div>
              <ImageManager
                serviceId={createdServiceId}
                images={createdImages}
                onChanged={() => {
                  // Re-fetch updated images from server by refreshing and keeping dialog open
                  onDone();
                }}
              />
            </div>
            <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 bg-background">
              <p className="text-xs text-muted-foreground">
                {createdImages.length > 0
                  ? `${createdImages.length} image${createdImages.length !== 1 ? "s" : ""} uploaded`
                  : "No images yet"}
              </p>
              <button
                onClick={handleFinishCreate}
                className="h-10 px-5 flex items-center gap-2 rounded-xl bg-[#7b57fc] text-white text-sm font-semibold hover:bg-[#6a48eb] shadow-md shadow-[#7b57fc]/20 transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Done
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ── FORM TABS ── */}
            <div className="shrink-0 flex border-b border-border/40 px-6">
              {formTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-1 py-2.5 mr-5 text-xs font-semibold border-b-2 transition-colors",
                    activeTab === id
                      ? "border-[#7b57fc] text-[#7b57fc]"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                  {id === "images" &&
                    isEdit &&
                    editService &&
                    editService.images.length > 0 && (
                      <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[#7b57fc]/10 text-[#7b57fc] font-bold">
                        {editService.images.length}
                      </span>
                    )}
                </button>
              ))}
            </div>

            {/* Form body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {/* Basic tab */}
                {activeTab === "basic" && (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          Title (EN) <span className="text-[#7b57fc]">*</span>
                        </Label>
                        <Input
                          value={form.title}
                          onChange={set("title")}
                          placeholder="e.g. Product Sourcing Strategy"
                          className={cn(
                            inputCls,
                            errors.title && "border-red-400",
                          )}
                        />
                        {errors.title && (
                          <p className="text-xs text-red-500">{errors.title}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          العنوان (AR)
                        </Label>
                        <Input
                          value={form.titleAr}
                          onChange={set("titleAr")}
                          placeholder="مثال: استراتيجية استيراد المنتجات"
                          dir="rtl"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        Short description (EN)
                      </Label>
                      <Input
                        value={form.shortDesc}
                        onChange={set("shortDesc")}
                        placeholder="One-liner shown on the service card"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        وصف قصير (AR)
                      </Label>
                      <Input
                        value={form.shortDescAr}
                        onChange={set("shortDescAr")}
                        dir="rtl"
                        placeholder="جملة واحدة تظهر على بطاقة الخدمة"
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        Full description (EN){" "}
                        <span className="text-[#7b57fc]">*</span>
                      </Label>
                      <Textarea
                        value={form.description}
                        onChange={set("description")}
                        rows={4}
                        placeholder="Detailed description of the service…"
                        className={cn(
                          "rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50",
                          errors.description && "border-red-400",
                        )}
                      />
                      {errors.description && (
                        <p className="text-xs text-red-500">
                          {errors.description}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        الوصف الكامل (AR)
                      </Label>
                      <Textarea
                        value={form.descriptionAr}
                        onChange={set("descriptionAr")}
                        rows={4}
                        dir="rtl"
                        placeholder="وصف تفصيلي للخدمة…"
                        className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Details tab */}
                {activeTab === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          Topic
                        </Label>
                        <select
                          value={form.topic}
                          onChange={set("topic")}
                          className={cn(selectCls, "w-full")}
                        >
                          {Object.entries(TOPIC_CFG).map(([k, { label }]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          Delivery Format
                        </Label>
                        <select
                          value={form.deliveryFormat}
                          onChange={set("deliveryFormat")}
                          className={cn(selectCls, "w-full")}
                        >
                          <option value="">Not specified</option>
                          {Object.entries(DELIVERY_CFG).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          Category (EN)
                        </Label>
                        <Input
                          value={form.category}
                          onChange={set("category")}
                          placeholder="e.g. Sourcing"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          الفئة (AR)
                        </Label>
                        <Input
                          value={form.categoryAr}
                          onChange={set("categoryAr")}
                          dir="rtl"
                          placeholder="مثال: الاستيراد"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          Duration (EN)
                        </Label>
                        <Input
                          value={form.duration}
                          onChange={set("duration")}
                          placeholder="e.g. 2–4 weeks"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          المدة (AR)
                        </Label>
                        <Input
                          value={form.durationAr}
                          onChange={set("durationAr")}
                          dir="rtl"
                          placeholder="مثال: ٢–٤ أسابيع"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          Starting Price
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.priceFrom}
                            onChange={set("priceFrom")}
                            placeholder="0.00"
                            className={cn(
                              inputCls,
                              "pl-8",
                              errors.priceFrom && "border-red-400",
                            )}
                            dir="ltr"
                          />
                        </div>
                        {errors.priceFrom && (
                          <p className="text-xs text-red-500">
                            {errors.priceFrom}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                          Currency
                        </Label>
                        <select
                          value={form.priceCurrency}
                          onChange={set("priceCurrency")}
                          className={cn(selectCls, "w-full")}
                        >
                          {["USD", "EUR", "GBP", "SAR", "AED"].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        Tags (comma-separated)
                      </Label>
                      <Input
                        value={form.tagsInput}
                        onChange={set("tagsInput")}
                        placeholder="sourcing, china, logistics"
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        Sort Order
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.sortOrder}
                        onChange={set("sortOrder")}
                        className={cn(inputCls, "w-24")}
                        dir="ltr"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          key: "isActive" as const,
                          label: "Active (visible publicly)",
                        },
                        {
                          key: "isFeatured" as const,
                          label: "Featured (show on homepage)",
                        },
                      ].map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20"
                        >
                          <Label className="text-xs font-medium text-foreground cursor-pointer">
                            {label}
                          </Label>
                          <button
                            type="button"
                            onClick={() => setCheck(key)(!form[key])}
                            className={cn(
                              "transition-colors shrink-0",
                              form[key]
                                ? "text-[#7b57fc]"
                                : "text-muted-foreground",
                            )}
                          >
                            {form[key] ? (
                              <ToggleRight className="w-6 h-6" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Content tab */}
                {activeTab === "content" && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-muted-foreground">
                      What's included bullet points — one item per line.
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        Includes (EN)
                      </Label>
                      <Textarea
                        value={form.includesEnInput}
                        onChange={set("includesEnInput")}
                        rows={6}
                        placeholder={
                          "Market analysis\nSupplier shortlist\nPrice benchmarking"
                        }
                        className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50 font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground/50">
                        {
                          form.includesEnInput.split("\n").filter(Boolean)
                            .length
                        }{" "}
                        items
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        يشمل (AR)
                      </Label>
                      <Textarea
                        value={form.includesArInput}
                        onChange={set("includesArInput")}
                        rows={6}
                        dir="rtl"
                        placeholder={
                          "تحليل السوق\nقائمة الموردين\nمعايرة الأسعار"
                        }
                        className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50 font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground/50">
                        {
                          form.includesArInput.split("\n").filter(Boolean)
                            .length
                        }{" "}
                        items
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Images tab — edit mode only */}
                {activeTab === "images" && isEdit && editService && (
                  <motion.div
                    key="images"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ImageManager
                      serviceId={editService.id}
                      images={imagesForManager}
                      onChanged={onDone}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer — only shown for non-images tabs */}
            {activeTab !== "images" && (
              <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-border/50 bg-background">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {formTabs
                    .filter((t) => t.id !== "images")
                    .map(({ id }) => (
                      <Button
                        variant={"ghost"}
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          activeTab === id
                            ? "bg-[#7b57fc] w-5"
                            : "bg-muted-foreground/30",
                        )}
                      />
                    ))}
                </div>
                <div className="flex gap-2 ml-auto">
                  {activeTab !== "basic" && (
                    <Button
                      variant={"ghost"}
                      onClick={() =>
                        setActiveTab(
                          activeTab === "content" ? "details" : "basic",
                        )
                      }
                      className="h-10 px-4 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all"
                    >
                      Back
                    </Button>
                  )}
                  {activeTab !== "content" ? (
                    <button
                      onClick={() =>
                        setActiveTab(
                          activeTab === "basic" ? "details" : "content",
                        )
                      }
                      className="h-10 px-5 flex items-center gap-2 rounded-xl bg-[#7b57fc] text-white text-sm font-semibold hover:bg-[#6a48eb] shadow-md shadow-[#7b57fc]/20 transition-all"
                    >
                      Next <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isPending}
                      className={cn(
                        "h-10 px-5 flex items-center gap-2 rounded-xl text-sm font-semibold transition-all",
                        isPending
                          ? "bg-muted text-muted-foreground"
                          : "bg-[#7b57fc] text-white hover:bg-[#6a48eb] shadow-md shadow-[#7b57fc]/20",
                      )}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />{" "}
                          {isEdit ? "Save changes" : "Create service"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Service card
// ─────────────────────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onEdit,
  onManageImages,
  onDone,
}: {
  service: ConsultingServiceFull;
  onEdit: () => void;
  onManageImages: () => void;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const TopicIcon =
    TOPIC_CFG[service.topic as keyof typeof TOPIC_CFG]?.icon ?? Briefcase;
  const primaryImg =
    service.images.find((img) => img.isPrimary) ?? service.images[0];

  const handleToggle = () => {
    start(async () => {
      const r = await toggleConsultingServiceActive(
        service.id,
        !service.isActive,
      );
      if (r.success) {
        toast.success(service.isActive ? "Deactivated" : "Activated");
        onDone();
      } else toast.error(r.error);
    });
  };

  const handleDelete = () => {
    start(async () => {
      const r = await deleteConsultingService(service.id);
      if (r.success) {
        toast.success("Deleted");
        onDone();
      } else toast.error(r.error);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "group rounded-2xl border bg-card overflow-hidden transition-all duration-200",
        service.isActive
          ? "border-border/50 hover:border-[#7b57fc]/30 hover:shadow-md hover:shadow-[#7b57fc]/5"
          : "border-border/30 opacity-60",
      )}
    >
      {/* Image / topic icon */}
      <div className="relative h-36 bg-linear-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden">
        {primaryImg ? (
          <img
            src={primaryImg.url}
            alt={primaryImg.altText ?? service.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <TopicIcon className="w-12 h-12 text-muted-foreground/20" />
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {service.isFeatured && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          {!service.isActive && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/50">
              Inactive
            </span>
          )}
        </div>
        {/* Image count */}
        {service.images.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <ImageIcon className="w-2.5 h-2.5" /> {service.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground line-clamp-1">
              {service.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground shrink-0 -mt-0.5"
                  disabled={isPending}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={onEdit} className="text-xs gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> Edit details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onManageImages}
                  className="text-xs gap-2"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Manage images
                  {service.images.length > 0 && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {service.images.length}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleToggle}
                  className="text-xs gap-2"
                >
                  {service.isActive ? (
                    <ToggleLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ToggleRight className="w-3.5 h-3.5" />
                  )}
                  {service.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDelete(true)}
                  className="text-xs gap-2 text-red-500 focus:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {service.titleAr && (
            <p className="text-[11px] text-muted-foreground mt-0.5" dir="rtl">
              {service.titleAr}
            </p>
          )}
        </div>

        {service.shortDesc && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {service.shortDesc}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
          <TopicTag topic={service.topic} small />
          {service.priceFrom !== null && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              From ${service.priceFrom.toLocaleString()}
            </span>
          )}
          {service.duration && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {service.duration}
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> {service._count.serviceRequests}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <EyeIcon className="w-3 h-3" /> {service.viewCount}
          </span>
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
          >
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <p className="text-sm font-semibold">Delete this service?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={"ghost"}
                onClick={handleDelete}
                disabled={isPending}
                className="h-8 px-4 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
              <Button
                variant={"ghost"}
                onClick={() => setShowDelete(false)}
                className="h-8 px-4 rounded-xl border border-border/60 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Standalone image manager dialog — opened from ServiceCard "Manage images" or ServicesTab
function ImageManagerDialog({
  service,
  open,
  onClose,
  onDone,
}: {
  service: ConsultingServiceFull | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  if (!service) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className={cn(
  "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
  "[&>button:last-child]:hidden",
)}>
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground leading-none">
                Images
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {service.title}
              </p>
            </div>
          </div>
          <Button
            variant={"ghost"}
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <ImageManager
            serviceId={service.id}
            images={service.images}
            onChanged={onDone}
          />
        </div>
        <div className="shrink-0 flex items-center justify-end px-6 py-4 border-t border-border/50 bg-muted/10">
          <Button
            variant={"ghost"}
            onClick={onClose}
            className="h-8 px-4 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Services tab
// ─────────────────────────────────────────────────────────────────────────────

function ServicesTab({
  items,
  pagination,
  filters,
  onApplyFilters,
  onActionComplete,
}: {
  items: ConsultingServiceFull[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  filters: { topic?: string; search?: string; isActive?: boolean };
  onApplyFilters: (patch: Record<string, string | undefined>) => void;
  onActionComplete: () => void;
}) {
  const [searchVal, setSearchVal] = useState(filters.search ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editService, setEditService] = useState<ConsultingServiceFull | null>(
    null,
  );
  const [imageService, setImageService] =
    useState<ConsultingServiceFull | null>(null);
  const [imgDialogOpen, setImgDialogOpen] = useState(false);
  const [isPending, start] = useTransition();
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setSearchVal(val);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(
      () => onApplyFilters({ search: val || undefined, spage: "1" }),
      400,
    );
  };

  const openCreate = () => {
    setEditService(null);
    setFormOpen(true);
  };
  const openEdit = (s: ConsultingServiceFull) => {
    setEditService(s);
    setFormOpen(true);
  };
  const openImages = (s: ConsultingServiceFull) => {
    setImageService(s);
    setImgDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-sm">
            {isPending ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            )}
            <Input
              value={searchVal}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search services…"
              className="pl-9 h-9 rounded-xl text-sm border-border/60"
            />
            {searchVal && (
              <Button
                variant={"ghost"}
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Topic filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 rounded-xl gap-1.5 text-xs border-border/60",
                  filters.topic &&
                    "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
                )}
              >
                <Briefcase className="w-3.5 h-3.5" />
                {filters.topic
                  ? TOPIC_CFG[filters.topic as keyof typeof TOPIC_CFG]?.label
                  : "Topic"}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => onApplyFilters({ topic: undefined, spage: "1" })}
                className="text-xs"
              >
                All topics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(TOPIC_CFG).map(([key, { label, icon: Icon }]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onApplyFilters({ topic: key, spage: "1" })}
                  className="text-xs gap-2"
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 rounded-xl gap-1.5 text-xs border-border/60",
                  filters.isActive !== undefined &&
                    "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
                )}
              >
                <Settings className="w-3.5 h-3.5" />
                {filters.isActive === true
                  ? "Active"
                  : filters.isActive === false
                    ? "Inactive"
                    : "Status"}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              <DropdownMenuItem
                onClick={() =>
                  onApplyFilters({ active: undefined, spage: "1" })
                }
                className="text-xs"
              >
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onApplyFilters({ active: "true", spage: "1" })}
                className="text-xs gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onApplyFilters({ active: "false", spage: "1" })}
                className="text-xs gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />{" "}
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(filters.topic ||
            filters.search ||
            filters.isActive !== undefined) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                setSearchVal("");
                onApplyFilters({
                  topic: undefined,
                  search: undefined,
                  active: undefined,
                  spage: "1",
                });
              }}
            >
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}

          <Button
            size="sm"
            className="h-9 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] border-0 shadow-md shadow-[#7b57fc]/20 ml-auto"
            onClick={openCreate}
          >
            <Plus className="w-3.5 h-3.5" /> New Service
          </Button>
        </div>

        {/* Grid */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-dashed border-border/60 bg-card/50 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/70">
                No services found
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create your first consulting service to get started
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 h-10 px-6 rounded-xl bg-[#7b57fc] text-white text-sm font-semibold shadow-md shadow-[#7b57fc]/20 hover:bg-[#6a48eb] transition-all"
            >
              <Plus className="w-4 h-4" /> Create first service
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
            <AnimatePresence initial={false}>
              {items.map((service) => (
                <div key={service.id} className="relative">
                  <ServiceCard
                    service={service}
                    onEdit={() => openEdit(service)}
                    onManageImages={() => openImages(service)}
                    onDone={onActionComplete}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Pagination
          pagination={pagination}
          paramKey="spage"
          onPage={(p) => onApplyFilters({ spage: String(p) })}
        />
      </div>

      <ServiceFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onDone={onActionComplete}
        editService={editService}
      />

      <ImageManagerDialog
        service={imageService}
        open={imgDialogOpen}
        onClose={() => setImgDialogOpen(false)}
        onDone={onActionComplete}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── MAIN ConsultingPageClient ─────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

interface Props {
  initialTab: "requests" | "services";
  stats: {
    requests: {
      total: number;
      byStatus: Record<string, number>;
      byTopic: Record<string, number>;
      thisWeek: number;
    };
    services: {
      total: number;
      active: number;
      featured: number;
      totalRequests: number;
      byTopic: Record<string, number>;
      topServices: { id: string; title: string; requestCount: number }[];
    };
  } | null;
  initialRequests: ConsultingRequestWithUser[];
  requestsPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  reqFilters: {
    page: number;
    pageSize: number;
    status?: string;
    topic?: string;
    search?: string;
  };
  initialServices: ConsultingServiceFull[];
  servicesPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  svcFilters: {
    page: number;
    pageSize: number;
    topic?: string;
    search?: string;
    isActive?: boolean;
  };
}

export function ConsultingPageClient({
  initialTab,
  stats,
  initialRequests,
  requestsPagination,
  reqFilters,
  initialServices,
  servicesPagination,
  svcFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<"requests" | "services">(
    initialTab,
  );
  const [isPending, start] = useTransition();

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const base = new URLSearchParams();
        base.set("tab", activeTab);

        const merged = {
          page: String(reqFilters.page),
          status: reqFilters.status,
          topic: reqFilters.topic,
          search: reqFilters.search,
          active:
            svcFilters.isActive !== undefined
              ? String(svcFilters.isActive)
              : undefined,
          spage: String(svcFilters.page),
          ...patch,
        };

        if (Number(merged.page) > 1) base.set("page", merged.page!);
        if (merged.status) base.set("status", merged.status);
        if (merged.topic) base.set("topic", merged.topic);
        if (merged.search) base.set("search", merged.search);
        if (merged.active !== undefined) base.set("active", merged.active);
        if (Number(merged.spage) > 1) base.set("spage", merged.spage!);

        router.push(`${pathname}?${base.toString()}`);
      });
    },
    [activeTab, reqFilters, svcFilters, router, pathname],
  );

  const switchTab = (tab: "requests" | "services") => {
    setActiveTab(tab);
    start(() => {
      const p = new URLSearchParams();
      p.set("tab", tab);
      router.push(`${pathname}?${p.toString()}`);
    });
  };

  const refresh = useCallback(() => router.refresh(), [router]);

  const tabs = [
    {
      id: "requests" as const,
      label: "Requests",
      icon: MessageSquare,
      count: requestsPagination.totalCount,
    },
    {
      id: "services" as const,
      label: "Services",
      icon: Briefcase,
      count: servicesPagination.totalCount,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      {stats && <StatsStrip stats={stats} />}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/30 border border-border/50 w-fit">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <Button
            variant={"ghost"}
            key={id}
            onClick={() => switchTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === id
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full font-bold",
                activeTab === id
                  ? "bg-[#7b57fc]/10 text-[#7b57fc]"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              {count}
            </span>
          </Button>
        ))}
        <Button
          variant={"ghost"}
          onClick={refresh}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all shrink-0"
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "requests" ? (
          <motion.div
            key="requests"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
          >
            <RequestsTab
              items={initialRequests}
              pagination={requestsPagination}
              filters={reqFilters}
              onApplyFilters={applyFilters}
              onActionComplete={refresh}
            />
          </motion.div>
        ) : (
          <motion.div
            key="services"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
          >
            <ServicesTab
              items={initialServices}
              pagination={servicesPagination}
              filters={svcFilters}
              onApplyFilters={applyFilters}
              onActionComplete={refresh}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
