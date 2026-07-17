"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  Bell,
  BellOff,
  CheckCheck,
  Check,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSidebar } from "@/context/sidebar-context";
import { ThemeToggle } from "@/app/[locale]/_components/Theme/theme-toggle";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "../../_components/Language/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  pollUnreadCount,
  listClientNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../(routes)/notifications/actions";
import {
  getNotificationConfig,
  type ClientNotification,
} from "../(routes)/notifications/_components/types";
import { translateContent } from "../(routes)/notifications/_components/translate-content";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 30_000;
const PREVIEW_SIZE = 6;

// ─────────────────────────────────────────────────────────────────────────────
// Bilingual labels (only the bell + header strings — keep it lean)
// ─────────────────────────────────────────────────────────────────────────────

const L = {
  en: {
    notifications: "Notifications",
    markAllRead: "Mark all read",
    allCaughtUp: "All caught up!",
    noNew: "No new notifications.",
    viewAll: "View all notifications",
    markAsRead: "Mark as read",
    delete: "Delete",
    failDelete: "Failed to delete",
    allMarked: "All marked as read",
    notifAriaLabel: (n: number) =>
      n > 0 ? `Notifications (${n} unread)` : "Notifications",
  },
  ar: {
    notifications: "الإشعارات",
    markAllRead: "تعليم الكل كمقروء",
    allCaughtUp: "أنت على اطلاع كامل!",
    noNew: "لا توجد إشعارات جديدة.",
    viewAll: "عرض كل الإشعارات",
    markAsRead: "تعليم كمقروء",
    delete: "حذف",
    failDelete: "فشل الحذف",
    allMarked: "تم تعليم الكل كمقروء",
    notifAriaLabel: (n: number) =>
      n > 0 ? `الإشعارات (${n} غير مقروء)` : "الإشعارات",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Notification row
// ─────────────────────────────────────────────────────────────────────────────

function NotifRow({
  n,
  onRead,
  onDelete,
  isAr,
}: {
  n: ClientNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  isAr: boolean;
}) {
  const router = useRouter();
  const cfg = getNotificationConfig(n.type);
  const Icon = cfg.icon;
  const route = cfg.route(n);
  const l = isAr ? L.ar : L.en;

  // Translate stored English strings to Arabic at display time
  const { title, message } = translateContent(n.title, n.message, isAr);
  const typeLabel = isAr ? cfg.labelAr : cfg.label;

  const handleClick = () => {
    if (!n.isRead) onRead(n.id);
    if (route) router.push(route);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        "group relative rounded-xl border transition-all duration-150",
        n.isRead
          ? "bg-muted/10 border-border/8 hover:bg-muted/20 hover:border-border/15"
          : "bg-[#7b57fc]/5 border-[#7b57fc]/15 hover:border-[#7b57fc]/25",
        route && "cursor-pointer",
      )}
      onClick={route ? handleClick : undefined}
    >
      {/* Unread accent bar */}
      {!n.isRead && (
        <div
          className={cn(
            "absolute top-3 bottom-3 w-0.5 rounded-full bg-[#7b57fc]/50",
            isAr ? "right-0" : "left-0",
          )}
        />
      )}

      <div className="flex items-start gap-2.5 px-3.5 py-2.5">
        {/* Icon badge */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
            cfg.iconBg,
          )}
        >
          <Icon size={14} className={cfg.iconColor} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {!n.isRead && (
                <span
                  className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)}
                />
              )}
              <p
                className={cn(
                  "text-xs leading-tight truncate",
                  n.isRead
                    ? "font-normal text-foreground/65"
                    : "font-semibold text-foreground",
                )}
              >
                {title}
              </p>
            </div>

            {/* Hover actions */}
            <div
              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {!n.isRead && (
                <button
                  title={l.markAsRead}
                  onClick={() => onRead(n.id)}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <Check size={11} />
                </button>
              )}
              <button
                title={l.delete}
                onClick={() => onDelete(n.id)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 pr-1">
            {message}
          </p>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                cfg.chip,
              )}
            >
              <Icon size={8} strokeWidth={2.5} />
              {typeLabel}
            </span>
            <span className="text-muted-foreground/40 text-[9px]">·</span>
            <span
              className="text-[10px] text-muted-foreground/60"
              suppressHydrationWarning
            >
              {formatDistanceToNow(new Date(n.createdAt), {
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
// Notification bell
// ─────────────────────────────────────────────────────────────────────────────

function NotificationBell({
  initialUnread = 0,
  isAr,
}: {
  initialUnread?: number;
  isAr: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const prevRef = useRef(initialUnread);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const l = isAr ? L.ar : L.en;

  // Poll
  const poll = useCallback(async () => {
    const r = await pollUnreadCount();
    if (r.success) {
      if (r.data.unreadCount > prevRef.current) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 800);
      }
      prevRef.current = r.data.unreadCount;
      setUnread(r.data.unreadCount);
    }
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  // Load on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listClientNotifications({ page: 1, pageSize: PREVIEW_SIZE }).then((r) => {
      if (r.success) {
        setItems(r.data.items);
        setUnread(r.data.unreadCount);
        prevRef.current = r.data.unreadCount;
      }
      setLoading(false);
    });
  }, [open]);

  const handleRead = (id: string) => {
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
      }
    });
  };

  const handleDelete = (id: string) => {
    const item = items.find((n) => n.id === id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (item && !item.isRead) setUnread((prev) => Math.max(0, prev - 1));
    startTransition(async () => {
      const r = await deleteNotification(id);
      if (!r.success) {
        if (item)
          setItems((prev) =>
            [...prev, item].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          );
        toast.error(l.failDelete);
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead();
      if (r.success) {
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnread(0);
        prevRef.current = 0;
        toast.success(l.allMarked);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground"
          aria-label={l.notifAriaLabel(unread)}
        >
          <Bell
            size={17}
            className={cn(
              "transition-transform duration-200",
              animating && "animate-[wiggle_0.5s_ease-in-out]",
            )}
          />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7b57fc] px-1 text-[9px] font-bold text-white leading-none shadow-sm"
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={isAr ? "start" : "end"}
        sideOffset={10}
        className="w-85 p-0 rounded-2xl border border-border/15 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 100% at 10% 50%, color-mix(in srgb, #7b57fc 6%, transparent), transparent)",
            }}
          />
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-border/10">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7b57fc]/15">
                <Bell size={13} className="text-[#7b57fc]" />
              </div>
              <span className="font-semibold text-sm text-foreground">
                {l.notifications}
              </span>
              {unread > 0 && (
                <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-[#7b57fc]/15 text-[#7b57fc] text-[10px] font-bold">
                  {unread}
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={unread === 0 || isPending}
              className="flex items-center gap-1 h-6 px-2 text-[11px] font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <CheckCheck size={11} />
              {l.markAllRead}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-85 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/30">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2
                size={18}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2.5 py-10 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 ring-1 ring-border/10">
                <BellOff size={20} className="text-muted-foreground/30" />
              </div>
              <p className="text-xs font-medium text-foreground/60">
                {l.allCaughtUp}
              </p>
              <p className="text-[11px] text-muted-foreground">{l.noNew}</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {items.map((n) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  isAr={isAr}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/10 p-2">
          <a
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            dir={isAr ? "rtl" : "ltr"}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            {isAr ? (
              <ArrowRight size={11} className="rotate-180" />
            ) : (
              <Sparkles size={11} />
            )}
            {l.viewAll}
            {isAr ? <Sparkles size={11} /> : <ArrowRight size={11} />}
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

export function ClientHeader() {
  const { toggleMobile } = useSidebar();
  const pathname = usePathname();
  // Detect locale from URL: /ar/... → Arabic, anything else → English
  const isAr = pathname.startsWith("/ar");

  return (
    <header className="sticky top-0 z-30 h-14 bg-sidebar/90 border-b border-border/15 px-4 lg:px-6">
      <div
        className="flex items-center justify-between h-full max-w-7xl mx-auto"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          onClick={toggleMobile}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
        >
          <Menu size={18} />
        </Button>

        {/* Desktop spacer */}
        <div className="hidden lg:block" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="h-5 w-px bg-border/20 mx-1" />
          <NotificationBell isAr={isAr} />
          <div className="h-5 w-px bg-border/20 mx-1" />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox:
                  "w-8 h-8 rounded-lg ring-1 ring-border/20 hover:ring-[#7b57fc]/40 transition-all",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
