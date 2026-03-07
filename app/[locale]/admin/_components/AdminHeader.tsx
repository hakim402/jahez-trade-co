"use client";

// app/[locale]/admin/_components/AdminHeader.tsx

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Bell,
  BellOff,
  MessageSquare,
  Menu,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/sidebar-context";
import { ThemeToggle } from "@/app/[locale]/_components/Theme/theme-toggle";
import dynamic from "next/dynamic";

// ── Direct imports from feature actions (no header-actions.ts needed) ─────────
import {
  listNotifications,
  markNotificationsRead,
  markAllRead,
  type NotificationItem,
} from "../(routes)/notifications/actions";
import {
  listSessions,
  type SessionListItem,
} from "../(routes)/support/actions";

const UserButton = dynamic(
  () => import("@clerk/nextjs").then((m) => m.UserButton),
  { ssr: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 30_000;
const NOTIF_TAKE = 8;
const SESSION_TAKE = 6;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string | null | undefined, email: string) {
  if (name)
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function notifHref(n: NotificationItem) {
  if (n.bookingId) return `/admin/video-bookings/${n.bookingId}`;
  if (n.requestId) return `/admin/product-requests/${n.requestId}`;
  if (n.quoteId) return `/admin/product-requests?quoteId=${n.quoteId}`;
  return "/admin/notifications";
}

function typeMeta(type: string) {
  const t = type.toLowerCase();
  if (t.includes("booking"))
    return { dot: "bg-blue-400", label: "Booking", ring: "ring-blue-400/30" };
  if (t.includes("quote"))
    return { dot: "bg-[#7b57fc]", label: "Quote", ring: "ring-[#7b57fc]/30" };
  if (t.includes("request"))
    return { dot: "bg-amber-400", label: "Request", ring: "ring-amber-400/30" };
  if (t.includes("payment"))
    return {
      dot: "bg-emerald-400",
      label: "Payment",
      ring: "ring-emerald-400/30",
    };
  return { dot: "bg-muted-foreground", label: type, ring: "ring-border" };
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON BUTTON (shared wrapper)
// ─────────────────────────────────────────────────────────────────────────────

function HeaderIconButton({
  children,
  badge,
  badgeColor = "bg-[#7b57fc]",
  onClick,
  label,
}: {
  children: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  onClick?: () => void;
  label: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      aria-label={label}
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
    >
      {children}
      <AnimatePresence>
        {badge != null && badge > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className={cn(
              "absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none",
              badgeColor,
            )}
          >
            {badge > 99 ? "99+" : badge}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS POPOVER
// ─────────────────────────────────────────────────────────────────────────────

function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, start] = useTransition();
  const prevUnread = useRef(0);
  const [pulse, setPulse] = useState(false);

  // ── Fetch admin's personal notifications only (viewMode: 'mine') ─────────
  const fetchNotifs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const r = await listNotifications({
      take: NOTIF_TAKE,
      viewMode: "mine", // ← only notifications addressed to this admin
    });
    if (r.success) {
      setItems(r.data.items);
      const newUnread = r.data.items.filter((n) => !n.isRead).length;
      if (newUnread > prevUnread.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      }
      prevUnread.current = newUnread;
      setUnread(newUnread);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);
  useEffect(() => {
    const id = setInterval(() => fetchNotifs(true), POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifs]);
  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  const handleMarkOne = (id: string) => {
    start(async () => {
      await markNotificationsRead([id]);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    });
  };

  const handleMarkAll = () => {
    start(async () => {
      await markAllRead("mine"); // ← only clears admin's own
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span>
          <HeaderIconButton
            label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            badge={unread}
          >
            <motion.div
              animate={pulse ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Bell size={18} />
            </motion.div>
          </HeaderIconButton>
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-95 p-0 shadow-2xl rounded-2xl border border-border/60 overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7b57fc]/15">
              <Bell size={13} className="text-[#7b57fc]" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            {unread > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] font-bold bg-[#7b57fc]/15 text-[#7b57fc] border border-[#7b57fc]/25 hover:bg-[#7b57fc]/15">
                {unread} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isPending && (
              <Loader2
                size={13}
                className="animate-spin text-muted-foreground"
              />
            )}
            {unread > 0 && (
              <Button
                variant={"ghost"}
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[#7b57fc] transition-colors px-2 py-1 rounded-lg hover:bg-[#7b57fc]/8"
              >
                <CheckCheck size={12} /> Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* ── List ───────────────────────────────────────────────────── */}
        <div className="max-h-95 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                size={20}
                className="animate-spin text-muted-foreground/50"
              />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                <BellOff size={20} className="text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/60">
                  All caught up
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  No notifications for you
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {items.map((n, i) => {
                const meta = typeMeta(n.type);
                const href = notifHref(n);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3.5 transition-colors",
                      n.isRead
                        ? "hover:bg-muted/30"
                        : "bg-black/3 hover:bg-black/6",
                    )}
                  >
                    {/* Type dot */}
                    <div className="mt-2 shrink-0">
                      <span
                        className={cn(
                          "block h-2 w-2 rounded-full transition-all",
                          meta.dot,
                          n.isRead ? "opacity-30" : "opacity-100 shadow-sm",
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-tight truncate",
                          n.isRead
                            ? "text-foreground/60 font-normal"
                            : "text-foreground font-semibold",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                            `ring-1 ${meta.ring}`,
                            n.isRead
                              ? "text-muted-foreground/60"
                              : "text-foreground/70",
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-muted-foreground/40 text-[10px]">
                          ·
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <Button
                          variant={"ghost"}
                          onClick={() => handleMarkOne(n.id)}
                          title="Mark read"
                          className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-500 transition-colors"
                        >
                          <Check size={12} />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-t border-border/50 bg-muted/10">
          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-[#7b57fc] hover:bg-[#7b57fc]/8 transition-all group"
          >
            View all notifications
            <ArrowRight
              size={11}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES (CHAT SESSIONS) POPOVER
// ─────────────────────────────────────────────────────────────────────────────

function MessagesPopover() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const r = await listSessions({ take: SESSION_TAKE });
    if (r.success) {
      setSessions(r.data.items);
      setActive(r.data.items.filter((s) => s.isActive).length);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  useEffect(() => {
    const id = setInterval(() => fetchSessions(true), POLL_MS);
    return () => clearInterval(id);
  }, [fetchSessions]);
  useEffect(() => {
    if (open) fetchSessions();
  }, [open, fetchSessions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span>
          <HeaderIconButton
            label={`Chat sessions${active > 0 ? ` (${active} active)` : ""}`}
            badge={active}
            badgeColor="bg-emerald-500"
          >
            <MessageSquare size={18} />
          </HeaderIconButton>
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-90 p-0 shadow-2xl rounded-2xl border border-border/60 overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
              <MessageSquare size={13} className="text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Chat Sessions
            </span>
            {active > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">
                {active} live
              </Badge>
            )}
          </div>
          <button
            onClick={() => fetchSessions()}
            className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <Loader2 size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── List ───────────────────────────────────────────────────── */}
        <div className="max-h-90 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                size={20}
                className="animate-spin text-muted-foreground/50"
              />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                <MessageSquare size={20} className="text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/60">
                  No sessions
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  No chat activity yet
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {sessions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/admin/support/`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                  >
                    {/* Avatar + active dot */}
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9 ring-2 ring-border/40">
                        <AvatarImage src={s.user?.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-[#7b57fc]/15 text-[#7b57fc] text-xs font-bold">
                          {s.user
                            ? getInitials(s.user.fullName, s.user.email)
                            : "??"}
                        </AvatarFallback>
                      </Avatar>
                      {s.isActive && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-popover" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {s.user?.fullName ?? s.user?.email ?? "Anonymous"}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeAgo(s.startedAt)}
                        </span>
                      </div>

                      {/* Last message preview */}
                      <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                        {s.lastMessage
                          ? `${s.lastMessage.role === "user" ? "👤" : "🤖"} ${s.lastMessage.content}`
                          : "No messages yet"}
                      </p>

                      {/* Footer meta */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1",
                            s.isActive
                              ? "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30"
                              : "text-muted-foreground/60 ring-border",
                          )}
                        >
                          {s.isActive ? "Active" : "Ended"}
                        </span>
                        <span className="text-muted-foreground/40 text-[10px]">
                          ·
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {s.messageCount} msg{s.messageCount !== 1 ? "s" : ""}
                        </span>
                        <ArrowRight
                          size={10}
                          className="ml-auto text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-t border-border/50 bg-muted/10">
          <Link
            href="/admin/messages"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/8 transition-all group"
          >
            View all sessions
            <ArrowRight
              size={11}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

function HeaderSearch() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="relative hidden sm:block">
      <motion.div
        animate={{ width: focused ? 320 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative group"
      >
        <Search
          size={15}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
            focused ? "text-[#7b57fc]" : "text-muted-foreground",
          )}
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search…"
          className={cn(
            "w-full pl-9 pr-8 h-9 text-sm rounded-xl transition-all bg-muted/40 border-border/50",
            "placeholder:text-muted-foreground/50",
            focused
              ? "bg-background border-[#7b57fc]/40 ring-1 ring-[#7b57fc]/20"
              : "hover:bg-muted/60 hover:border-border",
          )}
        />
        {query && (
          <Button
            variant={"ghost"}
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={11} />
          </Button>
        )}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HEADER
// ─────────────────────────────────────────────────────────────────────────────

export function AdminHeader() {
  const { toggleMobile } = useSidebar();

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 lg:px-6"
    >
      <div className="flex items-center justify-between h-full max-w-screen-2xl mx-auto">
        {/* ── Left ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMobile}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </motion.button>

          <HeaderSearch />
        </div>

        {/* ── Right ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 mx-0.5" />

          <MessagesPopover />
          <NotificationsPopover />

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 mx-0.5" />

          {/* Clerk user button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox:
                    "w-8 h-8 ring-2 ring-[#7b57fc]/40 hover:ring-[#7b57fc]/70 transition-all shadow-sm",
                },
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}