"use client";

// app/[locale]/admin/(routes)/video-bookings/_components/AdminBookingsClient.tsx

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Loader2,
  Video,
  ExternalLink,
  Eye,
  XCircle,
  MoreHorizontal,
  Calendar,
  Clock,
  Search,
  X,
  CalendarDays,
  Trash2,
  UserX,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  Link2,
  KeyRound,
  Monitor,
  AlarmClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BookingStatus, MeetingProvider } from "@prisma/client";
import {
  getAllBookings,
  getAvailableSlots,
  getAllSlots,
  scheduleBooking,
  completeBooking,
  cancelBookingByAdmin,
  markNoShow,
  createSlot,
  deleteSlot,
  toggleSlotActive,
} from "../actions";
import {
  BOOKING_STATUS_CONFIG,
  type BookingWithRelations,
  type SlotWithBooking,
  type PaginationInfo,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy");
}
function fmtDT(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy · h:mm a");
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

function getInitials(name: string | null, email: string) {
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

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 leading-none whitespace-nowrap",
        cfg.color,
      )}
    >
      <cfg.icon size={9} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS FILTER TABS  (logic identical to original StatusFilterTabs)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TABS: { id: BookingStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "REQUESTED", label: "Requested" },
  { id: "PROPOSED", label: "Proposed" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELED", label: "Cancelled" },
  { id: "NO_SHOW", label: "No Show" },
];

function StatusFilterTabs({
  activeStatus,
}: {
  activeStatus: BookingStatus | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (status: BookingStatus | "ALL") => {
    const p = new URLSearchParams(params);
    if (status === "ALL") p.delete("status");
    else p.set("status", status);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  };

  const active = activeStatus ?? "ALL";

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      {STATUS_TABS.map((t) => {
        const isActive = active === t.id;
        const cfg =
          t.id !== "ALL" ? BOOKING_STATUS_CONFIG[t.id as BookingStatus] : null;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => go(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all shrink-0",
              isActive
                ? "bg-[#7b57fc]/10 text-[#7b57fc] border-[#7b57fc]/30 ring-1 ring-[#7b57fc]/20"
                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            {cfg && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  isActive
                    ? (cfg.dot ?? "bg-[#7b57fc]")
                    : "bg-muted-foreground/40",
                )}
              />
            )}
            {t.label}
          </button>
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
// BOOKING DETAILS DIALOG  (logic identical to original)
// ─────────────────────────────────────────────────────────────────────────────

function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onAction,
}: {
  booking: BookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAction: (
    action: "schedule" | "complete" | "cancel" | "noshow",
    b: BookingWithRelations,
  ) => void;
}) {
  const [tab, setTab] = useState<"overview" | "scheduling" | "history" | "ai">(
    "overview",
  );
  useEffect(() => {
    if (open) setTab("overview");
  }, [open]);

  if (!booking) return null;

  const cfg = BOOKING_STATUS_CONFIG[booking.status];

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "scheduling", label: "Scheduling" },
    { id: "history", label: "History", count: booking.statusHistory.length },
    ...(booking.aiSummary || booking.transcriptUrl
      ? [{ id: "ai", label: "AI Data" }]
      : []),
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] rounded-2xl border-border/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 border-b border-border/40 bg-muted/10 shrink-0">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                avatarColor(booking.client.email),
              )}
            >
              {getInitials(booking.client.fullName, booking.client.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-sm font-semibold text-foreground leading-none">
                {booking.client.fullName ?? booking.client.email}
              </DialogTitle>
              <StatusBadge status={booking.status} />
            </div>
            <DialogDescription className="text-[10px] text-muted-foreground mt-1">
              {booking.type} call · {booking.durationMinutes} min · Requested{" "}
              {fmt(booking.createdAt)}
            </DialogDescription>
          </div>
        </div>

        {/* Status context + quick actions */}
        <div
          className={cn(
            "mx-5 mt-3 rounded-xl border px-3.5 py-3 text-xs leading-relaxed shrink-0",
            cfg.borderColor,
          )}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <cfg.icon size={11} />
            <span className="font-semibold">{cfg.label}</span>
          </div>
          <p className="opacity-70">{cfg.description}</p>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {booking.status === "REQUESTED" && (
              <button
                type="button"
                onClick={() => onAction("schedule", booking)}
                className="h-7 px-3 text-xs font-medium rounded-lg bg-[#7b57fc] hover:bg-[#6a48e8] text-white flex items-center gap-1.5 transition-colors"
              >
                <Calendar size={11} /> Schedule
              </button>
            )}
            {(booking.status === "PROPOSED" ||
              booking.status === "CONFIRMED") && (
              <>
                <button
                  type="button"
                  onClick={() => onAction("complete", booking)}
                  className="h-7 px-3 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 transition-colors"
                >
                  <ClipboardCheck size={11} /> Complete
                </button>
                <button
                  type="button"
                  onClick={() => onAction("noshow", booking)}
                  className="h-7 px-3 text-xs font-medium rounded-lg border border-orange-300/60 text-orange-600 bg-orange-500/8 hover:bg-orange-500/15 flex items-center gap-1.5 transition-colors"
                >
                  <UserX size={11} /> No Show
                </button>
              </>
            )}
            {!["COMPLETED", "CANCELED", "NO_SHOW"].includes(booking.status) && (
              <button
                type="button"
                onClick={() => onAction("cancel", booking)}
                className="h-7 px-3 text-xs font-medium rounded-lg border border-red-300/60 text-red-600 bg-red-500/8 hover:bg-red-500/15 flex items-center gap-1.5 transition-colors"
              >
                <XCircle size={11} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 border-b border-border/40 shrink-0 mt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                tab === t.id
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {"count" in t && t.count !== undefined && t.count > 0 && (
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <SectionLabel>Client</SectionLabel>
                  <p className="text-sm font-semibold mt-1 truncate">
                    {booking.client.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.client.email}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <SectionLabel>Duration</SectionLabel>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {booking.durationMinutes}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">
                      min
                    </span>
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                <SectionLabel>Request Notes</SectionLabel>
                <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {booking.requestNotes ?? (
                    <span className="italic text-muted-foreground">
                      None provided
                    </span>
                  )}
                </p>
              </div>
              {booking.clientConfirmedAt && (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-400/20">
                  <SectionLabel>Client Confirmed At</SectionLabel>
                  <p className="text-sm font-semibold mt-1 text-emerald-600 dark:text-emerald-400">
                    {fmtDT(booking.clientConfirmedAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SCHEDULING */}
          {tab === "scheduling" && (
            <div className="space-y-3">
              {booking.scheduledAt ? (
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#7b57fc]/10 shrink-0">
                      <Calendar size={14} className="text-[#7b57fc]" />
                    </span>
                    <p className="text-sm font-semibold">
                      {fmtDT(booking.scheduledAt)}
                    </p>
                  </div>
                  {booking.meetingProvider && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Monitor size={11} />
                      {booking.meetingProvider.replace("_", " ")}
                    </div>
                  )}
                  {booking.meetingLink && (
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#7b57fc] hover:underline"
                    >
                      <ExternalLink size={11} /> Join Meeting
                    </a>
                  )}
                  {booking.meetingPassword && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <KeyRound size={11} />
                      <span className="font-mono">
                        {booking.meetingPassword}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border border-dashed border-border/40">
                  <span className="h-12 w-12 flex items-center justify-center rounded-2xl bg-muted/60">
                    <Calendar size={20} className="text-muted-foreground/40" />
                  </span>
                  <p className="text-xs text-muted-foreground">
                    No time scheduled yet
                  </p>
                  {booking.status === "REQUESTED" && (
                    <button
                      type="button"
                      onClick={() => onAction("schedule", booking)}
                      className="h-7 px-3 text-xs font-medium rounded-lg bg-[#7b57fc] hover:bg-[#6a48e8] text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Calendar size={11} /> Schedule Now
                    </button>
                  )}
                </div>
              )}
              {booking.slot && (
                <div className="rounded-xl border border-border/30 bg-muted/10 p-3">
                  <SectionLabel>Assigned Slot</SectionLabel>
                  <p className="text-xs mt-1.5 font-medium">
                    {fmtDT(booking.slot.startTime)} —{" "}
                    {format(new Date(booking.slot.endTime), "h:mm a")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {booking.slot.durationMinutes} min
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <div className="space-y-0">
              {booking.statusHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No history yet
                </p>
              ) : (
                booking.statusHistory.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full mt-1.5",
                          i === 0 ? "bg-[#7b57fc]" : "bg-border",
                        )}
                      />
                      {i < booking.statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-border/40 my-1" />
                      )}
                    </div>
                    <div className="pb-3 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={entry.oldStatus} />
                        <span className="text-[10px] text-muted-foreground">
                          →
                        </span>
                        <StatusBadge status={entry.newStatus} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        by {entry.changedBy.fullName ?? entry.changedBy.email}
                        {" · "}
                        {fmtDT(entry.changedAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AI */}
          {tab === "ai" && (
            <div className="space-y-3">
              {booking.aiSummary && (
                <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
                  <SectionLabel>AI Summary</SectionLabel>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap mt-2 text-foreground/80">
                    {booking.aiSummary}
                  </p>
                </div>
              )}
              {booking.transcriptUrl && (
                <a
                  href={booking.transcriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#7b57fc] hover:underline"
                >
                  <ExternalLink size={11} /> View Transcript
                </a>
              )}
              {!booking.aiSummary && !booking.transcriptUrl && (
                <p className="text-xs text-muted-foreground italic">
                  No AI data available yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 shrink-0 flex items-center justify-between bg-muted/10">
          <span className="text-[10px] text-muted-foreground font-mono">
            {booking.id.slice(0, 8).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE DIALOG  (logic identical)
// ─────────────────────────────────────────────────────────────────────────────

const scheduleSchema = z.object({
  slotId: z.string().min(1, "Please select a slot"),
  meetingLink: z.string().url("Must be a valid URL"),
  meetingPassword: z.string().optional(),
  meetingProvider: z.nativeEnum(MeetingProvider).optional(),
});
type ScheduleValues = z.infer<typeof scheduleSchema>;

function ScheduleDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: {
  booking: BookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [slots, setSlots] = useState<
    { id: string; startTime: Date; endTime: Date; durationMinutes: number }[]
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      slotId: "",
      meetingLink: "",
      meetingPassword: "",
      meetingProvider: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      setLoadingSlots(true);
      getAvailableSlots().then((r) => {
        if (r.success) setSlots(r.data as any);
        setLoadingSlots(false);
      });
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (data: ScheduleValues) => {
    if (!booking) return;
    startTransition(async () => {
      const r = await scheduleBooking({
        bookingId: booking.id,
        slotId: data.slotId,
        meetingLink: data.meetingLink,
        meetingPassword: data.meetingPassword,
        meetingProvider: data.meetingProvider,
      });
      if (r.success) {
        toast.success("Booking scheduled", {
          description: "Client has been notified.",
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error("Failed", { description: r.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 rounded-2xl border-border/50 shadow-2xl overflow-hidden gap-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border/40 bg-muted/10 flex items-center gap-3">
          <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#7b57fc]/10 shrink-0">
            <Calendar size={15} className="text-[#7b57fc]" />
          </span>
          <div>
            <DialogTitle className="text-sm font-semibold">
              Schedule Video Call
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {booking
                ? `For ${booking.client.fullName ?? booking.client.email}`
                : ""}
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-5 space-y-4"
          >
            {/* Slot */}
            <FormField
              control={form.control}
              name="slotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Availability Slot
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20">
                        <SelectValue
                          placeholder={
                            loadingSlots ? "Loading slots…" : "Select a slot"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl">
                      {slots.length === 0 && !loadingSlots && (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                          No available slots. Create one first.
                        </div>
                      )}
                      {slots.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {format(new Date(s.startTime), "EEE MMM d, h:mm a")} —{" "}
                          {format(new Date(s.endTime), "h:mm a")} (
                          {s.durationMinutes}m)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Meeting provider */}
            <FormField
              control={form.control}
              name="meetingProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Platform{" "}
                    <span className="font-normal normal-case text-muted-foreground/70">
                      (optional)
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl">
                      {Object.values(MeetingProvider).map((p) => (
                        <SelectItem key={p} value={p} className="text-xs">
                          {p.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Meeting link */}
            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Meeting Link
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Link2
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <Input
                        placeholder="https://zoom.us/j/…"
                        {...field}
                        className="pl-7 h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="meetingPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Password{" "}
                    <span className="font-normal normal-case text-muted-foreground/70">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <Input
                        placeholder="Meeting password"
                        {...field}
                        className="pl-7 h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="flex-1 h-8 text-xs font-medium rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || loadingSlots}
                className="flex-1 h-8 text-xs font-medium rounded-xl bg-[#7b57fc] hover:bg-[#6a48e8] text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Calendar size={12} />
                )}
                Schedule
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE DIALOG  (logic identical)
// ─────────────────────────────────────────────────────────────────────────────

const completeSchema = z.object({
  transcriptUrl: z.string().url().optional().or(z.literal("")),
  aiSummary: z.string().optional(),
});
type CompleteValues = z.infer<typeof completeSchema>;

function CompleteDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: {
  booking: BookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CompleteValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: { transcriptUrl: "", aiSummary: "" },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const onSubmit = (data: CompleteValues) => {
    if (!booking) return;
    startTransition(async () => {
      const r = await completeBooking({
        bookingId: booking.id,
        transcriptUrl: data.transcriptUrl || undefined,
        aiSummary: data.aiSummary || undefined,
      });
      if (r.success) {
        toast.success("Booking completed");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error("Failed", { description: r.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 rounded-2xl border-border/50 shadow-2xl overflow-hidden gap-0">
        <div className="px-5 pt-5 pb-4 border-b border-border/40 bg-muted/10 flex items-center gap-3">
          <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
            <ClipboardCheck size={15} className="text-emerald-500" />
          </span>
          <div>
            <DialogTitle className="text-sm font-semibold">
              Mark as Completed
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Optionally add transcript and AI summary.
            </DialogDescription>
          </div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-5 space-y-4"
          >
            <FormField
              control={form.control}
              name="transcriptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Transcript URL{" "}
                    <span className="font-normal normal-case text-muted-foreground/70">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Link2
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <Input
                        placeholder="https://…"
                        {...field}
                        className="pl-7 h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aiSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    AI Summary{" "}
                    <span className="font-normal normal-case text-muted-foreground/70">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summary of the call…"
                      rows={4}
                      className="text-xs resize-none bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="flex-1 h-8 text-xs font-medium rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-8 text-xs font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Mark Completed
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL DIALOG  (logic identical)
// ─────────────────────────────────────────────────────────────────────────────

function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: {
  booking: BookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!booking) return;
    setLoading(true);
    const r = await cancelBookingByAdmin({
      bookingId: booking.id,
      reason: reason || undefined,
    });
    setLoading(false);
    if (r.success) {
      toast.success("Booking cancelled");
      onOpenChange(false);
      setReason("");
      onSuccess();
    } else {
      toast.error("Failed", { description: r.error });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92vw] sm:max-w-sm p-0 rounded-2xl border-border/60 bg-card overflow-hidden shadow-2xl">
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 bg-red-500/6 border-b border-red-400/15">
          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/15 shrink-0">
            <XCircle size={18} className="text-red-500" />
          </span>
          <AlertDialogHeader className="space-y-0.5 text-left p-0">
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              The client will be notified. Optionally provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <div className="px-5 py-4">
          <Textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="text-xs resize-none bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
          />
        </div>
        <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
          <AlertDialogCancel
            disabled={loading}
            className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0"
          >
            Back
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={loading}
            className="h-8 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white m-0 flex items-center gap-1.5"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Cancel Booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NO SHOW DIALOG  (logic identical)
// ─────────────────────────────────────────────────────────────────────────────

function NoShowDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: {
  booking: BookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!booking) return;
    setLoading(true);
    const r = await markNoShow({ bookingId: booking.id });
    setLoading(false);
    if (r.success) {
      toast.success("Marked as no-show");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error("Failed", { description: r.error });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92vw] sm:max-w-sm p-0 rounded-2xl border-border/60 bg-card overflow-hidden shadow-2xl">
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 bg-orange-500/6 border-b border-orange-400/15">
          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/15 shrink-0">
            <UserX size={18} className="text-orange-500" />
          </span>
          <AlertDialogHeader className="space-y-0.5 text-left p-0">
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Mark as No Show
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Mark this booking as a client no-show? The client will be
              notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="flex-row justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
          <AlertDialogCancel
            disabled={loading}
            className="h-8 text-xs rounded-lg border-border/60 bg-background hover:bg-muted/60 m-0"
          >
            Back
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handle}
            disabled={loading}
            className="h-8 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white m-0 flex items-center gap-1.5"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Mark No Show
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT MANAGER  (logic identical)
// ─────────────────────────────────────────────────────────────────────────────

type SlotFormValues = {
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

function SlotManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [slots, setSlots] = useState<SlotWithBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SlotFormValues>({
    defaultValues: { startTime: "", endTime: "", durationMinutes: 30 },
  });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const r = await getAllSlots(p, 10);
    if (r.success) {
      setSlots(r.data.slots as SlotWithBooking[]);
      setTotalPages(r.data.pagination.totalPages);
      setPage(p);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load(1);
  }, [open, load]);

  const onSubmit = (data: SlotFormValues) => {
    startTransition(async () => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      const r = await createSlot({
        startTime: start,
        endTime: end,
        durationMinutes: data.durationMinutes,
      });
      if (r.success) {
        toast.success("Slot created");
        form.reset();
        load(1);
      } else {
        toast.error("Failed", { description: r.error });
      }
    });
  };

  const handleDelete = (slotId: string) => {
    startTransition(async () => {
      const r = await deleteSlot({ slotId });
      if (r.success) {
        toast.success("Slot deleted");
        load(page);
      } else toast.error("Failed", { description: r.error });
    });
  };

  const handleToggle = (slotId: string, isActive: boolean) => {
    startTransition(async () => {
      const r = await toggleSlotActive({ slotId, isActive });
      if (r.success) load(page);
      else toast.error("Failed", { description: r.error });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh] rounded-2xl border-border/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border/40 bg-muted/10 shrink-0 flex items-center gap-3">
          <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#7b57fc]/10 shrink-0">
            <CalendarDays size={15} className="text-[#7b57fc]" />
          </span>
          <div>
            <DialogTitle className="text-sm font-semibold">
              Availability Slots
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Create and manage time slots that can be assigned to bookings.
            </DialogDescription>
          </div>
        </div>

        {/* Create form */}
        <div className="px-5 pb-4 pt-4 border-b border-border/40 shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Add New Slot
          </p>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-3 gap-3 items-end"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Start Time
              </label>
              <Input
                type="datetime-local"
                {...form.register("startTime")}
                className="h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                End Time
              </label>
              <Input
                type="datetime-local"
                {...form.register("endTime")}
                className="h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Duration (min)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  {...form.register("durationMinutes")}
                  min="5"
                  className="h-8 text-xs bg-muted/40 border-border/50 rounded-lg focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#7b57fc] hover:bg-[#6a48e8] text-white transition-colors shrink-0 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Slots list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {loading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
              <Loader2
                size={18}
                className="animate-spin text-muted-foreground"
              />
            </div>
          )}
          {slots.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <span className="h-12 w-12 flex items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50">
                <CalendarDays size={20} className="text-muted-foreground/40" />
              </span>
              <p className="text-xs text-muted-foreground">
                No slots yet. Create one above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => {
                const isBooked = slot.isBooked; // use explicit DB boolean, not relation
                const isInactive = !slot.isActive;

                return (
                  <div
                    key={slot.id}
                    className={cn(
                      "rounded-xl border p-3 flex items-center justify-between gap-3 transition-all",
                      isInactive
                        ? "opacity-50 border-border/30"
                        : "border-border/40",
                      isBooked
                        ? "bg-amber-500/5"
                        : isInactive
                          ? "bg-muted/10"
                          : "bg-card",
                    )}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <span
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-lg shrink-0",
                          isBooked
                            ? "bg-amber-500/10"
                            : isInactive
                              ? "bg-muted/60"
                              : "bg-[#7b57fc]/10",
                        )}
                      >
                        <AlarmClock
                          size={13}
                          className={cn(
                            isBooked
                              ? "text-amber-500"
                              : isInactive
                                ? "text-muted-foreground/50"
                                : "text-[#7b57fc]",
                          )}
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">
                          {format(
                            new Date(slot.startTime),
                            "EEE, MMM d · h:mm a",
                          )}{" "}
                          — {format(new Date(slot.endTime), "h:mm a")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {slot.durationMinutes} min
                          </span>
                          {isBooked ? (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-400/30">
                              Booked
                            </span>
                          ) : slot.isActive ? (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-400/30">
                              Available
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground ring-1 ring-border/40">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={slot.isActive}
                        disabled={isBooked || isPending}
                        onCheckedChange={(v) => handleToggle(slot.id, v)}
                        className="data-[state=checked]:bg-[#7b57fc]"
                      />
                      {!isBooked && (
                        <Button
                          variant={"ghost"}
                          type="button"
                          onClick={() => handleDelete(slot.id)}
                          disabled={isPending}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-border/40 shrink-0">
            <Button
              variant={"ghost"}
              type="button"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-lg border text-muted-foreground transition-all",
                page > 1
                  ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
                  : "border-border/30 opacity-40 cursor-not-allowed",
              )}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-lg border text-muted-foreground transition-all",
                page < totalPages
                  ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
                  : "border-border/30 opacity-40 cursor-not-allowed",
              )}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION  (logic identical)
// ─────────────────────────────────────────────────────────────────────────────

function BookingPagination({ pagination }: { pagination: PaginationInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { page, totalPages, totalCount, pageSize } = pagination;

  const go = (n: number) => {
    const p = new URLSearchParams(params);
    p.set("page", String(n));
    router.push(`${pathname}?${p.toString()}`);
  };

  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1))
      pages.push(i);
    else if (pages[pages.length - 1] !== "ellipsis") pages.push("ellipsis");
  }

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 shrink-0">
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
        <button
          type="button"
          onClick={() => {
            if (page > 1) go(page - 1);
          }}
          disabled={page <= 1}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all",
            page > 1
              ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
              : "border-border/30 opacity-40 cursor-not-allowed",
          )}
        >
          <ChevronLeft size={14} />
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`e${i}`}
                className="px-2 text-muted-foreground text-xs"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p as number)}
                className={cn(
                  "flex h-8 min-w-8 px-2 items-center justify-center rounded-lg border text-xs font-medium transition-all tabular-nums",
                  p === page
                    ? "border-[#7b57fc]/40 bg-[#7b57fc]/10 text-[#7b57fc]"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/40",
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <span className="sm:hidden text-xs text-muted-foreground px-2 tabular-nums">
          {page}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => {
            if (page < totalPages) go(page + 1);
          }}
          disabled={page >= totalPages}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-all",
            page < totalPages
              ? "border-border/60 hover:border-border hover:text-foreground hover:bg-muted/40"
              : "border-border/30 opacity-40 cursor-not-allowed",
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CLIENT COMPONENT  (logic identical to original AdminBookingsClient)
// ─────────────────────────────────────────────────────────────────────────────

interface AdminBookingsClientProps {
  initialBookings: BookingWithRelations[];
  initialPagination: PaginationInfo;
  initialStatus: BookingStatus | null;
  initialEmail: string;
  initialPage: number;
}

export function AdminBookingsClient({
  initialBookings,
  initialPagination,
  initialStatus,
  initialEmail,
  initialPage,
}: AdminBookingsClientProps) {
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") as BookingStatus | null;
  const activePage = parseInt(searchParams.get("page") || "1");

  const [bookings, setBookings] = useState(initialBookings);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [emailFilter, setEmailFilter] = useState(initialEmail);

  // Dialog states
  const [detailBooking, setDetailBooking] =
    useState<BookingWithRelations | null>(null);
  const [scheduleTarget, setScheduleTarget] =
    useState<BookingWithRelations | null>(null);
  const [completeTarget, setCompleteTarget] =
    useState<BookingWithRelations | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingWithRelations | null>(
    null,
  );
  const [noshowTarget, setNoshowTarget] = useState<BookingWithRelations | null>(
    null,
  );
  const [slotsOpen, setSlotsOpen] = useState(false);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    const r = await getAllBookings({
      page: activePage,
      pageSize: 20,
      status: activeStatus ?? undefined,
      clientEmail: emailFilter || undefined,
    });
    if (r.success) {
      setBookings(r.data.bookings as BookingWithRelations[]);
      setPagination(r.data.pagination);
    }
    setLoading(false);
  }, [activePage, activeStatus, emailFilter]);

  useEffect(() => {
    let cancelled = false;
    if (activePage !== initialPage || activeStatus !== initialStatus) {
      setLoading(true);
      getAllBookings({
        page: activePage,
        pageSize: 20,
        status: activeStatus ?? undefined,
        clientEmail: emailFilter || undefined,
      }).then((r) => {
        if (!cancelled && r.success) {
          setBookings(r.data.bookings as BookingWithRelations[]);
          setPagination(r.data.pagination);
        }
        if (!cancelled) setLoading(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [activePage, activeStatus]); // eslint-disable-line

  const handleAction = (
    action: "schedule" | "complete" | "cancel" | "noshow",
    b: BookingWithRelations,
  ) => {
    setDetailBooking(null);
    setTimeout(() => {
      if (action === "schedule") setScheduleTarget(b);
      if (action === "complete") setCompleteTarget(b);
      if (action === "cancel") setCancelTarget(b);
      if (action === "noshow") setNoshowTarget(b);
    }, 100);
  };

  return (
    <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col shadow-sm">
      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border/40 shrink-0 space-y-2.5">
        {/* Row 1: search + buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Email search */}
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            {loading && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[#7b57fc] border-t-transparent animate-spin" />
            )}
            <Input
              placeholder="Search by client email…"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchPage();
              }}
              className="pl-8 pr-7 h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
            />
            {emailFilter && !loading && (
              <Button
                variant={"ghost"}
                type="button"
                onClick={() => {
                  setEmailFilter("");
                  fetchPage();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={11} />
              </Button>
            )}
          </div>

          {/* Manage Slots */}
          <Button
            variant={"ghost"}
            type="button"
            onClick={() => setSlotsOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            <CalendarDays size={12} />
            Manage Slots
          </Button>

          {/* Refresh */}
          <Button
            variant={"ghost"}
            type="button"
            onClick={fetchPage}
            title="Refresh"
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </Button>

          {/* Count */}
          <span className="text-xs text-muted-foreground tabular-nums ml-auto hidden sm:block">
            {pagination.totalCount.toLocaleString()} booking
            {pagination.totalCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Status filter tabs */}
        <StatusFilterTabs activeStatus={activeStatus} />
      </div>

      {/* ── BOOKING ROWS ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && bookings.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Empty state */}
        {bookings.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50"
            >
              <Video size={26} className="text-muted-foreground/40" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-foreground/70">
                No bookings found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeStatus
                  ? "Try a different status filter."
                  : "No video bookings yet."}
              </p>
            </div>
          </div>
        ) : (
          /* Booking rows */
          <AnimatePresence initial={false}>
            {bookings.map((booking, i) => {
              const cfg = BOOKING_STATUS_CONFIG[booking.status];
              return (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    delay: i * 0.02,
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                  }}
                  onClick={() => setDetailBooking(booking)}
                  className="group flex items-center gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-bold",
                        avatarColor(booking.client.email),
                      )}
                    >
                      {getInitials(
                        booking.client.fullName,
                        booking.client.email,
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {booking.client.fullName ?? booking.client.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {booking.client.fullName ? booking.client.email : ""}
                    </p>
                  </div>

                  {/* Type */}
                  <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
                    {booking.type.charAt(0) +
                      booking.type.slice(1).toLowerCase()}
                  </span>

                  {/* Status */}
                  <div className="shrink-0">
                    <StatusBadge status={booking.status} />
                  </div>

                  {/* Scheduled */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <Clock size={10} className="text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                      {booking.scheduledAt ? fmtDT(booking.scheduledAt) : "—"}
                    </span>
                  </div>

                  {/* Duration */}
                  <span className="hidden lg:block text-xs text-muted-foreground tabular-nums shrink-0">
                    {booking.durationMinutes}m
                  </span>

                  {/* Created */}
                  <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                    <Calendar size={10} className="text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                      {fmt(booking.createdAt)}
                    </span>
                  </div>

                  {/* Actions menu */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={"ghost"}
                          type="button"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground cursor-pointer"
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl border-border/60 bg-card/95 backdrop-blur-sm shadow-xl p-1"
                      >
                        <DropdownMenuItem
                          onClick={() => setDetailBooking(booking)}
                          className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-muted/60"
                        >
                          <span className="h-6 w-6 flex items-center justify-center rounded-md bg-muted/60">
                            <Eye size={12} />
                          </span>
                          View Details
                        </DropdownMenuItem>

                        {booking.status === "REQUESTED" && (
                          <DropdownMenuItem
                            onClick={() => handleAction("schedule", booking)}
                            className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-[#7b57fc]/10 focus:text-[#7b57fc]"
                          >
                            <span className="h-6 w-6 flex items-center justify-center rounded-md bg-[#7b57fc]/10">
                              <Calendar size={12} className="text-[#7b57fc]" />
                            </span>
                            Schedule
                          </DropdownMenuItem>
                        )}

                        {(booking.status === "PROPOSED" ||
                          booking.status === "CONFIRMED") && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAction("complete", booking)}
                              className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-600"
                            >
                              <span className="h-6 w-6 flex items-center justify-center rounded-md bg-emerald-500/10">
                                <ClipboardCheck
                                  size={12}
                                  className="text-emerald-500"
                                />
                              </span>
                              Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction("noshow", booking)}
                              className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer focus:bg-orange-500/10 focus:text-orange-600"
                            >
                              <span className="h-6 w-6 flex items-center justify-center rounded-md bg-orange-500/10">
                                <UserX size={12} className="text-orange-500" />
                              </span>
                              No Show
                            </DropdownMenuItem>
                          </>
                        )}

                        {!["COMPLETED", "CANCELED", "NO_SHOW"].includes(
                          booking.status,
                        ) && (
                          <>
                            <DropdownMenuSeparator className="bg-border/40 my-1" />
                            <DropdownMenuItem
                              onClick={() => handleAction("cancel", booking)}
                              className="flex items-center gap-2.5 text-xs px-2 py-2 rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                              <span className="h-6 w-6 flex items-center justify-center rounded-md bg-red-500/10">
                                <XCircle size={12} />
                              </span>
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── PAGINATION ───────────────────────────────────────────────────── */}
      <BookingPagination pagination={pagination} />

      {/* ── DIALOGS ──────────────────────────────────────────────────────── */}
      <BookingDetailsDialog
        booking={detailBooking}
        open={!!detailBooking}
        onOpenChange={(v) => {
          if (!v) setDetailBooking(null);
        }}
        onAction={handleAction}
      />
      <ScheduleDialog
        booking={scheduleTarget}
        open={!!scheduleTarget}
        onOpenChange={(v) => {
          if (!v) setScheduleTarget(null);
        }}
        onSuccess={fetchPage}
      />
      <CompleteDialog
        booking={completeTarget}
        open={!!completeTarget}
        onOpenChange={(v) => {
          if (!v) setCompleteTarget(null);
        }}
        onSuccess={fetchPage}
      />
      <CancelBookingDialog
        booking={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(v) => {
          if (!v) setCancelTarget(null);
        }}
        onSuccess={fetchPage}
      />
      <NoShowDialog
        booking={noshowTarget}
        open={!!noshowTarget}
        onOpenChange={(v) => {
          if (!v) setNoshowTarget(null);
        }}
        onSuccess={fetchPage}
      />
      <SlotManager open={slotsOpen} onOpenChange={setSlotsOpen} />
    </div>
  );
}
