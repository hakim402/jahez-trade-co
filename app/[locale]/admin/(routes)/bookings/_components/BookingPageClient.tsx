"use client";

// app/[locale]/admin/(routes)/video-bookings/_components/VideoBookingPageClient.tsx

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Video,
  Calendar,
  Link2,
  Eye,
  RefreshCw,
  History,
  MoreHorizontal,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Monitor,
  ShoppingCart,
  Factory,
  Lock,
  Copy,
  Zap,
  StickyNote,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus, MeetingProvider } from "@prisma/client";
import type {
  SerializedAdminBooking,
  SerializedSlot,
  AdminBookingKpi,
  SerializedStatusHistory,
} from "../actions";
import {
  getAllBookings,
  getAvailableSlots,
  scheduleBooking,
  rescheduleBooking,
  completeBooking,
  cancelBookingByAdmin,
  markNoShow,
  softDeleteBooking,
  createSlot,
  deleteSlot,
  toggleSlotActive,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  BookingStatus,
  { dot: string; ring: string; label: string }
> = {
  REQUESTED: {
    dot: "bg-blue-500",
    ring: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
    label: "Requested",
  },
  PROPOSED: {
    dot: "bg-violet-500",
    ring: "bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400",
    label: "Proposed",
  },
  CONFIRMED: {
    dot: "bg-emerald-500",
    ring: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    label: "Confirmed",
  },
  REJECTED: {
    dot: "bg-red-500",
    ring: "bg-red-500/10 border-red-500/25 text-red-500",
    label: "Rejected",
  },
  RESCHEDULED: {
    dot: "bg-amber-500",
    ring: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
    label: "Rescheduled",
  },
  COMPLETED: {
    dot: "bg-green-500",
    ring: "bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400",
    label: "Completed",
  },
  CANCELED: {
    dot: "bg-muted-foreground",
    ring: "bg-muted/40 border-border/50 text-muted-foreground",
    label: "Cancelled",
  },
  NO_SHOW: {
    dot: "bg-orange-500",
    ring: "bg-orange-500/10 border-orange-500/25 text-orange-600",
    label: "No-show",
  },
};

const PROVIDER_LABELS: Record<MeetingProvider, string> = {
  ZOOM: "Zoom",
  GOOGLE_MEET: "Google Meet",
  WHATSAPP: "WhatsApp",
  MICROSOFT_TEAMS: "Teams",
  CUSTOM: "Custom",
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as BookingStatus[];
const PROVIDERS = Object.keys(PROVIDER_LABELS) as MeetingProvider[];

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    const update = () => {
      const { formatDistanceToNow } =
        require("date-fns") as typeof import("date-fns");
      setText(formatDistanceToNow(new Date(date), { addSuffix: true }));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date]);
  return (
    <span className={className} suppressHydrationWarning>
      {text || ""}
    </span>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const c = STATUS_CFG[status];
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

function Avatar({
  client,
}: {
  client: { email: string; fullName: string | null };
}) {
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
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2))
      nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
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
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="text-xs px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={n}
              size="icon"
              variant={n === page ? "default" : "outline"}
              className={cn(
                "h-8 w-8 rounded-xl text-xs",
                n === page
                  ? "bg-[#7b57fc] text-white border-[#7b57fc] hover:bg-[#6a48eb]"
                  : "border-border/60",
              )}
              onClick={() => onPage(n as number)}
            >
              {n}
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
// KPI Strip
// ─────────────────────────────────────────────────────────────────────────────

function KpiStrip({
  kpi,
  availableSlotCount,
}: {
  kpi: AdminBookingKpi;
  availableSlotCount: number;
}) {
  const cards = [
    {
      label: "Total",
      value: kpi.total,
      grad: "from-[#7b57fc] to-[#2b1cff]",
      sh: "shadow-[#7b57fc]/20",
    },
    {
      label: "Requested",
      value: kpi.requested,
      grad: "from-blue-400 to-blue-600",
      sh: "shadow-blue-500/20",
    },
    {
      label: "Proposed",
      value: kpi.proposed,
      grad: "from-violet-400 to-purple-600",
      sh: "shadow-violet-500/20",
    },
    {
      label: "Confirmed",
      value: kpi.confirmed,
      grad: "from-emerald-400 to-teal-500",
      sh: "shadow-emerald-500/20",
    },
    {
      label: "Completed",
      value: kpi.completed,
      grad: "from-green-400 to-green-600",
      sh: "shadow-green-500/20",
    },
    {
      label: "Open Slots",
      value: availableSlotCount,
      grad: "from-sky-400 to-cyan-500",
      sh: "shadow-sky-500/20",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ label, value, grad, sh }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3"
        >
          <div
            className={cn(
              "absolute -top-4 -right-4 h-14 w-14 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-linear-to-br",
              grad,
            )}
          />
          <div
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
              grad,
              sh,
            )}
          >
            <Video size={14} className="text-white" />
          </div>
          <div className="relative min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter Bar
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  onApply,
  isPending,
}: {
  filters: {
    status?: BookingStatus;
    email?: string;
    from?: string;
    to?: string;
  };
  onApply: (patch: Record<string, string | undefined>) => void;
  isPending: boolean;
}) {
  const [email, setEmail] = useState(filters.email ?? "");
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmail = (v: string) => {
    setEmail(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(
      () => onApply({ email: v || undefined, page: "1" }),
      380,
    );
  };

  const activeCount = [
    filters.status,
    filters.email,
    filters.from || filters.to ? "d" : null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {/* Email search */}
        <div className="relative flex-1 min-w-52 max-w-xs">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Input
            value={email}
            onChange={(e) => handleEmail(e.target.value)}
            placeholder="Search by client email…"
            className="pl-9 h-9 rounded-xl text-sm border-border/60"
          />
          {email && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleEmail("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            onApply({ status: v === "all" ? undefined : v, page: "1" })
          }
        >
          <SelectTrigger
            className={cn(
              "h-9 rounded-xl border-border/60 text-xs w-36",
              filters.status &&
                "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
            )}
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All statuses
            </SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full inline-block mr-1.5",
                    STATUS_CFG[s].dot,
                  )}
                />
                {STATUS_CFG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date from */}
        <Input
          type="date"
          value={filters.from ?? ""}
          dir="ltr"
          onChange={(e) =>
            onApply({ from: e.target.value || undefined, page: "1" })
          }
          className="h-9 rounded-xl border-border/60 text-xs w-36"
          placeholder="From"
        />

        {/* Date to */}
        <Input
          type="date"
          value={filters.to ?? ""}
          dir="ltr"
          onChange={(e) =>
            onApply({ to: e.target.value || undefined, page: "1" })
          }
          className="h-9 rounded-xl border-border/60 text-xs w-36"
          placeholder="To"
        />

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              setEmail("");
              onApply({
                status: undefined,
                email: undefined,
                from: undefined,
                to: undefined,
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
                  STATUS_CFG[filters.status].dot,
                )}
              />{" "}
              {STATUS_CFG[filters.status].label}
              <Button
                variant={"ghost"}
                onClick={() => onApply({ status: undefined, page: "1" })}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
          {filters.email && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              {filters.email}
              <Button
                variant={"ghost"}
                onClick={() => {
                  setEmail("");
                  onApply({ email: undefined, page: "1" });
                }}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
          {(filters.from || filters.to) && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              {filters.from ?? "…"} → {filters.to ?? "…"}
              <Button
                variant={"ghost"}
                onClick={() =>
                  onApply({ from: undefined, to: undefined, page: "1" })
                }
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
// Schedule / Reschedule Dialog
// ─────────────────────────────────────────────────────────────────────────────

function ScheduleDialog({
  open,
  onClose,
  onDone,
  booking,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  booking: SerializedAdminBooking | null;
  mode: "schedule" | "reschedule";
}) {
  const [isPending, start] = useTransition();
  const [slots, setSlots] = useState<SerializedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({
    slotId: "",
    meetingLink: "",
    meetingPassword: "",
    meetingProvider: "" as MeetingProvider | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm({
      slotId: "",
      meetingLink: "",
      meetingPassword: "",
      meetingProvider: "",
    });
    setErrors({});
    setSlotsLoading(true);
    getAvailableSlots().then((r) => {
      if (r.success) setSlots(r.data);
      setSlotsLoading(false);
    });
  }, [open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.slotId) e.slotId = "Select a time slot";
    if (!form.meetingLink) e.meetingLink = "Meeting link is required";
    else if (!form.meetingLink.startsWith("http"))
      e.meetingLink = "Must be a valid URL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !booking) return;
    start(async () => {
      const payload = {
        bookingId: booking.id,
        slotId: form.slotId,
        meetingLink: form.meetingLink,
        meetingPassword: form.meetingPassword || undefined,
        meetingProvider: (form.meetingProvider || undefined) as
          | MeetingProvider
          | undefined,
      };
      const r =
        mode === "schedule"
          ? await scheduleBooking(payload)
          : await rescheduleBooking(payload);

      if (r.success) {
        toast.success(
          mode === "schedule" ? "Session scheduled" : "Session rescheduled",
        );
        onClose();
        onDone();
      } else toast.error(r.error);
    });
  };

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  if (!booking) return null;

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
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {mode === "schedule"
                  ? "Schedule Session"
                  : "Reschedule Session"}
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground">
                {booking.client.fullName ?? booking.client.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>

        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
            "[&::-webkit-scrollbar-thumb:hover]:bg-border",
          )}
        >
          {/* Booking info */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
            <Avatar client={booking.client} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {booking.client.fullName ?? booking.client.email}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {booking.type} · {booking.durationMinutes} min
              </p>
            </div>
          </div>

          {/* Slot picker */}
          <div className="space-y-1.5">
            <Label className={labelCls}>
              Time Slot <span className="text-[#7b57fc]">*</span>
            </Label>
            {slotsLoading ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border/40 bg-muted/20">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Loading slots…
                </span>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-600">
                <AlertCircle className="w-4 h-4 shrink-0" /> No available slots.
                Create one first.
              </div>
            ) : (
              <Select
                value={form.slotId}
                onValueChange={(v) => setForm((p) => ({ ...p, slotId: v }))}
              >
                <SelectTrigger
                  className={cn(
                    inputCls,
                    "w-full",
                    errors.slotId && "border-red-400",
                  )}
                >
                  <SelectValue placeholder="Choose a time slot…" />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem
                      key={slot.id}
                      value={slot.id}
                      className="text-xs"
                    >
                      {format(new Date(slot.startTime), "EEE, MMM d · h:mm a")}{" "}
                      · {slot.durationMinutes}min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.slotId && (
              <p className="text-xs text-red-500">{errors.slotId}</p>
            )}
          </div>

          {/* Meeting link */}
          <div className="space-y-1.5">
            <Label className={labelCls}>
              Meeting Link <span className="text-[#7b57fc]">*</span>
            </Label>
            <div className="relative">
              <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={form.meetingLink}
                onChange={(e) =>
                  setForm((p) => ({ ...p, meetingLink: e.target.value }))
                }
                dir="ltr"
                placeholder="https://meet.google.com/…"
                className={cn(
                  inputCls,
                  "pl-8",
                  errors.meetingLink && "border-red-400",
                )}
              />
            </div>
            {errors.meetingLink && (
              <p className="text-xs text-red-500">{errors.meetingLink}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Provider */}
            <div className="space-y-1.5">
              <Label className={labelCls}>Provider</Label>
              <Select
                value={form.meetingProvider || "none"}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    meetingProvider:
                      v === "none"
                        ? ("" as MeetingProvider)
                        : (v as MeetingProvider),
                  }))
                }
              >
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    Auto-detect
                  </SelectItem>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PROVIDER_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className={labelCls}>Password (optional)</Label>
              <Input
                value={form.meetingPassword}
                onChange={(e) =>
                  setForm((p) => ({ ...p, meetingPassword: e.target.value }))
                }
                placeholder="Meeting password"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 bg-background">
          <Button
            variant="outline"
            className="h-9 rounded-xl text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending || (!form.slotId && slots.length > 0)}
            className="h-9 px-5 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-sm gap-2"
            onClick={handleSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />{" "}
                {mode === "schedule" ? "Schedule" : "Reschedule"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Complete Dialog
// ─────────────────────────────────────────────────────────────────────────────

function CompleteDialog({
  open,
  onClose,
  onDone,
  booking,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  booking: SerializedAdminBooking | null;
}) {
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({ transcriptUrl: "", aiSummary: "" });

  useEffect(() => {
    if (open) setForm({ transcriptUrl: "", aiSummary: "" });
  }, [open]);

  const handleSubmit = () => {
    if (!booking) return;
    start(async () => {
      const r = await completeBooking({
        bookingId: booking.id,
        transcriptUrl: form.transcriptUrl || undefined,
        aiSummary: form.aiSummary || undefined,
      });
      if (r.success) {
        toast.success("Session completed");
        onClose();
        onDone();
      } else toast.error(r.error);
    });
  };

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  if (!booking) return null;

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
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Complete Session
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground">
                {booking.client.fullName ?? booking.client.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>

        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
          )}
        >
          <div className="space-y-1.5">
            <Label className={labelCls}>Transcript URL (optional)</Label>
            <Input
              value={form.transcriptUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, transcriptUrl: e.target.value }))
              }
              dir="ltr"
              placeholder="https://…"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>AI Summary (optional)</Label>
            <Textarea
              value={form.aiSummary}
              onChange={(e) =>
                setForm((p) => ({ ...p, aiSummary: e.target.value }))
              }
              rows={5}
              placeholder="Session notes or AI-generated summary…"
              className="rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50"
            />
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 bg-background">
          <Button
            variant="outline"
            className="h-9 rounded-xl text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            className="h-9 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-0 text-sm gap-2"
            onClick={handleSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Mark Completed
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking Detail Dialog
// ─────────────────────────────────────────────────────────────────────────────

type DetailSection = "overview" | "history";

function BookingDetailDialog({
  open,
  onClose,
  onAction,
  booking,
  onSchedule,
  onReschedule,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string, bookingId: string) => void;
  booking: SerializedAdminBooking | null;
  onSchedule: () => void;
  onReschedule: () => void;
  onComplete: () => void;
}) {
  const [isPending, start] = useTransition();
  const [section, setSection] = useState<DetailSection>("overview");
  const [showCancel, setShowCancel] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setSection("overview");
      setShowCancel(false);
      setShowDelete(false);
      setCancelReason("");
    }
  }, [open]);

  if (!booking) return null;

  const canSchedule = booking.status === "REQUESTED";
  const canReschedule = ["PROPOSED", "CONFIRMED"].includes(booking.status);
  const canComplete = ["PROPOSED", "CONFIRMED"].includes(booking.status);
  const canCancel = !["COMPLETED", "CANCELED", "NO_SHOW", "REJECTED"].includes(
    booking.status,
  );
  const canNoShow = ["PROPOSED", "CONFIRMED"].includes(booking.status);
  const canDelete = ["COMPLETED", "CANCELED", "NO_SHOW", "REJECTED"].includes(
    booking.status,
  );
  const hasMeeting = !!booking.meetingLink;

  const handleCancel = () => {
    start(async () => {
      const r = await cancelBookingByAdmin({
        bookingId: booking.id,
        reason: cancelReason || undefined,
      });
      if (r.success) {
        toast.success("Booking cancelled");
        setShowCancel(false);
        onClose();
        onAction("cancel", booking.id);
      } else toast.error(r.error);
    });
  };

  const handleNoShow = () => {
    start(async () => {
      const r = await markNoShow({ bookingId: booking.id });
      if (r.success) {
        toast.success("Marked as no-show");
        onClose();
        onAction("noshow", booking.id);
      } else toast.error(r.error);
    });
  };

  const handleDelete = () => {
    start(async () => {
      const r = await softDeleteBooking(booking.id);
      if (r.success) {
        toast.success("Booking deleted");
        setShowDelete(false);
        onClose();
        onAction("delete", booking.id);
      } else toast.error(r.error);
    });
  };

  const handleCopy = () => {
    if (booking.meetingLink) {
      navigator.clipboard.writeText(booking.meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const inputCls = "h-9 rounded-xl border-border/60 bg-muted/30 text-sm";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  const titleText = booking.client.fullName
    ? `${booking.client.fullName} — ${STATUS_CFG[booking.status].label}`
    : `${booking.client.email} — ${STATUS_CFG[booking.status].label}`;

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
        {/* Header */}
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar client={booking.client} />
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-foreground truncate">
                {titleText}
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground truncate">
                {booking.client.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={booking.status} />
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

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-border/40 px-6">
          {(["overview", "history"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "flex items-center gap-1.5 px-1 py-3 mr-6 text-xs font-semibold border-b-2 transition-colors shrink-0",
                section === id
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {id === "overview" ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <History className="w-3.5 h-3.5" />
              )}
              {id === "overview"
                ? "Overview"
                : `History (${booking.statusHistory.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-5",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
            "[&::-webkit-scrollbar-thumb:hover]:bg-border",
          )}
        >
          <AnimatePresence mode="wait">
            {/* ── OVERVIEW ── */}
            {section === "overview" && (
              <motion.div
                key="ov"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-2">
                  {canSchedule && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onSchedule();
                      }}
                      className="h-8 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Schedule
                    </Button>
                  )}
                  {canReschedule && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onClose();
                        onReschedule();
                      }}
                      className="h-8 rounded-xl gap-1.5 text-xs border-[#7b57fc]/30 text-[#7b57fc] hover:bg-[#7b57fc]/5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </Button>
                  )}
                  {canComplete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onClose();
                        onComplete();
                      }}
                      className="h-8 rounded-xl gap-1.5 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </Button>
                  )}
                  {canNoShow && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNoShow}
                      disabled={isPending}
                      className="h-8 rounded-xl gap-1.5 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-500/5"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      No-show
                    </Button>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Client
                    </p>
                    {[
                      { label: "Name", val: booking.client.fullName },
                      {
                        label: "Email",
                        val: booking.client.email,
                        href: `mailto:${booking.client.email}`,
                      },
                    ].map(({ label, val, href }) =>
                      val ? (
                        <div
                          key={label}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40"
                        >
                          <div className="min-w-0 flex-1">
                            <p className={labelCls}>{label}</p>
                            {href ? (
                              <a
                                href={href}
                                className="text-xs text-[#7b57fc] hover:underline truncate block"
                              >
                                {val}
                              </a>
                            ) : (
                              <p className="text-xs text-foreground">{val}</p>
                            )}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Session
                    </p>
                    {[
                      { label: "Type", val: booking.type },
                      {
                        label: "Duration",
                        val: `${booking.durationMinutes} minutes`,
                      },
                      {
                        label: "Requested",
                        val: format(new Date(booking.createdAt), "MMM d, yyyy"),
                      },
                    ].map(({ label, val }) => (
                      <div
                        key={label}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40"
                      >
                        <div>
                          <p className={labelCls}>{label}</p>
                          <p className="text-xs text-foreground mt-0.5">
                            {val}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled time */}
                {booking.scheduledAt && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-muted/20 border border-border/40">
                    <Calendar className="w-4 h-4 text-[#7b57fc] shrink-0" />
                    <div>
                      <p className={labelCls}>Scheduled</p>
                      <p className="text-sm font-semibold text-foreground">
                        {format(
                          new Date(booking.scheduledAt),
                          "EEEE, MMMM d, yyyy · h:mm a",
                        )}
                      </p>
                      {booking.clientConfirmedAt && (
                        <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Confirmed by
                          client
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Meeting link */}
                {hasMeeting && (
                  <div className="space-y-2">
                    {booking.meetingProvider && (
                      <p className="text-xs text-muted-foreground">
                        Provider:{" "}
                        <span className="font-semibold text-foreground">
                          {PROVIDER_LABELS[booking.meetingProvider]}
                        </span>
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <a
                        href={booking.meetingLink!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0"
                      >
                        <Button
                          size="sm"
                          className="w-full h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-2 text-xs"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Meeting
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl shrink-0"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                    {booking.meetingPassword && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" /> Password:{" "}
                        <span className="font-mono text-foreground">
                          {booking.meetingPassword}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {booking.requestNotes && (
                  <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5">
                    <p
                      className={cn(labelCls, "mb-1.5 flex items-center gap-1")}
                    >
                      <StickyNote className="w-3 h-3" /> Client notes
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {booking.requestNotes}
                    </p>
                  </div>
                )}

                {/* AI summary */}
                {booking.aiSummary && (
                  <div className="rounded-xl bg-[#7b57fc]/5 border border-[#7b57fc]/15 p-4">
                    <p
                      className={cn(
                        labelCls,
                        "mb-2 text-[#7b57fc] flex items-center gap-1",
                      )}
                    >
                      <Zap className="w-3 h-3" /> AI Summary
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {booking.aiSummary}
                    </p>
                  </div>
                )}

                {/* Transcript */}
                {booking.transcriptUrl && (
                  <a
                    href={booking.transcriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#7b57fc] hover:underline underline-offset-2"
                  >
                    <ExternalLink className="w-3 h-3" /> View transcript
                  </a>
                )}
              </motion.div>
            )}

            {/* ── HISTORY ── */}
            {section === "history" && (
              <motion.div
                key="hist"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                {booking.statusHistory.length === 0 ? (
                  <p className="text-center py-10 text-xs text-muted-foreground">
                    No history yet
                  </p>
                ) : (
                  <div className="relative pl-5">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-border/50" />
                    {booking.statusHistory.map((h) => (
                      <div key={h.id} className="relative mb-4 last:mb-0">
                        <div
                          className={cn(
                            "absolute -left-3.5 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                            STATUS_CFG[h.newStatus]?.dot ?? "bg-muted",
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
                              className="text-[10px] text-muted-foreground shrink-0"
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
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
          <div className="flex gap-2">
            {canCancel &&
              (!showCancel ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/8 gap-1.5"
                  onClick={() => setShowCancel(true)}
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel booking
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="h-7 w-40 rounded-lg text-xs border-border/60"
                  />
                  <Button
                    size="sm"
                    className="h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white border-0 text-xs"
                    disabled={isPending}
                    onClick={handleCancel}
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowCancel(false)}
                  >
                    Keep
                  </Button>
                </div>
              ))}
            {canDelete &&
              (!showDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/8 gap-1.5"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    Permanently delete?
                  </p>
                  <Button
                    size="sm"
                    className="h-7 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white border-0 text-xs"
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
                    className="h-7 text-xs"
                    onClick={() => setShowDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
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
// Create Slot Dialog
// ─────────────────────────────────────────────────────────────────────────────

function CreateSlotDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    durationMinutes: "30",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({ date: "", startTime: "", endTime: "", durationMinutes: "30" });
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.date) e.date = "Date is required";
    if (!form.startTime) e.startTime = "Start time is required";
    if (!form.endTime) e.endTime = "End time is required";
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      e.endTime = "End must be after start";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    start(async () => {
      const r = await createSlot({
        startTime: new Date(`${form.date}T${form.startTime}`),
        endTime: new Date(`${form.date}T${form.endTime}`),
        durationMinutes: Number(form.durationMinutes),
      });
      if (r.success) {
        toast.success("Slot created");
        onClose();
        onDone();
      } else toast.error(r.error);
    });
  };

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

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
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <DialogTitle className="text-sm font-bold text-foreground">
              Create Slot
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className={labelCls}>
              Date <span className="text-[#7b57fc]">*</span>
            </Label>
            <Input
              type="date"
              value={form.date}
              dir="ltr"
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className={cn(inputCls, errors.date && "border-red-400")}
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>
                Start time <span className="text-[#7b57fc]">*</span>
              </Label>
              <Input
                type="time"
                value={form.startTime}
                dir="ltr"
                onChange={(e) =>
                  setForm((p) => ({ ...p, startTime: e.target.value }))
                }
                className={cn(inputCls, errors.startTime && "border-red-400")}
              />
              {errors.startTime && (
                <p className="text-xs text-red-500">{errors.startTime}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>
                End time <span className="text-[#7b57fc]">*</span>
              </Label>
              <Input
                type="time"
                value={form.endTime}
                dir="ltr"
                onChange={(e) =>
                  setForm((p) => ({ ...p, endTime: e.target.value }))
                }
                className={cn(inputCls, errors.endTime && "border-red-400")}
              />
              {errors.endTime && (
                <p className="text-xs text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>Duration (min)</Label>
            <Select
              value={form.durationMinutes}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, durationMinutes: v }))
              }
            >
              <SelectTrigger className={cn(inputCls, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 30, 45, 60, 90, 120].map((d) => (
                  <SelectItem key={d} value={String(d)} className="text-xs">
                    {d} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 bg-background">
          <Button
            variant="outline"
            className="h-9 rounded-xl text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            className="h-9 px-5 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-sm gap-2"
            onClick={handleSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Create Slot
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slots Tab
// ─────────────────────────────────────────────────────────────────────────────

function SlotsTab({
  slots,
  pagination,
  onPage,
  onDone,
}: {
  slots: SerializedSlot[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPage: (p: number) => void;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggle = (slot: SerializedSlot) => {
    start(async () => {
      const r = await toggleSlotActive({
        slotId: slot.id,
        isActive: !slot.isActive,
      });
      if (r.success) {
        toast.success(slot.isActive ? "Slot deactivated" : "Slot activated");
        onDone();
      } else toast.error(r.error);
    });
  };

  const handleDelete = (slotId: string) => {
    setDeletingId(slotId);
    start(async () => {
      const r = await deleteSlot({ slotId });
      setDeletingId(null);
      if (r.success) {
        toast.success("Slot deleted");
        onDone();
      } else toast.error(r.error);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs text-muted-foreground">
          {pagination.totalCount.toLocaleString()} slots total
        </p>
        <Button
          size="sm"
          className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
          onClick={() => setCreating(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Create Slot
        </Button>
      </div>

      {slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border/60 bg-card/50 gap-4">
          <Calendar className="w-10 h-10 text-muted-foreground/20" />
          <div className="text-center">
            <p className="text-sm font-semibold text-muted-foreground">
              No slots yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Create availability slots for clients to book
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Create first slot
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {[
                    "Start Time",
                    "End Time",
                    "Duration",
                    "Status",
                    "Created By",
                    "Booking",
                    "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr
                    key={slot.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-medium whitespace-nowrap">
                      {format(new Date(slot.startTime), "EEE, MMM d · h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(slot.endTime), "h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {slot.durationMinutes} min
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap",
                            slot.isActive
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600"
                              : "bg-muted/40 border-border/50 text-muted-foreground",
                          )}
                        >
                          {slot.isActive ? "Active" : "Inactive"}
                        </span>
                        {slot.isBooked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/10 border-violet-500/25 text-violet-600 whitespace-nowrap">
                            Booked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {slot.createdBy?.fullName ?? slot.createdBy?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {slot.booking ? (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            STATUS_CFG[slot.booking.status]?.ring,
                          )}
                        >
                          {STATUS_CFG[slot.booking.status]?.label}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => handleToggle(slot)}
                          disabled={isPending}
                          title={slot.isActive ? "Deactivate" : "Activate"}
                        >
                          {slot.isActive ? (
                            <ToggleRight className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/8"
                          onClick={() => handleDelete(slot.id)}
                          disabled={
                            isPending ||
                            deletingId === slot.id ||
                            (!!slot.booking &&
                              ![
                                "COMPLETED",
                                "CANCELED",
                                "NO_SHOW",
                                "REJECTED",
                              ].includes(slot.booking.status))
                          }
                        >
                          {deletingId === slot.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="rounded-2xl border border-border/50 bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {format(new Date(slot.startTime), "EEE, MMM d")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(slot.startTime), "h:mm a")} –{" "}
                      {format(new Date(slot.endTime), "h:mm a")} ·{" "}
                      {slot.durationMinutes}min
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={() => handleToggle(slot)}
                      disabled={isPending}
                    >
                      {slot.isActive ? (
                        <ToggleRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/8"
                      onClick={() => handleDelete(slot.id)}
                      disabled={
                        isPending ||
                        (!!slot.booking &&
                          ![
                            "COMPLETED",
                            "CANCELED",
                            "NO_SHOW",
                            "REJECTED",
                          ].includes(slot.booking.status))
                      }
                    >
                      {deletingId === slot.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      slot.isActive
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600"
                        : "bg-muted/40 border-border/50 text-muted-foreground",
                    )}
                  >
                    {slot.isActive ? "Active" : "Inactive"}
                  </span>
                  {slot.isBooked && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/10 border-violet-500/25 text-violet-600">
                      Booked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPage={onPage} />
        </>
      )}

      <CreateSlotDialog
        open={creating}
        onClose={() => setCreating(false)}
        onDone={onDone}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings Table
// ─────────────────────────────────────────────────────────────────────────────

function BookingsTable({
  bookings,
  onOpen,
  onQuickAction,
  isPending,
}: {
  bookings: SerializedAdminBooking[];
  onOpen: (b: SerializedAdminBooking) => void;
  onQuickAction: (action: string, b: SerializedAdminBooking) => void;
  isPending: boolean;
}) {
  if (bookings.length === 0)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-dashed border-border/60 bg-card/50"
      >
        <Video className="w-10 h-10 text-muted-foreground/20" />
        <div className="text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            No bookings found
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
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
                {[
                  "Client",
                  "Type",
                  "Status",
                  "Scheduled",
                  "Duration",
                  "Requested",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {bookings.map((b) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpen(b)}
                    className="group border-b border-border/30 last:border-0 hover:bg-muted/10 cursor-pointer transition-colors"
                  >
                    {/* Client */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar client={b.client} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate max-w-32.5">
                            {b.client.fullName ?? "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-40">
                            {b.client.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {b.type}
                      </span>
                    </td>

                    {/* Status */}
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 focus:outline-none">
                          <StatusBadge status={b.status} />
                          <ChevronDown className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          {b.status === "REQUESTED" && (
                            <DropdownMenuItem
                              onClick={() => onQuickAction("schedule", b)}
                              className="text-xs gap-2"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Schedule
                            </DropdownMenuItem>
                          )}
                          {["PROPOSED", "CONFIRMED"].includes(b.status) && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onQuickAction("reschedule", b)}
                                className="text-xs gap-2"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onQuickAction("complete", b)}
                                className="text-xs gap-2"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />{" "}
                                Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onQuickAction("noshow", b)}
                                className="text-xs gap-2"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-orange-500" />{" "}
                                No-show
                              </DropdownMenuItem>
                            </>
                          )}
                          {![
                            "COMPLETED",
                            "CANCELED",
                            "NO_SHOW",
                            "REJECTED",
                          ].includes(b.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onQuickAction("cancel", b)}
                                className="text-xs text-red-500 focus:text-red-500 gap-2"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Scheduled */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">
                        {b.scheduledAt
                          ? format(new Date(b.scheduledAt), "MMM d · h:mm a")
                          : "—"}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {b.durationMinutes} min
                      </span>
                    </td>

                    {/* Requested */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <RelativeTime
                        date={b.createdAt}
                        className="text-[11px] text-muted-foreground"
                      />
                    </td>

                    {/* View */}
                    <td className="px-4 py-3.5 text-right">
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
          {bookings.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpen(b)}
              className="rounded-2xl border border-border/50 bg-card p-4 cursor-pointer hover:border-[#7b57fc]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <Avatar client={b.client} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {b.client.fullName ?? b.client.email}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.client.email}
                    </p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-2.5 border-t border-border/30">
                <span className="text-[11px] text-muted-foreground">
                  {b.type}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {b.durationMinutes} min
                </span>
                {b.scheduledAt && (
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(b.scheduledAt), "MMM d · h:mm a")}
                  </span>
                )}
                <RelativeTime
                  date={b.createdAt}
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
  kpi: AdminBookingKpi | null;
  availableSlotCount: number;
  initialBookings: SerializedAdminBooking[];
  bookingPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  initialSlots: SerializedSlot[];
  slotPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  initialTab: "bookings" | "slots";
  filters: {
    status?: BookingStatus;
    email?: string;
    from?: string;
    to?: string;
  };
}

export function BookingPageClient({
  kpi,
  availableSlotCount,
  initialBookings,
  bookingPagination,
  initialSlots,
  slotPagination,
  initialTab,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, start] = useTransition();
  const [activeTab, setActiveTab] = useState<"bookings" | "slots">(initialTab);

  // Dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [activeBooking, setActiveBooking] =
    useState<SerializedAdminBooking | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"schedule" | "reschedule">(
    "schedule",
  );

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const base = new URLSearchParams();
        const merged: Record<string, string | undefined> = {
          tab: activeTab,
          page: String(bookingPagination.page),
          status: filters.status,
          email: filters.email,
          from: filters.from,
          to: filters.to,
          ...patch,
        };
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && !(k === "tab" && v === "bookings"))
            base.set(k, v);
        });
        router.push(`${pathname}?${base.toString()}`);
      });
    },
    [activeTab, bookingPagination.page, filters, router, pathname],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  const switchTab = (tab: "bookings" | "slots") => {
    setActiveTab(tab);
    start(() => {
      const base = new URLSearchParams();
      if (tab !== "bookings") base.set("tab", tab);
      router.push(`${pathname}?${base.toString()}`);
    });
  };

  const openDetail = (b: SerializedAdminBooking) => {
    setActiveBooking(b);
    setDetailOpen(true);
  };

  const handleQuickAction = (action: string, b: SerializedAdminBooking) => {
    setActiveBooking(b);
    if (action === "schedule") {
      setScheduleMode("schedule");
      setScheduleOpen(true);
    }
    if (action === "reschedule") {
      setScheduleMode("reschedule");
      setRescheduleOpen(true);
    }
    if (action === "complete") {
      setCompleteOpen(true);
    }
    if (action === "noshow") {
      start(async () => {
        const r = await markNoShow({ bookingId: b.id });
        if (r.success) {
          toast.success("Marked as no-show");
          refresh();
        } else toast.error(r.error);
      });
    }
    if (action === "cancel") {
      start(async () => {
        const r = await cancelBookingByAdmin({ bookingId: b.id });
        if (r.success) {
          toast.success("Booking cancelled");
          refresh();
        } else toast.error(r.error);
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI strip */}
      {kpi && <KpiStrip kpi={kpi} availableSlotCount={availableSlotCount} />}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/30 border border-border/50 w-fit">
        {[
          {
            id: "bookings" as const,
            label: "Bookings",
            count: bookingPagination.totalCount,
          },
          {
            id: "slots" as const,
            label: "Availability Slots",
            count: slotPagination.totalCount,
          },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === id
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
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
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <FilterBar
              filters={filters}
              onApply={applyFilters}
              isPending={isPending}
            />

            <div className="flex items-center justify-between gap-2 -mt-1">
              <p className="text-xs text-muted-foreground">
                {bookingPagination.totalCount.toLocaleString()} booking
                {bookingPagination.totalCount !== 1 ? "s" : ""}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-xl gap-1.5 text-xs text-muted-foreground"
                onClick={refresh}
                disabled={isPending}
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            <BookingsTable
              bookings={initialBookings}
              onOpen={openDetail}
              onQuickAction={handleQuickAction}
              isPending={isPending}
            />

            <Pagination
              pagination={bookingPagination}
              onPage={(p) => applyFilters({ page: String(p) })}
            />
          </motion.div>
        )}

        {/* ── SLOTS TAB ── */}
        {activeTab === "slots" && (
          <motion.div
            key="slots"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SlotsTab
              slots={initialSlots}
              pagination={slotPagination}
              onPage={(p) => applyFilters({ slotsPage: String(p) })}
              onDone={refresh}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <BookingDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onAction={(_, __) => refresh()}
        booking={activeBooking}
        onSchedule={() => {
          setScheduleMode("schedule");
          setScheduleOpen(true);
        }}
        onReschedule={() => {
          setScheduleMode("reschedule");
          setRescheduleOpen(true);
        }}
        onComplete={() => setCompleteOpen(true)}
      />

      <ScheduleDialog
        open={scheduleOpen || rescheduleOpen}
        onClose={() => {
          setScheduleOpen(false);
          setRescheduleOpen(false);
        }}
        onDone={refresh}
        booking={activeBooking}
        mode={scheduleMode}
      />

      <CompleteDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onDone={refresh}
        booking={activeBooking}
      />
    </div>
  );
}
