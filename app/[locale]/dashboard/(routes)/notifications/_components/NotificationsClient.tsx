"use client";

// app/[locale]/dashboard/(routes)/notifications/_components/NotificationsClient.tsx

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  format,
} from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
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
import { translateContent } from "./translate-content";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// Bilingual strings
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  en: {
    notifications: "Notifications",
    allNotifications: "All notifications",
    unread: "unread",
    markAllRead: "Mark all as read",
    clearRead: "Clear read notifications",
    actions: "Actions",
    refresh: "Refresh",
    allCaughtUp: "All caught up!",
    noNotifications: "No notifications",
    noUnreadSub: "You have no unread notifications.",
    noNotificationsSub:
      "You'll see updates about your bookings, requests, and more here.",
    showing: "Showing",
    of: "of",
    notification: "notification",
    notifications_plural: "notifications",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    markAsRead: "Mark as read",
    delete: "Delete",
    clearReadTitle: "Clear Read Notifications",
    clearReadDesc:
      "All read notifications will be permanently deleted. This cannot be undone.",
    cancel: "Cancel",
    clearAllRead: "Clear All Read",
  },
  ar: {
    notifications: "الإشعارات",
    allNotifications: "كل الإشعارات",
    unread: "غير مقروء",
    markAllRead: "تعليم الكل كمقروء",
    clearRead: "حذف الإشعارات المقروءة",
    actions: "إجراءات",
    refresh: "تحديث",
    allCaughtUp: "أنت على اطلاع كامل!",
    noNotifications: "لا توجد إشعارات",
    noUnreadSub: "ليس لديك إشعارات غير مقروءة.",
    noNotificationsSub: "ستظهر هنا تحديثات حجوزاتك وطلباتك وغيرها.",
    showing: "عرض",
    of: "من",
    notification: "إشعار",
    notifications_plural: "إشعارات",
    today: "اليوم",
    yesterday: "أمس",
    thisWeek: "هذا الأسبوع",
    markAsRead: "تعليم كمقروء",
    delete: "حذف",
    clearReadTitle: "حذف الإشعارات المقروءة",
    clearReadDesc:
      "ستُحذف جميع الإشعارات المقروءة بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    clearAllRead: "حذف كل المقروء",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function groupLabel(d: Date | string, isAr: boolean, t: typeof T.en): string {
  const date = new Date(d);
  if (isToday(date)) return t.today;
  if (isYesterday(date)) return t.yesterday;
  if (isThisWeek(date)) return t.thisWeek;
  return format(date, isAr ? "MMMM yyyy" : "MMMM yyyy", {
    locale: isAr ? arSA : enUS,
  });
}

function groupNotifications(
  items: ClientNotification[],
  isAr: boolean,
  t: typeof T.en,
) {
  const groups: { label: string; items: ClientNotification[] }[] = [];
  const seen = new Map<string, ClientNotification[]>();
  for (const item of items) {
    const label = groupLabel(item.createdAt, isAr, t);
    if (!seen.has(label)) {
      seen.set(label, []);
      groups.push({ label, items: seen.get(label)! });
    }
    seen.get(label)!.push(item);
  }
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification item
// ─────────────────────────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
  onDelete,
  isAr,
  t,
}: {
  notification: ClientNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  isAr: boolean;
  t: typeof T.en;
}) {
  const router = useRouter();
  const cfg = getNotificationConfig(notification.type);
  const route = cfg.route(notification);
  const Icon = cfg.icon;
  const label = isAr ? cfg.labelAr : cfg.label;

  const { title, message } = translateContent(
    notification.title,
    notification.message,
    isAr,
  );

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
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        "group relative rounded-2xl border transition-all duration-200",
        notification.isRead
          ? "bg-card/40 border-border/10 hover:border-border/20 hover:bg-card/60"
          : "bg-card/60 border-[#7b57fc]/15 hover:border-[#7b57fc]/25 shadow-sm",
        route && "cursor-pointer",
      )}
      onClick={route ? handleClick : undefined}
    >
      {/* Unread left accent */}
      {!notification.isRead && (
        <div
          className={cn(
            "absolute top-4 bottom-4 w-0.5 rounded-full bg-[#7b57fc]/60",
            isAr ? "right-0" : "left-0",
          )}
        />
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
                {title}
              </p>
            </div>

            {/* Hover actions */}
            <div
              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {!notification.isRead && (
                <button
                  title={t.markAsRead}
                  onClick={() => onRead(notification.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <Check size={12} />
                </button>
              )}
              <button
                title={t.delete}
                onClick={() => onDelete(notification.id)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 pr-1">
            {message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                cfg.chip,
              )}
            >
              <Icon size={9} strokeWidth={2.5} />
              {label}
            </span>
            <span className="text-muted-foreground/40 text-[10px]">·</span>
            <span
              className="text-[11px] text-muted-foreground"
              suppressHydrationWarning
            >
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: isAr ? arSA : enUS,
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm clear dialog
// ─────────────────────────────────────────────────────────────────────────────

function ClearReadDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  isAr,
  t,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  isAr: boolean;
  t: typeof T.en;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      dir={isAr ? "rtl" : "ltr"}
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
              {t.clearReadTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.clearReadDesc}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-muted/5">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-8 px-3.5 text-xs font-medium rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {t.clearAllRead}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

function NotificationPagination({
  pagination,
  onPageChange,
  isAr,
  t,
}: {
  pagination: PaginationInfo;
  onPageChange: (p: number) => void;
  isAr: boolean;
  t: typeof T.en;
}) {
  const { page, totalPages, totalCount, pageSize } = pagination;
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;

  return (
    <div
      className="flex items-center justify-between pt-2"
      dir={isAr ? "rtl" : "ltr"}
    >
      <p className="text-xs text-muted-foreground">
        {t.showing}{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {from}–{to}
        </span>{" "}
        {t.of}{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {totalCount.toLocaleString()}
        </span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          onClick={() => page > 1 && onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all disabled:opacity-40"
        >
          <Prev size={14} />
        </Button>
        <span className="text-xs text-muted-foreground px-3 tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          onClick={() => page < totalPages && onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all disabled:opacity-40"
        >
          <Next size={14} />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root client component
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationsClientProps {
  initialItems: ClientNotification[];
  initialPagination: PaginationInfo;
  initialUnread: number;
  isAr?: boolean;
}

export function NotificationsClient({
  initialItems,
  initialPagination,
  initialUnread,
  isAr = false,
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

  const t = (isAr ? T.ar : T.en) as typeof T.en;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (tab: FilterTab, p: number) => {
    setLoading(true);
    const types = FILTER_TYPE_MAP[tab] ?? undefined;
    const isRead = tab === "unread" ? false : undefined;
    const r = await listClientNotifications({
      page: p,
      pageSize: 20,
      types: types ?? undefined,
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

  // ── Mark read ──────────────────────────────────────────────────────────────
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
        toast.error(isAr ? "فشل التعليم كمقروء" : "Failed to mark as read");
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead();
      if (r.success) {
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnread(0);
        toast.success(
          isAr
            ? `تم تعليم ${r.data.count} إشعار كمقروء`
            : `${r.data.count} notifications marked as read`,
        );
      } else {
        toast.error(isAr ? "فشلت العملية" : "Failed to mark all as read");
      }
    });
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
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
        toast.error(isAr ? "فشل الحذف" : "Failed to delete notification");
      }
    });
  };

  const handleClearRead = async () => {
    setClearLoading(true);
    const r = await deleteAllReadNotifications();
    setClearLoading(false);
    if (r.success) {
      toast.success(
        isAr
          ? `تم حذف ${r.data.count} إشعار مقروء`
          : `${r.data.count} read notifications cleared`,
      );
      fetchPage(activeTab, 1);
      setPage(1);
    } else {
      toast.error(isAr ? "فشل حذف الإشعارات" : "Failed to clear notifications");
    }
    setClearOpen(false);
  };

  const groups = groupNotifications(items, isAr, t);

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const label = isAr ? tab.labelAr : tab.label;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                isActive
                  ? "bg-[#7b57fc]/15 text-[#7b57fc] border-[#7b57fc]/25"
                  : "text-muted-foreground bg-muted/15 border-transparent hover:border-border/20 hover:text-foreground",
              )}
            >
              {label}
              {tab.id === "unread" && unread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7b57fc]/20 text-[#7b57fc] px-1 text-[10px] font-bold tabular-nums">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {pagination.totalCount > 0 ? (
            <>
              <span className="font-semibold text-foreground tabular-nums">
                {pagination.totalCount}
              </span>{" "}
              {pagination.totalCount !== 1
                ? t.notifications_plural
                : t.notification}
            </>
          ) : (
            t.noNotifications
          )}
          {unread > 0 && (
            <>
              {" "}
              ·{" "}
              <span className="font-semibold text-[#7b57fc]">
                {unread} {t.unread}
              </span>
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPage(activeTab, page)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/15 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-40"
            title={t.refresh}
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isPending}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-40"
              >
                {t.actions}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isAr ? "start" : "end"}
              className="rounded-xl border-border/20 bg-card/95 backdrop-blur-sm shadow-xl p-1 min-w-44"
            >
              <div dir={isAr ? "rtl" : "ltr"}>
                <DropdownMenuItem
                  onClick={handleMarkAllRead}
                  disabled={unread === 0 || isPending}
                  className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer"
                >
                  <CheckCheck size={13} className="text-green-400" />
                  {t.markAllRead}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/15 my-1" />
                <DropdownMenuItem
                  onClick={() => setClearOpen(true)}
                  disabled={isPending}
                  className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer text-red-400 focus:text-red-400"
                >
                  <Trash2 size={13} />
                  {t.clearRead}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
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
                  {activeTab === "unread" ? t.allCaughtUp : t.noNotifications}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === "unread"
                    ? t.noUnreadSub
                    : t.noNotificationsSub}
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
                        isAr={isAr}
                        t={t}
                      />
                    ))}
                  </motion.div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <NotificationPagination
        pagination={pagination}
        onPageChange={handlePageChange}
        isAr={isAr}
        t={t}
      />

      {/* Clear dialog */}
      <AnimatePresence>
        {clearOpen && (
          <ClearReadDialog
            open={clearOpen}
            onOpenChange={setClearOpen}
            onConfirm={handleClearRead}
            loading={clearLoading}
            isAr={isAr}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
