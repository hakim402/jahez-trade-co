"use client";

// All business logic / actions / hooks are identical to the original.
// Only visual markup has changed.

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Loader2,
  Video,
  ExternalLink,
  Eye,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Calendar,
  Clock,
  Crown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  ArrowRight,
  FileText,
  Link2,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { BookingType, BookingStatus } from "@prisma/client";
import {
  getMyBookings,
  createBooking,
  confirmScheduledBooking,
  cancelMyBooking,
} from "../actions";
import {
  BOOKING_STATUS_CONFIG,
  type ClientBookingWithRelations,
  type PaginationInfo,
  type UserPlanInfo,
} from "./types";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy");
}
function fmtTime(d: Date | string | null | undefined) {
  if (!d) return "";
  return format(new Date(d), "h:mm a");
}
function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy · h:mm a");
}
function fmtType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CONFIG[status];
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
// BOOKING DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

type DetailTab = "overview" | "scheduling" | "history" | "ai";

function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: {
  booking: ClientBookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (b: ClientBookingWithRelations) => void;
  onCancel: (b: ClientBookingWithRelations) => void;
}) {
  const [tab, setTab] = useState<DetailTab>("overview");

  useEffect(() => {
    if (open) setTab("overview");
  }, [open]);

  if (!booking) return null;

  const cfg = BOOKING_STATUS_CONFIG[booking.status];
  const CfgIcon = cfg.icon;

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "scheduling", label: "Scheduling" },
    { id: "history", label: "History", count: booking.statusHistory.length },
    ...(booking.aiSummary ? [{ id: "ai" as const, label: "AI Summary" }] : []),
  ] as { id: DetailTab; label: string; count?: number }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-xl max-h-[90vh] rounded-2xl border border-border/15 bg-card shadow-2xl flex flex-col overflow-hidden"
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
              <StatusBadge status={booking.status} />
              <span className="text-[10px] text-muted-foreground font-mono">
                #{booking.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {fmtType(booking.type)} Video Call
            </p>
            <p className="text-[10px] text-muted-foreground">
              Requested {fmt(booking.createdAt)}
            </p>
          </div>
          <Button
            variant={"ghost"}
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Status context + action strip */}
        <div
          className={cn(
            "mx-4 mt-3 flex flex-col gap-2.5 px-3.5 py-3 rounded-xl border text-xs leading-relaxed",
            cfg.chip,
          )}
        >
          <div className="flex items-start gap-2">
            <CfgIcon size={12} className="shrink-0 mt-0.5" />
            <p>{cfg.description}</p>
          </div>
          {booking.status === "PROPOSED" && (
            <div className="flex gap-2 pt-0.5">
              <button
                onClick={() => onConfirm(booking)}
                className="flex items-center gap-1 h-7 px-3 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
              >
                <Check size={11} /> Confirm
              </button>
              <button
                onClick={() => onCancel(booking)}
                className="flex items-center gap-1 h-7 px-2.5 text-xs font-semibold rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <XCircle size={11} /> Cancel
              </button>
            </div>
          )}
          {booking.status === "REQUESTED" && (
            <div className="pt-0.5">
              <button
                onClick={() => onCancel(booking)}
                className="flex items-center gap-1 h-7 px-2.5 text-xs font-semibold rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <XCircle size={11} /> Cancel Request
              </button>
            </div>
          )}
        </div>

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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Call Type", value: fmtType(booking.type) },
                { label: "Duration", value: `${booking.durationMinutes} min` },
                booking.clientConfirmedAt
                  ? {
                      label: "Confirmed At",
                      value: fmtDateTime(booking.clientConfirmedAt),
                    }
                  : null,
              ]
                .filter(Boolean)
                .map((item: any) => (
                  <div key={item.label} className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm text-foreground/80">{item.value}</p>
                  </div>
                ))}
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Notes
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {booking.requestNotes ?? (
                    <span className="italic text-muted-foreground">
                      No notes provided
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* SCHEDULING */}
          {tab === "scheduling" &&
            (booking.scheduledAt ? (
              <div className="rounded-xl border border-border/10 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-color/15">
                    <Calendar size={15} className="text-color" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {fmt(booking.scheduledAt)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> {fmtTime(booking.scheduledAt)}
                    </p>
                  </div>
                </div>

                {booking.meetingProvider && (
                  <p className="text-xs text-muted-foreground">
                    via{" "}
                    {booking.meetingProvider.charAt(0) +
                      booking.meetingProvider
                        .slice(1)
                        .toLowerCase()
                        .replace("_", " ")}
                  </p>
                )}

                {booking.meetingLink && (
                  <a
                    href={booking.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-color hover:bg-color/90 text-white transition-colors"
                  >
                    <Link2 size={12} /> Join Meeting
                    <ExternalLink size={10} />
                  </a>
                )}
                {booking.meetingPassword && (
                  <p className="text-xs text-muted-foreground">
                    Password:{" "}
                    <span className="font-mono text-foreground/70">
                      {booking.meetingPassword}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
                  <Calendar size={24} className="text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-foreground/60">
                  No time scheduled yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Our team will propose a time soon.
                </p>
              </div>
            ))}

          {/* HISTORY */}
          {tab === "history" &&
            (booking.statusHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">
                No history yet.
              </p>
            ) : (
              <div className="space-y-0">
                {booking.statusHistory.map((entry, i) => {
                  const newCfg = BOOKING_STATUS_CONFIG[entry.newStatus];
                  return (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            i === 0 ? newCfg.dot : "bg-border/60",
                          )}
                        />
                        {i < booking.statusHistory.length - 1 && (
                          <div className="w-px flex-1 min-h-6 bg-border/20 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={entry.oldStatus} />
                          <span className="text-xs text-muted-foreground">
                            →
                          </span>
                          <StatusBadge status={entry.newStatus} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {fmtDateTime(entry.changedAt)}
                          <span className="ml-1.5">
                            by{" "}
                            {entry.changedBy.fullName ?? entry.changedBy.email}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          {/* AI SUMMARY */}
          {tab === "ai" && (
            <div className="space-y-3">
              {booking.aiSummary && (
                <div className="rounded-xl border border-border/10 bg-muted/20 p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    AI Summary
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                    {booking.aiSummary}
                  </p>
                </div>
              )}
              {booking.transcriptUrl && (
                <a
                  href={booking.transcriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-color hover:underline font-medium"
                >
                  <ExternalLink size={12} /> View Full Transcript
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/10 bg-muted/5 shrink-0">
          <span className="text-[10px] text-muted-foreground">
            ID: <span className="font-mono">{booking.id.slice(0, 8)}</span>
          </span>
          <button
            onClick={() => onOpenChange(false)}
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
// CREATE BOOKING DIALOG
// ─────────────────────────────────────────────────────────────────────────────

const bookingFormSchema = z.object({
  type: z.nativeEnum(BookingType).default("CUSTOM"),
  requestNotes: z.string().max(2000).optional(),
  durationMinutes: z.coerce.number().int().positive().default(30),
  preferredTime: z.date().optional(),
});

type BookingFormValues = {
  type: BookingType;
  requestNotes?: string;
  durationMinutes: number;
  preferredTime?: Date;
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;

function CreateBookingDialog({
  open,
  onOpenChange,
  onSuccess,
  planInfo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  planInfo: UserPlanInfo;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(
      bookingFormSchema,
    ) as unknown as Resolver<BookingFormValues>,
    defaultValues: {
      type: "CUSTOM",
      requestNotes: "",
      durationMinutes: 30,
      preferredTime: undefined,
    },
  });

  const handleClose = () => {
    form.reset();
    setError(null);
    onOpenChange(false);
  };

  const onSubmit = (data: BookingFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await createBooking(data);
      if (result.success) {
        toast.success("Booking requested", {
          description: "Your video call request has been submitted.",
        });
        handleClose();
        onSuccess();
      } else {
        if (result.error?.startsWith("UPGRADE_REQUIRED")) {
          setError(result.error.replace("UPGRADE_REQUIRED: ", ""));
        } else {
          toast.error("Failed to submit", { description: result.error });
        }
      }
    });
  };

  const isAtLimit =
    planInfo.billingEnabled &&
    planInfo.limit !== Infinity &&
    planInfo.usedCount >= planInfo.limit;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-2xl border border-border/15 bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 px-5 pt-5 pb-4 border-b border-border/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-color/15">
            <Video size={18} className="text-color" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Request Video Call
            </h2>
            <p className="text-xs text-muted-foreground">
              Tell us what you'd like to discuss
            </p>
          </div>
          <Button
            variant={"ghost"}
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Upgrade gate */}
          {isAtLimit && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-500/8 border border-amber-400/15">
              <AlertTriangle
                size={14}
                className="text-amber-400 shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Plan limit reached
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your {planInfo.planName} plan allows {planInfo.limit} booking
                  {planInfo.limit === 1 ? "" : "s"}. Please upgrade to request
                  more video calls.
                </p>
                <button className="mt-2 flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors">
                  <Crown size={10} /> Upgrade Plan
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-400/15 text-red-400 text-xs">
              <AlertTriangle size={12} /> {error}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3.5"
            >
              {/* Type + Duration row */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">
                        Call Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-muted/20 border-border/20 rounded-xl">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-border/20 bg-card/95 backdrop-blur-sm shadow-xl">
                          {Object.values(BookingType).map((t) => (
                            <SelectItem
                              key={t}
                              value={t}
                              className="rounded-lg"
                            >
                              {fmtType(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground">
                        Duration
                      </FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-muted/20 border-border/20 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-border/20 bg-card/95 backdrop-blur-sm shadow-xl">
                          {DURATION_OPTIONS.map((d) => (
                            <SelectItem
                              key={d}
                              value={String(d)}
                              className="rounded-lg"
                            >
                              {d} minutes
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preferred time */}
              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">
                      Preferred Time{" "}
                      <span className="font-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="h-9 text-sm bg-muted/20 border-border/20 rounded-xl focus-visible:border-color/40 focus-visible:ring-1 focus-visible:ring-color/20"
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          )
                        }
                        value={
                          field.value
                            ? field.value.toISOString().slice(0, 16)
                            : ""
                        }
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="requestNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground">
                      Notes{" "}
                      <span className="font-normal text-muted-foreground/60">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What would you like to discuss? Any specific questions or goals?"
                        rows={3}
                        className="resize-none text-sm bg-muted/20 border-border/20 rounded-xl focus-visible:border-color/40 focus-visible:ring-1 focus-visible:ring-color/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="flex-1 h-9 text-sm font-medium rounded-xl border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isAtLimit}
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
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM / CANCEL DIALOGS
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: {
  booking: ClientBookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!booking) return;
    setLoading(true);
    const r = await confirmScheduledBooking({ bookingId: booking.id });
    setLoading(false);
    if (r.success) {
      toast.success("Booking confirmed", {
        description: "Your video call is confirmed.",
      });
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error("Error", { description: r.error });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onOpenChange(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.16 }}
        className="w-full max-w-sm rounded-2xl border border-border/15 bg-card shadow-2xl overflow-hidden"
      >
        {/* Coloured header strip */}
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 border-b border-emerald-400/15 bg-emerald-500/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground">
              Confirm Video Call
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {booking?.scheduledAt
                ? `Confirm your call on ${fmtDateTime(booking.scheduledAt)}?`
                : "Are you sure you want to confirm this video call?"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-muted/5">
          <Button
            variant={"ghost"}
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-8 px-3.5 text-xs font-medium rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            Back
          </Button>
          <Button
            variant={"ghost"}
            onClick={handle}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Yes, Confirm
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: {
  booking: ClientBookingWithRelations | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!booking) return;
    setLoading(true);
    const r = await cancelMyBooking({ bookingId: booking.id });
    setLoading(false);
    if (r.success) {
      toast.success("Booking cancelled");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error("Error", { description: r.error });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onOpenChange(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.16 }}
        className="w-full max-w-sm rounded-2xl border border-border/15 bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 border-b border-red-400/15 bg-red-500/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
            <XCircle size={18} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground">
              Cancel Booking
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Are you sure you want to cancel this booking? This cannot be
              undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-muted/5">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-8 px-3.5 text-xs font-medium rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            No, keep it
          </button>
          <Button
            variant={"ghost"}
            onClick={handle}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Yes, Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
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
          variant={"ghost"}
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
          variant={"ghost"}
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
// STATUS FILTER TABS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TABS: { id: BookingStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "REQUESTED", label: "Requested" },
  { id: "PROPOSED", label: "Proposed" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELED", label: "Cancelled" },
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
    status === "ALL" ? p.delete("status") : p.set("status", status);
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  };

  const active = activeStatus ?? "ALL";

  return (
    <div className="flex gap-1.5 flex-wrap">
      {STATUS_TABS.map((t) => {
        const isActive = active === t.id;
        const scfg = t.id !== "ALL" ? BOOKING_STATUS_CONFIG[t.id] : null;
        return (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              isActive
                ? "bg-color/15 text-color border-color/25"
                : "text-muted-foreground bg-muted/15 border-transparent hover:border-border/20 hover:text-foreground",
            )}
          >
            {scfg && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  isActive ? scfg.dot : "bg-muted-foreground/30",
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
// BOOKING ROW CARD (replaces the plain <tr>)
// ─────────────────────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  onClick,
  onConfirm,
  onCancel,
  variants,
}: {
  booking: ClientBookingWithRelations;
  onClick: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  variants?: Variants;
}) {
  const cfg = BOOKING_STATUS_CONFIG[booking.status];
  const needsAction = booking.status === "PROPOSED";

  return (
    <motion.tr
      layout
      variants={variants}
      onClick={onClick}
      className={cn(
        "group cursor-pointer border-b border-border/5 last:border-0 transition-colors",
        needsAction
          ? "bg-amber-500/3 hover:bg-amber-500/6"
          : "hover:bg-muted/15",
      )}
    >
      {/* Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br",
              cfg.gradient,
            )}
          >
            <Video size={12} className="text-white" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {fmtType(booking.type)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={booking.status} />
          {needsAction && (
            <span className="hidden sm:inline text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
              action needed
            </span>
          )}
        </div>
      </td>

      {/* Scheduled */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-xs text-muted-foreground">
          {booking.scheduledAt ? fmtDateTime(booking.scheduledAt) : "—"}
        </span>
      </td>

      {/* Duration */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs text-muted-foreground tabular-nums">
          {booking.durationMinutes} min
        </span>
      </td>

      {/* Created */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs text-muted-foreground">
          {fmt(booking.createdAt)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={"ghost"}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/15 text-muted-foreground "
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-border/20 bg-card/95 backdrop-blur-sm shadow-xl p-1 min-w-35"
          >
            <DropdownMenuItem
              onClick={onClick}
              className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer"
            >
              <Eye size={13} /> View Details
            </DropdownMenuItem>
            {booking.status === "PROPOSED" && (
              <DropdownMenuItem
                onClick={onConfirm}
                className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer text-emerald-400 focus:text-emerald-400"
              >
                <CheckCircle2 size={13} /> Confirm
              </DropdownMenuItem>
            )}
            {(booking.status === "REQUESTED" ||
              booking.status === "PROPOSED") && (
              <DropdownMenuItem
                onClick={onCancel}
                className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer text-red-400 focus:text-red-400"
              >
                <XCircle size={13} /> Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT: MyBookingsClient
// ─────────────────────────────────────────────────────────────────────────────

interface MyBookingsClientProps {
  initialBookings: ClientBookingWithRelations[];
  initialPagination: PaginationInfo;
  initialPlanInfo: UserPlanInfo;
  initialStatus: BookingStatus | null;
  initialPage: number;
}

export function MyBookingsClient({
  initialBookings,
  initialPagination,
  initialPlanInfo,
  initialStatus,
  initialPage,
}: MyBookingsClientProps) {
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") as BookingStatus | null;
  const activePage = parseInt(searchParams.get("page") || "1");

  const [bookings, setBookings] = useState(initialBookings);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailBooking, setDetailBooking] =
    useState<ClientBookingWithRelations | null>(null);
  const [confirmTarget, setConfirmTarget] =
    useState<ClientBookingWithRelations | null>(null);
  const [cancelTarget, setCancelTarget] =
    useState<ClientBookingWithRelations | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    const result = await getMyBookings({
      page: activePage,
      pageSize: initialPagination.pageSize,
      status: activeStatus ?? undefined,
    });
    if (result.success && result.data) {
      setBookings(result.data.bookings as ClientBookingWithRelations[]);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }, [activePage, activeStatus, initialPagination.pageSize]);

  useEffect(() => {
    if (activePage === initialPage && activeStatus === initialStatus) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      const result = await getMyBookings({
        page: activePage,
        pageSize: initialPagination.pageSize,
        status: activeStatus ?? undefined,
      });
      if (!cancelled && result.success && result.data) {
        setBookings(result.data.bookings as ClientBookingWithRelations[]);
        setPagination(result.data.pagination);
      }
      if (!cancelled) setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [activePage, activeStatus]); // eslint-disable-line

  const handleActionComplete = () => fetchPage();

  const pendingCount = bookings.filter((b) => b.status === "PROPOSED").length;

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {pagination.totalCount} booking
            {pagination.totalCount !== 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-400 font-semibold">
                · {pendingCount} action{pendingCount > 1 ? "s" : ""} required
              </span>
            )}
          </p>
          {loading && (
            <Loader2 size={12} className="animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          variant={"ghost"}
          onClick={() => setIsCreateOpen(true)}
          disabled={
            initialPlanInfo.billingEnabled &&
            initialPlanInfo.limit !== Infinity &&
            initialPlanInfo.usedCount >= initialPlanInfo.limit
          }
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-xl bg-color hover:bg-color/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Request Call
        </Button>
      </div>

      {/* Status tabs */}
      <StatusFilterTabs activeStatus={activeStatus} />

      {/* Table card */}
      <div className="rounded-2xl border border-border/10 bg-card/40 overflow-hidden relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border/20 shadow-lg">
              <Loader2 size={18} className="animate-spin text-color" />
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-border/10"
            >
              <Video size={26} className="text-muted-foreground/30" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-foreground/70">
                No bookings found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeStatus
                  ? "Try a different filter."
                  : "Request your first video call to get started."}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/10 bg-muted/10">
                {["Type", "Status", "Scheduled", "Duration", "Created", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className={cn(
                        "px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider",
                        i === 2 && "hidden sm:table-cell",
                        i === 3 && "hidden md:table-cell",
                        i === 4 && "hidden lg:table-cell",
                        i === 5 && "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {bookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  onClick={() => setDetailBooking(booking)}
                  onConfirm={() => setConfirmTarget(booking)}
                  onCancel={() => setCancelTarget(booking)}
                />
              ))}
            </motion.tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <BookingPagination pagination={pagination} />

      {/* Dialogs */}
      <AnimatePresence>
        {detailBooking && (
          <BookingDetailsModal
            booking={detailBooking}
            open={!!detailBooking}
            onOpenChange={(v) => {
              if (!v) setDetailBooking(null);
            }}
            onConfirm={(b) => {
              setDetailBooking(null);
              setConfirmTarget(b);
            }}
            onCancel={(b) => {
              setDetailBooking(null);
              setCancelTarget(b);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateOpen && (
          <CreateBookingDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSuccess={handleActionComplete}
            planInfo={initialPlanInfo}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmTarget && (
          <ConfirmBookingDialog
            booking={confirmTarget}
            open={!!confirmTarget}
            onOpenChange={(v) => {
              if (!v) setConfirmTarget(null);
            }}
            onSuccess={handleActionComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelTarget && (
          <CancelBookingDialog
            booking={cancelTarget}
            open={!!cancelTarget}
            onOpenChange={(v) => {
              if (!v) setCancelTarget(null);
            }}
            onSuccess={handleActionComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
