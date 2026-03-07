"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  format,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listClientNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from "../actions";
import {
  FILTER_TABS,
  FILTER_TYPE_MAP,
  getNotificationConfig,
  type ClientNotification,
  type PaginationInfo,
  type FilterTab,
} from "./types";
import { Button } from "@/components/ui/button";

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

function groupNotifications(items: ClientNotification[]) {
  const groups: { label: string; items: ClientNotification[] }[] = [];
  const seen = new Map<string, ClientNotification[]>();
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

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ITEM
// ─────────────────────────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: ClientNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const cfg = getNotificationConfig(notification.type);
  const route = cfg.route(notification);
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
    if (route) router.push(route);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group relative rounded-2xl border transition-all duration-200",
        notification.isRead
          ? "bg-card/40 border-border/10 hover:border-border/20 hover:bg-card/60"
          : "bg-card/60 border-color/15 hover:border-color/25 shadow-sm",
        route && "cursor-pointer",
      )}
      onClick={route ? handleClick : undefined}
    >
      {/* Unread left accent */}
      {!notification.isRead && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-color/60" />
      )}

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon badge */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            cfg.iconBg,
          )}
        >
          <Icon size={16} className={cfg.iconColor} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {!notification.isRead && (
                <span
                  className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)}
                />
              )}
              <p
                className={cn(
                  "text-sm leading-snug",
                  notification.isRead
                    ? "font-normal text-foreground/70"
                    : "font-semibold text-foreground",
                )}
              >
                {notification.title}
              </p>
            </div>

            {/* Hover actions */}
            <div
              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {!notification.isRead && (
                <button
                  title="Mark as read"
                  onClick={() => onRead(notification.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <Check size={12} />
                </button>
              )}
              <button
                title="Delete"
                onClick={() => onDelete(notification.id)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 pr-1">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {/* Type chip */}
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                cfg.chip,
              )}
            >
              <Icon size={9} strokeWidth={2.5} />
              {cfg.label}
            </span>
            <span className="text-muted-foreground/40 text-[10px]">·</span>
            <span className="text-[11px] text-muted-foreground">
              {timeAgo(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM CLEAR DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function ClearReadDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
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
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              Clear Read Notifications
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All read notifications will be permanently deleted. This cannot be
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
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Clear All Read
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

function NotificationPagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (p: number) => void;
}) {
  const { page, totalPages, totalCount, pageSize } = pagination;
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
          onClick={() => page > 1 && onPageChange(page - 1)}
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
          onClick={() => page < totalPages && onPageChange(page + 1)}
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
// ROOT CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationsClientProps {
  initialItems: ClientNotification[];
  initialPagination: PaginationInfo;
  initialUnread: number;
}

export function NotificationsClient({
  initialItems,
  initialPagination,
  initialUnread,
}: NotificationsClientProps) {
  const [items, setItems] = useState(initialItems);
  const [pagination, setPagination] = useState(initialPagination);
  const [unread, setUnread] = useState(initialUnread);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchPage = useCallback(async (tab: FilterTab, p: number) => {
    setLoading(true);
    const types = FILTER_TYPE_MAP[tab] ?? undefined;
    const isRead = tab === "unread" ? false : undefined;
    const r = await listClientNotifications({
      page: p,
      pageSize: 20,
      types,
      isRead,
    });
    if (r.success) {
      setItems(r.data.items);
      setPagination(r.data.pagination);
      setUnread(r.data.unreadCount);
    }
    setLoading(false);
  }, []);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
    fetchPage(tab, 1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchPage(activeTab, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Mark read ────────────────────────────────────────────────────────────

  const handleMarkRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
    startTransition(async () => {
      const r = await markNotificationsRead([id]);
      if (!r.success) {
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
        setUnread((prev) => prev + 1);
        toast.error("Failed to mark as read");
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead();
      if (r.success) {
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnread(0);
        toast.success(`${r.data.count} notifications marked as read`);
      } else {
        toast.error("Failed to mark all as read");
      }
    });
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    const item = items.find((n) => n.id === id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.isRead) setUnread((prev) => Math.max(0, prev - 1));
    startTransition(async () => {
      const r = await deleteNotification(id);
      if (!r.success) {
        if (item) {
          setItems((prev) => {
            const copy = [...prev, item];
            copy.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
            return copy;
          });
          if (!item.isRead) setUnread((prev) => prev + 1);
        }
        toast.error("Failed to delete notification");
      }
    });
  };

  const handleClearRead = async () => {
    setClearLoading(true);
    const r = await deleteAllReadNotifications();
    setClearLoading(false);
    if (r.success) {
      toast.success(`${r.data.count} read notifications cleared`);
      fetchPage(activeTab, 1);
      setPage(1);
    } else {
      toast.error("Failed to clear notifications");
    }
    setClearOpen(false);
  };

  // ── Groups ───────────────────────────────────────────────────────────────

  const groups = groupNotifications(items);

  return (
    <div className="space-y-5">
      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                isActive
                  ? "bg-color/15 text-color border-color/25"
                  : "text-muted-foreground bg-muted/15 border-transparent hover:border-border/20 hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.id === "unread" && unread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-color/20 text-color px-1 text-[10px] font-bold tabular-nums">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {pagination.totalCount > 0 ? (
            <>
              <span className="font-semibold text-foreground tabular-nums">
                {pagination.totalCount}
              </span>{" "}
              notification{pagination.totalCount !== 1 ? "s" : ""}
            </>
          ) : (
            "No notifications"
          )}
          {unread > 0 && (
            <>
              {" "}
              ·{" "}
              <span className="font-semibold text-color">{unread} unread</span>
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPage(activeTab, page)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/15 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-40"
              >
                Actions
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-border/20 bg-card/95 backdrop-blur-sm shadow-xl p-1 min-w-45"
            >
              <DropdownMenuItem
                onClick={handleMarkAllRead}
                disabled={unread === 0 || isPending}
                className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer"
              >
                <CheckCheck size={13} className="text-green-400" />
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/15 my-1" />
              <DropdownMenuItem
                onClick={() => setClearOpen(true)}
                disabled={isPending}
                className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer text-red-400 focus:text-red-400"
              >
                <Trash2 size={13} />
                Clear read notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border/20 shadow-lg">
              <Loader2
                size={16}
                className="animate-spin text-muted-foreground"
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-dashed border-border/15 bg-muted/5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-border/10">
                {activeTab === "unread" ? (
                  <BellOff size={26} className="text-muted-foreground/30" />
                ) : (
                  <Bell size={26} className="text-muted-foreground/30" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground/70">
                  {activeTab === "unread"
                    ? "All caught up!"
                    : "No notifications"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === "unread"
                    ? "You have no unread notifications."
                    : "You'll see updates about your bookings, requests, and more here."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-7"
            >
              {groups.map((group) => (
                <div key={group.label}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground/40">
                      <Sparkles size={10} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {group.label}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-border/10" />
                    <span className="text-[10px] font-medium text-muted-foreground/40 tabular-nums">
                      {group.items.length}
                    </span>
                  </div>

                  {/* Items */}
                  <motion.div
                    className="space-y-2"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: { transition: { staggerChildren: 0.04 } },
                    }}
                  >
                    {group.items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={handleMarkRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </motion.div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <NotificationPagination
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* ── Clear dialog ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {clearOpen && (
          <ClearReadDialog
            open={clearOpen}
            onOpenChange={setClearOpen}
            onConfirm={handleClearRead}
            loading={clearLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
