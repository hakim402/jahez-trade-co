"use client";

// app/[locale]/admin/(routes)/notifications/_components/NotificationsClient.tsx

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import Link from "next/link";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Send,
  Radio,
  X,
  Loader2,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  CreditCard,
  RefreshCw,
  Filter,
  ChevronDown,
  Globe,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  listNotifications,
  markNotificationsRead,
  markNotificationsUnread,
  deleteNotifications,
  markAllRead,
  type NotificationItem,
  type NotificationStats,
  type ListNotificationsParams,
} from "../actions";
import { SendNotificationModal } from "./SendNotificationModal";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

const TAKE = 20;
type ViewMode = "mine" | "platform";
type TypeFilter =
  | "all"
  | "unread"
  | "BOOKING"
  | "QUOTE"
  | "REQUEST"
  | "PAYMENT"
  | "SYSTEM";

const TYPE_TABS: { id: TypeFilter; label: string; icon?: React.ElementType }[] =
  [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "BOOKING", label: "Bookings", icon: Video },
    { id: "QUOTE", label: "Quotes", icon: FileText },
    { id: "REQUEST", label: "Requests", icon: BookOpen },
    { id: "PAYMENT", label: "Payments", icon: CreditCard },
    { id: "SYSTEM", label: "System", icon: Bell },
  ];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(d: Date | string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

function groupLabel(d: Date | string) {
  const date = new Date(d);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  return format(date, "MMMM yyyy");
}

function groupNotifications(items: NotificationItem[]) {
  const groups: { label: string; items: NotificationItem[] }[] = [];
  const seen = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const label = groupLabel(item.createdAt);
    if (!seen.has(label)) {
      seen.set(label, []);
      groups.push({ label, items: seen.get(label)! });
    }
    seen.get(label)!.push(item);
  }
  return groups;
}

function entityHref(n: NotificationItem) {
  if (n.bookingId) return `/admin/video-bookings/${n.bookingId}`;
  if (n.requestId) return `/admin/product-requests/${n.requestId}`;
  if (n.quoteId) return `/admin/product-requests?quoteId=${n.quoteId}`;
  return null;
}

function typeMeta(type: string) {
  const t = type.toUpperCase();
  if (t.includes("BOOKING"))
    return {
      color: "bg-blue-500/10 text-blue-500",
      dot: "bg-blue-500",
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      icon: Video,
      label: "Booking",
    };
  if (t.includes("QUOTE"))
    return {
      color: "bg-[#7b57fc]/10 text-[#7b57fc]",
      dot: "bg-[#7b57fc]",
      badge: "bg-[#7b57fc]/10 text-[#7b57fc] border-[#7b57fc]/20",
      icon: FileText,
      label: "Quote",
    };
  if (t.includes("REQUEST"))
    return {
      color: "bg-amber-500/10 text-amber-500",
      dot: "bg-amber-500",
      badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      icon: BookOpen,
      label: "Request",
    };
  if (t.includes("PAYMENT"))
    return {
      color: "bg-emerald-500/10 text-emerald-500",
      dot: "bg-emerald-500",
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      icon: CreditCard,
      label: "Payment",
    };
  return {
    color: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    badge: "bg-muted/50 text-muted-foreground border-border",
    icon: Bell,
    label: type,
  };
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
// VIEW MODE SWITCHER
// ─────────────────────────────────────────────────────────────────────────────

function ViewModeSwitcher({
  active,
  personalUnread,
  onChange,
}: {
  active: ViewMode;
  personalUnread: number;
  onChange: (v: ViewMode) => void;
}) {
  const tabs = [
    {
      id: "mine" as ViewMode,
      label: "My Notifications",
      icon: UserCircle,
      desc: "Notifications sent to your admin account",
    },
    {
      id: "platform" as ViewMode,
      label: "Platform",
      icon: Globe,
      desc: "All notifications sent to all users — management view",
    },
  ];
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/40 self-start">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          title={tab.desc}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
            active === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <tab.icon size={13} />
          {tab.label}
          {tab.id === "mine" && personalUnread > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#7b57fc] text-white text-[9px] font-bold">
              {personalUnread > 99 ? "99+" : personalUnread}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM MANAGEMENT BANNER
// ─────────────────────────────────────────────────────────────────────────────

function PlatformBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
      <Globe size={14} className="text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          Platform Management View
        </p>
        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
          Showing all notifications sent to all users. Switch to{" "}
          <strong>My Notifications</strong> to see notifications addressed to
          your account.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK BAR
// ─────────────────────────────────────────────────────────────────────────────

function BulkBar({
  selected,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onClear,
  isPending,
}: {
  selected: Set<string>;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
  onClear: () => void;
  isPending: boolean;
}) {
  if (selected.size === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#7b57fc]/10 border border-[#7b57fc]/25"
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[#7b57fc] animate-pulse" />
        <span className="text-sm font-semibold text-[#7b57fc]">
          {selected.size} selected
        </span>
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          size="sm"
          variant="ghost"
          onClick={onMarkRead}
          disabled={isPending}
          className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1"
        >
          <Check size={12} /> Mark read
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onMarkUnread}
          disabled={isPending}
          className="h-7 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1"
        >
          <Bell size={12} /> Unread
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={isPending}
          className="h-7 text-xs text-red-500 hover:bg-red-500/10 gap-1"
        >
          <Trash2 size={12} /> Delete
        </Button>
        <div className="w-px h-4 bg-border/60 mx-0.5" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <X size={13} />
        </Button>
      </div>
      {isPending && (
        <Loader2 size={13} className="animate-spin text-[#7b57fc] ml-1" />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ROW
// ─────────────────────────────────────────────────────────────────────────────

function NotificationRow({
  n,
  selected,
  onSelect,
  onMarkRead,
  onDelete,
  showRecipient,
}: {
  n: NotificationItem;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  showRecipient: boolean; // true in platform view — shows "To: username"
}) {
  const meta = typeMeta(n.type);
  const Icon = meta.icon;
  const href = entityHref(n);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={cn(
        "group relative rounded-xl border transition-all duration-200",
        selected
          ? "bg-[#7b57fc]/5 border-[#7b57fc]/30 shadow-sm"
          : n.isRead
            ? "bg-card border-border/50 hover:border-border"
            : "bg-primary/2 border-primary/15 hover:border-primary/30 shadow-sm",
      )}
    >
      <div className="flex items-start gap-3.5 p-4">
        <div className="pt-0.5 shrink-0">
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelect(n.id, !!v)}
            className="border-border/60 data-[state=checked]:bg-[#7b57fc] data-[state=checked]:border-[#7b57fc]"
          />
        </div>

        {/* Unread dot */}
        <div className="pt-2 shrink-0">
          <span
            className={cn(
              "block h-2 w-2 rounded-full transition-all duration-300",
              n.isRead
                ? "opacity-0 scale-0"
                : `${meta.dot} opacity-100 scale-100`,
            )}
          />
        </div>

        {/* Type icon */}
        <div className={cn("rounded-xl p-2.5 shrink-0 mt-0.5", meta.color)}>
          <Icon size={15} />
        </div>

        {/* Recipient avatar */}
        <Avatar className="w-8 h-8 shrink-0 mt-0.5 ring-2 ring-border/30">
          <AvatarImage src={n.user.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-[#7b57fc]/15 text-[#7b57fc] text-xs font-bold">
            {getInitials(n.user.fullName, n.user.email)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm leading-snug",
                  n.isRead
                    ? "font-normal text-foreground/75"
                    : "font-semibold text-foreground",
                )}
              >
                {n.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {n.message}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] shrink-0 border font-medium h-5 px-1.5",
                meta.badge,
              )}
            >
              {meta.label}
            </Badge>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {timeAgo(n.createdAt)}
            </span>

            {/* In platform view, show who received this notification */}
            {showRecipient && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground">
                  To:{" "}
                  <span className="font-medium text-foreground/70">
                    {n.user.fullName ?? n.user.email}
                  </span>
                </span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground/60 truncate max-w-37.5">
                  {n.user.email}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          {!n.isRead && (
            <button
              title="Mark as read"
              onClick={() => onMarkRead(n.id)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
            >
              <Check size={14} />
            </button>
          )}
          {href && (
            <Link
              href={href}
              title="View entity"
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={14} />
            </Link>
          )}
          <button
            title="Delete"
            onClick={() => onDelete(n.id)}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-4 flex items-start gap-3.5 animate-pulse"
          >
            <div className="h-4 w-4 rounded bg-muted mt-0.5 shrink-0" />
            <div className="h-2 w-2 rounded-full bg-muted mt-2 shrink-0" />
            <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-4 bg-muted rounded w-2/5" />
              <div className="h-3 bg-muted rounded w-3/5" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialStats: NotificationStats | null;
}

export function NotificationsClient({ initialStats }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Default to 'mine' so admins first see their own inbox, not all user notifications
  const [viewMode, setViewMode] = useState<ViewMode>("mine");
  const [typeTab, setTypeTab] = useState<TypeFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendOpen, setSendOpen] = useState(false);
  const [sendMode, setSendMode] = useState<"single" | "broadcast">("single");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const unreadCount = items.filter((n) => !n.isRead).length;
  const isPlatform = viewMode === "platform";

  // ── Build query params ─────────────────────────────────────────────────
  const buildParams = useCallback(
    (cursor?: string): ListNotificationsParams => ({
      take: TAKE,
      cursor,
      viewMode: viewMode === "mine" ? "mine" : "all",
      type: typeTab !== "all" && typeTab !== "unread" ? typeTab : undefined,
      isRead: typeTab === "unread" ? false : undefined,
    }),
    [viewMode, typeTab],
  );

  // ── Load ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const r = await listNotifications(buildParams());
    if (r.success) {
      setItems(r.data.items);
      setNextCursor(r.data.nextCursor);
      setTotal(r.data.total);
    }
    setLoading(false);
  }, [buildParams]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Load more ───────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const r = await listNotifications(buildParams(nextCursor));
    if (r.success) {
      setItems((prev) => [...prev, ...r.data.items]);
      setNextCursor(r.data.nextCursor);
    }
    setLoadingMore(false);
  }, [nextCursor, loadingMore, buildParams]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleViewModeChange = (v: ViewMode) => {
    setViewMode(v);
    setTypeTab("all");
    setSelected(new Set());
  };

  const toggleSelect = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const n = new Set(prev);
      checked ? n.add(id) : n.delete(id);
      return n;
    });
  const toggleSelectAll = () =>
    setSelected(
      selected.size === items.length
        ? new Set()
        : new Set(items.map((i) => i.id)),
    );

  const bulkMarkRead = () =>
    startTransition(async () => {
      await markNotificationsRead([...selected]);
      setItems((prev) =>
        prev.map((n) => (selected.has(n.id) ? { ...n, isRead: true } : n)),
      );
      setSelected(new Set());
    });
  const bulkMarkUnread = () =>
    startTransition(async () => {
      await markNotificationsUnread([...selected]);
      setItems((prev) =>
        prev.map((n) => (selected.has(n.id) ? { ...n, isRead: false } : n)),
      );
      setSelected(new Set());
    });
  const bulkDelete = () =>
    startTransition(async () => {
      const ids = [...selected];
      await deleteNotifications(ids);
      setItems((prev) => prev.filter((n) => !selected.has(n.id)));
      setTotal((t) => t - ids.length);
      setSelected(new Set());
    });
  const handleMarkOneRead = (id: string) =>
    startTransition(async () => {
      await markNotificationsRead([id]);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    });
  const handleDeleteOne = (id: string) =>
    startTransition(async () => {
      await deleteNotifications([id]);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
    });
  const handleMarkAllRead = () =>
    startTransition(async () => {
      // Scoped: only marks admin's own when in 'mine' mode
      await markAllRead(viewMode === "mine" ? "mine" : "all");
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });

  const groups = groupNotifications(items);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── View mode toggle ─────────────────────────────────────────────── */}
      <ViewModeSwitcher
        active={viewMode}
        personalUnread={initialStats?.personalUnread ?? 0}
        onChange={handleViewModeChange}
      />

      {/* ── Platform banner ───────────────────────────────────────────────── */}
      {isPlatform && <PlatformBanner />}

      {/* ── Type filter tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-border/50 overflow-x-auto scrollbar-none">
        {TYPE_TABS.map((tab) => {
          const isActive = typeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setTypeTab(tab.id);
                setSelected(new Set());
              }}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 shrink-0",
                isActive
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {Icon && <Icon size={13} />}
              {tab.label}
              {tab.id === "unread" && unreadCount > 0 && !loading && (
                <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#7b57fc] text-white text-[9px] font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={items.length > 0 && selected.size === items.length}
            onCheckedChange={toggleSelectAll}
            className="border-border/60 data-[state=checked]:bg-[#7b57fc] data-[state=checked]:border-[#7b57fc]"
          />
          <span className="text-xs text-muted-foreground">
            {loading
              ? "Loading…"
              : `${total.toLocaleString()} notification${total !== 1 ? "s" : ""}`}
            {unreadCount > 0 && !loading && (
              <span className="ml-1.5 text-[#7b57fc] font-medium">
                · {unreadCount} unread
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="h-8 text-xs border-border/50 gap-1.5"
            >
              <CheckCheck size={13} />
              {isPlatform ? "Mark all read (all users)" : "Mark all read"}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border/50 gap-1.5"
              >
                <Filter size={13} /> Actions <ChevronDown size={11} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setSendMode("single");
                  setSendOpen(true);
                }}
                className="text-sm gap-2 cursor-pointer"
              >
                <Send size={13} className="text-[#7b57fc]" /> Send to user
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setSendMode("broadcast");
                  setSendOpen(true);
                }}
                className="text-sm gap-2 cursor-pointer"
              >
                <Radio size={13} className="text-indigo-500" /> Broadcast to all
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || isPending}
                className="text-sm gap-2 cursor-pointer"
              >
                <CheckCheck size={13} className="text-emerald-500" /> Mark all
                read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Bulk bar ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <BulkBar
            selected={selected}
            onMarkRead={bulkMarkRead}
            onMarkUnread={bulkMarkUnread}
            onDelete={bulkDelete}
            onClear={() => setSelected(new Set())}
            isPending={isPending}
          />
        )}
      </AnimatePresence>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <NotificationSkeleton />
          </motion.div>
        ) : items.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border/50 bg-muted/10 gap-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
              {typeTab === "unread" ? (
                <BellOff size={24} className="text-muted-foreground/50" />
              ) : (
                <Bell size={24} className="text-muted-foreground/50" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70">
                {typeTab === "unread"
                  ? "All caught up!"
                  : "No notifications found"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {viewMode === "mine"
                  ? "No notifications have been sent to your admin account."
                  : "No platform notifications match this filter."}
              </p>
            </div>
            {typeTab !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTypeTab("all")}
                className="text-[#7b57fc] hover:text-[#7b57fc]/80 text-xs h-7"
              >
                View all
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {groups.map((group, gi) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {group.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.items.map((n) => (
                      <NotificationRow
                        key={n.id}
                        n={n}
                        selected={selected.has(n.id)}
                        onSelect={toggleSelect}
                        onMarkRead={handleMarkOneRead}
                        onDelete={handleDeleteOne}
                        showRecipient={isPlatform} // ← show "To: user" only in platform view
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}

            {nextCursor && (
              <div
                ref={sentinelRef}
                className="flex items-center justify-center py-6"
              >
                {loadingMore ? (
                  <Loader2
                    size={18}
                    className="animate-spin text-muted-foreground"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Scroll to load more
                  </span>
                )}
              </div>
            )}
            {!nextCursor && items.length > 0 && (
              <div className="flex items-center justify-center py-4 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  All {total.toLocaleString()} notifications loaded
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <SendNotificationModal
        open={sendOpen}
        mode={sendMode}
        onClose={() => setSendOpen(false)}
        onSuccess={load}
      />
    </>
  );
}
