"use client";

// app/[locale]/dashboard/(routes)/notifications/_components/NotificationBell.tsx

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { Bell, BellOff, CheckCheck, Loader2, ArrowRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  pollUnreadCount,
  listClientNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
} from "../actions";
import { getNotificationConfig, type ClientNotification } from "./types";
import { translateContent } from "./translate-content";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000;
const PREVIEW_COUNT = 6;

// ─────────────────────────────────────────────────────────────────────────────
// Mini notification row
// ─────────────────────────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
  isAr,
}: {
  notification: ClientNotification;
  onMarkRead: (id: string) => void;
  isAr: boolean;
}) {
  const router = useRouter();
  const cfg = getNotificationConfig(notification.type);
  const Icon = cfg.icon;
  const route = cfg.route(notification);

  const { title, message } = translateContent(
    notification.title,
    notification.message,
    isAr,
  );

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
    if (route) router.push(route);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left rounded-xl px-3 py-2.5 flex items-start gap-2.5 transition-colors",
        notification.isRead
          ? "hover:bg-muted/30"
          : "bg-[#7b57fc]/5 hover:bg-[#7b57fc]/10",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Icon badge */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
          cfg.iconBg,
        )}
      >
        <Icon size={14} className={cfg.iconColor} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          {!notification.isRead && (
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0 mt-1.5",
                cfg.dot,
              )}
            />
          )}
          <p
            className={cn(
              "text-xs leading-tight",
              notification.isRead
                ? "text-foreground/70 font-normal"
                : "text-foreground font-semibold",
            )}
          >
            {title}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate pr-2">
          {message}
        </p>
        <p
          className="text-[10px] text-muted-foreground/60 mt-1"
          suppressHydrationWarning
        >
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: isAr ? arSA : enUS,
          })}
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bell component
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  initialUnread?: number;
  notificationsPath?: string;
  isAr?: boolean;
}

export function NotificationBell({
  initialUnread = 0,
  notificationsPath = "/dashboard/notifications",
  isAr = false,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [previews, setPreviews] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const prevUnreadRef = useRef(initialUnread);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Labels ─────────────────────────────────────────────────────────────────
  const L = {
    notifications: isAr ? "الإشعارات" : "Notifications",
    markAllRead: isAr ? "تعليم الكل كمقروء" : "Mark all read",
    allCaughtUp: isAr ? "لا توجد إشعارات!" : "All caught up!",
    viewAll: isAr ? "عرض كل الإشعارات" : "View all notifications",
    ariaLabel: isAr ? "الإشعارات" : "Notifications",
  };

  // ── Polling ─────────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    const r = await pollUnreadCount();
    if (r.success) {
      const newCount = r.data.unreadCount;
      if (newCount > prevUnreadRef.current) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 1000);
      }
      prevUnreadRef.current = newCount;
      setUnread(newCount);
    }
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  // ── Load previews ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listClientNotifications({ page: 1, pageSize: PREVIEW_COUNT }).then((r) => {
      if (r.success) {
        setPreviews(r.data.items);
        setUnread(r.data.unreadCount);
        prevUnreadRef.current = r.data.unreadCount;
      }
      setLoading(false);
    });
  }, [open]);

  // ── Mark read ───────────────────────────────────────────────────────────────
  const handleMarkRead = (id: string) => {
    setPreviews((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
    startTransition(async () => {
      await markNotificationsRead([id]);
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const r = await markAllNotificationsRead();
      if (r.success) {
        setPreviews((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnread(0);
        prevUnreadRef.current = 0;
        toast.success(
          isAr
            ? "تم تعليم كل الإشعارات كمقروءة"
            : "All notifications marked as read",
        );
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label={`${L.ariaLabel}${unread > 0 ? ` (${unread})` : ""}`}
        >
          <Bell
            size={18}
            className={cn(
              "transition-transform",
              animating && "animate-[wiggle_0.5s_ease-in-out]",
            )}
          />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7b57fc] px-1 text-[10px] font-bold text-white leading-none">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={isAr ? "start" : "end"}
        sideOffset={8}
        className="w-80 p-0 rounded-2xl border border-border/15 bg-card/95 backdrop-blur-sm shadow-2xl overflow-hidden"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">
              {L.notifications}
            </h3>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-[#7b57fc]/15 text-[#7b57fc] text-[10px] font-bold">
                {unread}
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllRead}
            disabled={unread === 0 || isPending}
            className="flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck size={12} />
            {L.markAllRead}
          </button>
        </div>

        {/* Preview list */}
        <div className="max-h-80 overflow-y-auto p-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                size={18}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : previews.length === 0 ? (
            <div className="py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-2">
                <BellOff size={20} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">{L.allCaughtUp}</p>
            </div>
          ) : (
            previews.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                isAr={isAr}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/10 p-2">
          <Link
            href={notificationsPath}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            {isAr ? <ArrowRight size={12} className="rotate-180" /> : null}
            {L.viewAll}
            {!isAr ? <ArrowRight size={12} /> : null}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
