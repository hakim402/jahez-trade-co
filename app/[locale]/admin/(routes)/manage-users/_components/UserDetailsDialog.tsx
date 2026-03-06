"use client";

// app/[locale]/admin/(routes)/manage-users/_components/UserDetailsDialog.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ALL logic, data fetching, types, and action calls are identical to the original.
// Only the visual layer has been redesigned.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Mail,
  Phone,
  CreditCard,
  Package,
  Video,
  Bell,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldOff,
  Zap,
  Crown,
  ExternalLink,
  Hash,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { getUserById, type UserDetail } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (same as original)
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, email: string) {
  if (fullName)
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  return email.substring(0, 2).toUpperCase();
}

// Deterministic avatar bg color
function avatarColor(email: string) {
  const palette = [
    "from-violet-500 to-[#7b57fc]",
    "from-blue-500 to-cyan-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
    "from-fuchsia-500 to-purple-600",
  ];
  const idx =
    email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

function fmtDate(d: Date | string) {
  return format(new Date(d), "MMM d, yyyy");
}
function fmtDateTime(d: Date | string) {
  return format(new Date(d), "MMM d, yyyy · HH:mm");
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE ATOMS
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Icon size={13} className="text-muted-foreground" />
      </div>
      <span className="text-xs text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium text-foreground truncate",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-3 rounded-xl ring-1 text-center min-w-18",
        color,
      )}
    >
      <Icon size={14} className="opacity-70" />
      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[10px] font-medium opacity-70 leading-none">{label}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#7b57fc]/10">
        <Icon size={11} className="text-[#7b57fc]" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
        <Icon size={20} className="opacity-30" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Hero */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DIALOG — same props, same logic, redesigned shell
// ─────────────────────────────────────────────────────────────────────────────

interface UserDetailsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  userId,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // ── LOGIC IDENTICAL TO ORIGINAL ──────────────────────────────────────────
  useEffect(() => {
    if (!open || !userId) {
      setUser(null);
      return;
    }
    setLoading(true);
    getUserById({ id: userId })
      .then((result) => {
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        setUser(result.data.user);
      })
      .catch(() => toast.error("Failed to load user details"))
      .finally(() => setLoading(false));
  }, [userId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[96vw] sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl",
          "h-[92vh] overflow-hidden flex flex-col p-0",
          "bg-card border border-border/60 shadow-2xl rounded-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
          "duration-200",
        )}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : user ? (
          <>
            {/* ── HERO HEADER ──────────────────────────────────────────── */}
            <div className="relative overflow-hidden shrink-0">
              {/* Gradient background strip */}
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-r opacity-10",
                  avatarColor(user.email),
                )}
              />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-card" />

              <div className="relative flex flex-col sm:flex-row sm:items-start gap-5 px-6 pt-6 pb-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-2xl bg-linear-to-br flex items-center justify-center ring-4 ring-background shadow-xl",
                      avatarColor(user.email),
                    )}
                  >
                    {user.avatarUrl ? (
                      <Avatar className="h-16 w-16 rounded-2xl">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback
                          className={cn(
                            "rounded-2xl text-white text-xl font-bold bg-linear-to-br",
                            avatarColor(user.email),
                          )}
                        >
                          {getInitials(user.fullName, user.email)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {getInitials(user.fullName, user.email)}
                      </span>
                    )}
                  </div>
                  {/* Active indicator */}
                  <span
                    className={cn(
                      "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                      user.isActive ? "bg-emerald-400" : "bg-red-400",
                    )}
                  />
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground truncate">
                      {user.fullName || "No name"}
                    </h2>
                    <Badge
                      variant={
                        user.role === "ADMIN" ? "destructive" : "secondary"
                      }
                      className="text-xs shrink-0"
                    >
                      {user.role === "ADMIN" ? (
                        <>
                          <ShieldCheck size={10} className="mr-1" /> Admin
                        </>
                      ) : (
                        user.role
                      )}
                    </Badge>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 shrink-0",
                        user.isActive
                          ? "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 bg-emerald-500/8"
                          : "text-red-500 ring-red-400/30 bg-red-500/8",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          user.isActive ? "bg-emerald-400" : "bg-red-400",
                        )}
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                    {user.id}
                  </p>
                </div>

                {/* Stat chips */}
                <div className="grid grid-cols-4 gap-3">
                  <StatCard
                    icon={Package}
                    value={user._count.requests}
                    label="Requests"
                    color="bg-blue-500/8 text-blue-600 dark:text-blue-400 ring-blue-400/20"
                  />
                  <StatCard
                    icon={Video}
                    value={user._count.clientBookings}
                    label="Bookings"
                    color="bg-violet-500/8 text-[#7b57fc] ring-[#7b57fc]/20"
                  />
                  <StatCard
                    icon={Bell}
                    value={user._count.notifications}
                    label="Notifs"
                    color="bg-amber-500/8 text-amber-600 dark:text-amber-400 ring-amber-400/20"
                  />
                  <StatCard
                    icon={MessageSquare}
                    value={user._count.chatSessions}
                    label="Chats"
                    color="bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 ring-emerald-400/20"
                  />
                </div>
              </div>
            </div>

            <Separator className="shrink-0" />

            {/* ── BODY ─────────────────────────────────────────────────── */}
            {/* Native div instead of ScrollArea — Radix ScrollArea breaks flex-1 min-h-0 */}
            <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30">
              <div className="px-6 py-5 space-y-6">
                {/* Contact + Subscription side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contact */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                    <SectionTitle icon={Mail} label="Contact" />
                    <InfoRow icon={Mail} label="Email" value={user.email} />
                    <InfoRow
                      icon={Phone}
                      label="Phone"
                      value={user.phone || "—"}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Joined"
                      value={fmtDate(user.createdAt)}
                    />
                    <InfoRow
                      icon={Clock}
                      label="Updated"
                      value={fmtDate(user.updatedAt)}
                    />
                    <InfoRow
                      icon={Hash}
                      label="Clerk ID"
                      value={user.clerkId}
                      mono
                    />
                  </div>

                  {/* Subscription */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                    <SectionTitle icon={CreditCard} label="Subscription" />
                    {user.subscription ? (
                      <>
                        {user.subscription.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background border border-border/40"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {item.isDefaultPlan ? (
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {item.plan?.name ?? "Free"}
                                  </span>
                                ) : (
                                  <>
                                    <Crown
                                      size={11}
                                      className="text-amber-500 shrink-0"
                                    />
                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">
                                      {item.plan?.name}
                                    </span>
                                  </>
                                )}
                              </div>
                              {item.plan && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {item.plan.currency.toUpperCase()}{" "}
                                  {Number(item.plan.amount).toFixed(2)}
                                  {item.plan.interval &&
                                    ` / ${item.plan.interval}`}
                                </p>
                              )}
                              {item.currentPeriodEnd && (
                                <p className="text-[10px] text-muted-foreground">
                                  Renews {fmtDate(item.currentPeriodEnd)}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] shrink-0",
                                item.status === "ACTIVE" &&
                                  "border-emerald-400/40 text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {item.status.toLowerCase()}
                            </Badge>
                          </div>
                        ))}
                        {user.subscription.items.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No plan items
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No subscription
                      </p>
                    )}
                  </div>
                </div>

                {/* ── TABS ─────────────────────────────────────────────── */}
                <Tabs defaultValue="requests">
                  <div className="w-full overflow-x-auto">
                    <TabsList className="flex w-max h-9 rounded-xl bg-muted/50 p-0.5 gap-0.5">
                      {[
                        {
                          value: "requests",
                          label: "Requests",
                          count: user.requests.length,
                        },
                        {
                          value: "bookings",
                          label: "Bookings",
                          count: user.clientBookings.length,
                        },
                        {
                          value: "notifications",
                          label: "Notifs",
                          count: user.notifications.length,
                        },
                        {
                          value: "payments",
                          label: "Payments",
                          count: user.subscription?.paymentAttempts.length ?? 0,
                        },
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative text-xs rounded-lg h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-[#7b57fc] gap-1.5"
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#7b57fc]/15 text-[#7b57fc] text-[9px] font-bold">
                              {tab.count}
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* ── Requests ─────────────────────────────────────── */}
                  <TabsContent value="requests" className="mt-4 space-y-2">
                    {user.requests.length === 0 ? (
                      <EmptyState icon={Package} label="No requests yet" />
                    ) : (
                      user.requests.map((req) => (
                        <div
                          key={req.id}
                          className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                            <Package size={14} className="text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5"
                              >
                                {req.status}
                              </Badge>
                              {req.priority > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-4 px-1.5"
                                >
                                  P{req.priority}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {fmtDate(req.createdAt)}
                              </span>
                            </div>
                            {req.productLink && (
                              <a
                                href={req.productLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[#7b57fc] hover:underline truncate max-w-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={9} /> {req.productLink}
                              </a>
                            )}
                            {req.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {req.description}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              Qty {req.quantity} · {req.shippingCountry} ·{" "}
                              {req._count.quotes} quote
                              {req._count.quotes !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* ── Bookings ──────────────────────────────────────── */}
                  <TabsContent value="bookings" className="mt-4 space-y-2">
                    {user.clientBookings.length === 0 ? (
                      <EmptyState icon={Video} label="No bookings yet" />
                    ) : (
                      user.clientBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-start gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7b57fc]/10">
                            <Video size={14} className="text-[#7b57fc]" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1.5"
                              >
                                {booking.status}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5"
                              >
                                {booking.type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {fmtDate(booking.createdAt)}
                              </span>
                            </div>
                            {booking.scheduledAt && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock size={10} />{" "}
                                {fmtDateTime(booking.scheduledAt)}
                              </div>
                            )}
                            {booking.meetingProvider && (
                              <p className="text-xs text-muted-foreground">
                                via {booking.meetingProvider}
                              </p>
                            )}
                            {booking.requestNotes && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {booking.requestNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* ── Notifications ─────────────────────────────────── */}
                  <TabsContent value="notifications" className="mt-4 space-y-2">
                    {user.notifications.length === 0 ? (
                      <EmptyState icon={Bell} label="No notifications" />
                    ) : (
                      user.notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                              notif.isRead ? "bg-muted/60" : "bg-[#7b57fc]/10",
                            )}
                          >
                            {notif.isRead ? (
                              <CheckCircle2
                                size={13}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-[#7b57fc]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm truncate",
                                notif.isRead
                                  ? "text-muted-foreground"
                                  : "font-semibold text-foreground",
                              )}
                            >
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {notif.type}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                            {fmtDate(notif.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* ── Payments ──────────────────────────────────────── */}
                  <TabsContent value="payments" className="mt-4 space-y-2">
                    {!user.subscription?.paymentAttempts.length ? (
                      <EmptyState
                        icon={CreditCard}
                        label="No payment history"
                      />
                    ) : (
                      user.subscription.paymentAttempts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              p.status === "PAID"
                                ? "bg-emerald-500/10"
                                : p.status === "FAILED"
                                  ? "bg-red-500/10"
                                  : "bg-muted/60",
                            )}
                          >
                            {p.status === "PAID" ? (
                              <CheckCircle2
                                size={14}
                                className="text-emerald-500"
                              />
                            ) : p.status === "FAILED" ? (
                              <XCircle size={14} className="text-red-500" />
                            ) : (
                              <Clock
                                size={14}
                                className="text-muted-foreground"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium capitalize text-foreground">
                              {p.type.toLowerCase()}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {p.status.toLowerCase()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-foreground tabular-nums">
                              {p.amount !== null
                                ? `${p.currency.toUpperCase()} ${p.amount.toFixed(2)}`
                                : "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {fmtDate(p.occurredAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                {/* ── Audit log ────────────────────────────────────────── */}
                {user.auditLogs.length > 0 && (
                  <div>
                    <SectionTitle icon={Activity} label="Admin audit log" />
                    <div className="space-y-1.5">
                      {user.auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-3 text-xs px-3 py-2 rounded-lg bg-muted/30 border border-border/30"
                        >
                          <span className="font-mono text-[10px] bg-[#7b57fc]/10 text-[#7b57fc] px-1.5 py-0.5 rounded shrink-0">
                            {log.action}
                          </span>
                          <span className="text-muted-foreground truncate flex-1">
                            {log.entity}
                            {log.entityId
                              ? ` · ${log.entityId.slice(0, 8)}…`
                              : ""}
                          </span>
                          <span className="text-muted-foreground/60 whitespace-nowrap shrink-0">
                            {fmtDate(log.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* Hidden accessible header for screen readers */}
        <DialogHeader className="sr-only">
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Full profile and activity overview.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
