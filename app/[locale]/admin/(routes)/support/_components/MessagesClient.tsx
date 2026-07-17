"use client";

// app/[locale]/admin/(routes)/messages/_components/MessagesClient.tsx

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useRef,
  Fragment,
} from "react";
import { format, isToday, isYesterday } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MessageSquare,
  Send,
  Trash2,
  StopCircle,
  Loader2,
  User,
  Bot,
  RefreshCw,
  ChevronLeft,
  X,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowDown,
  Inbox,
  Zap,
  BellDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  listSessions,
  getSessionDetail,
  adminReply,
  endSession,
  deleteSession,
  pollNewMessages,
  type SessionListItem,
  type SessionDetail,
  type MessageItem,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_POLL_MS = 5_000; // how often the session list re-syncs
const MESSAGE_POLL_MS = 3_000; // how often active conversation polls
const SESSION_TAKE = 50;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(d: Date | string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

function msgTime(d: Date | string) {
  const date = new Date(d);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "dd MMM, HH:mm");
}

function dayLabel(d: Date | string) {
  const date = new Date(d);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
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

function groupByDay(messages: MessageItem[]) {
  const map = new Map<string, MessageItem[]>();
  for (const m of messages) {
    const label = dayLabel(m.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(m);
  }
  return [...map.entries()];
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: useSessionList  — polls & merges new sessions without resetting scroll
// ─────────────────────────────────────────────────────────────────────────────

function useSessionList(search: string, filter: "all" | "active" | "ended") {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0); // new sessions arrived since last view
  const knownIdsRef = useRef<Set<string>>(new Set());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const searchDebRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const fetchSessions = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const r = await listSessions({
        take: SESSION_TAKE,
        search: search || undefined,
        isActive:
          filter === "active" ? true : filter === "ended" ? false : undefined,
      });
      if (r.success) {
        const incoming = r.data.items;

        setSessions((prev) => {
          // Merge: keep existing order, prepend new sessions, update existing ones
          const prevMap = new Map(prev.map((s) => [s.id, s]));
          const merged: SessionListItem[] = [];
          const seenIncoming = new Set<string>();

          // Count genuinely new sessions
          let added = 0;
          for (const s of incoming) {
            seenIncoming.add(s.id);
            if (!knownIdsRef.current.has(s.id)) added++;
            prevMap.set(s.id, s); // update or add
          }

          // Rebuild: new sessions first, then existing in their original order
          const incomingOrder = new Map(incoming.map((s, i) => [s.id, i]));
          const allIds = [
            ...incoming.map((s) => s.id),
            ...prev.map((s) => s.id).filter((id) => !seenIncoming.has(id)),
          ];
          for (const id of allIds) {
            const s = prevMap.get(id);
            if (s) merged.push(s);
          }

          if (added > 0 && knownIdsRef.current.size > 0) {
            setNewCount((c) => c + added);
          }

          // Update known set
          knownIdsRef.current = new Set(incoming.map((s) => s.id));
          return merged;
        });

        setTotal(r.data.total);
      }
      if (!silent) setLoading(false);
    },
    [search, filter],
  );

  // Initial load
  useEffect(() => {
    fetchSessions(false);
  }, [fetchSessions]);

  // Polling
  useEffect(() => {
    clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(
      () => fetchSessions(true),
      SESSION_POLL_MS,
    );
    return () => clearInterval(pollTimerRef.current);
  }, [fetchSessions]);

  const clearNewCount = () => setNewCount(0);
  const manualRefresh = () => {
    setNewCount(0);
    fetchSessions(false);
  };

  return {
    sessions,
    total,
    loading,
    newCount,
    clearNewCount,
    manualRefresh,
    setSessions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LIST ITEM ROW
// ─────────────────────────────────────────────────────────────────────────────

function SessionItem({
  session,
  isSelected,
  isNew,
  onSelect,
}: {
  session: SessionListItem;
  isSelected: boolean;
  isNew: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -10, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group relative",
        isSelected
          ? "bg-[#7b57fc]/12 border border-[#7b57fc]/25 shadow-sm"
          : isNew
            ? "bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/8"
            : "hover:bg-muted/50 border border-transparent",
      )}
    >
      {/* NEW dot */}
      {isNew && !isSelected && (
        <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <Avatar className="h-9 w-9 ring-2 ring-border/40">
          <AvatarImage src={session.user?.avatarUrl ?? undefined} />
          <AvatarFallback
            className={cn(
              "text-xs font-bold",
              isSelected
                ? "bg-[#7b57fc]/20 text-[#7b57fc]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {session.user
              ? getInitials(session.user.fullName, session.user.email)
              : "??"}
          </AvatarFallback>
        </Avatar>
        {session.isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background ring-1 ring-emerald-400/40" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p
            className={cn(
              "text-sm font-semibold truncate",
              isSelected ? "text-[#7b57fc]" : "text-foreground",
            )}
          >
            {session.user?.fullName ?? session.user?.email ?? "Anonymous"}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
            {timeAgo(session.startedAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
          {session.lastMessage
            ? `${session.lastMessage.role === "user" ? "👤" : "🤖"} ${session.lastMessage.content}`
            : "No messages yet"}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 leading-none",
              session.isActive
                ? "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30"
                : "text-muted-foreground/60 ring-border/50",
            )}
          >
            {session.isActive ? "Active" : "Ended"}
          </span>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          <span className="text-[10px] text-muted-foreground/60">
            {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LIST PANEL
// ─────────────────────────────────────────────────────────────────────────────

interface SessionListPanelProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SessionListPanel({ selectedId, onSelect }: SessionListPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    total,
    loading,
    newCount,
    clearNewCount,
    manualRefresh,
    setSessions,
  } = useSessionList(search, filter);

  // Track which session IDs are "new" for highlight
  const prevSessionIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const curr = new Set(sessions.map((s) => s.id));
    const added = new Set<string>();
    for (const id of curr) {
      if (
        !prevSessionIdsRef.current.has(id) &&
        prevSessionIdsRef.current.size > 0
      ) {
        added.add(id);
      }
    }
    if (added.size > 0) {
      setNewIds((prev) => new Set([...prev, ...added]));
      // Clear new highlight after 8 seconds
      setTimeout(
        () =>
          setNewIds((prev) => {
            const n = new Set(prev);
            added.forEach((id) => n.delete(id));
            return n;
          }),
        8_000,
      );
    }
    prevSessionIdsRef.current = curr;
  }, [sessions]);

  const handleSelect = (id: string) => {
    setNewIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    onSelect(id);
  };

  const FILTER_TABS = [
    { id: "all" as const, label: "All" },
    { id: "active" as const, label: "Active" },
    { id: "ended" as const, label: "Ended" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 border-b border-border/40 shrink-0 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-7 pr-7 h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
          />
          {search && (
            <Button
              onClick={() => setSearch("")}
              variant={"ghost"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex-1 text-xs font-medium py-1 rounded-lg transition-all",
                filter === tab.id
                  ? "bg-[#7b57fc]/15 text-[#7b57fc]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Count + live indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {loading
                ? "Loading…"
                : `${total.toLocaleString()} session${total !== 1 ? "s" : ""}`}
            </span>
            {/* Live pulse indicator */}
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Live
            </span>
          </div>
          <button
            onClick={manualRefresh}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── New sessions banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              clearNewCount();
              manualRefresh();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[#7b57fc]/10 border-b border-[#7b57fc]/20 text-xs font-semibold text-[#7b57fc] hover:bg-[#7b57fc]/15 transition-colors shrink-0"
          >
            <BellDot size={12} />
            {newCount} new session{newCount !== 1 ? "s" : ""} — tap to load
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── List ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0">
        {loading && sessions.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl animate-pulse"
            >
              <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-muted rounded w-3/5" />
                <div className="h-3 bg-muted rounded w-4/5" />
                <div className="h-2.5 bg-muted rounded w-2/5" />
              </div>
            </div>
          ))
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center">
              <Inbox size={20} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No sessions found</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                isSelected={selectedId === s.id}
                isNew={newIds.has(s.id)}
                onSelect={() => handleSelect(s.id)}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-2" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isOptimistic,
}: {
  message: MessageItem;
  isOptimistic?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: isOptimistic ? 0.6 : 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={cn(
        "flex gap-2.5 max-w-[80%]",
        isUser ? "self-end flex-row-reverse" : "self-start",
      )}
    >
      {/* Avatar icon */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-auto mb-1",
          isUser ? "bg-[#7b57fc]/15" : "bg-muted",
        )}
      >
        {isUser ? (
          <User size={13} className="text-[#7b57fc]" />
        ) : (
          <Bot size={13} className="text-muted-foreground" />
        )}
      </div>

      {/* Bubble + time */}
      <div
        className={cn(
          "flex flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
            isUser
              ? "bg-[#7b57fc] text-white rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm",
          )}
        >
          {message.content}
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">
            {msgTime(message.createdAt)}
          </span>
          {isOptimistic && (
            <Loader2
              size={9}
              className="animate-spin text-muted-foreground/50"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: useConversation — loads detail + polls for new messages
// ─────────────────────────────────────────────────────────────────────────────

function useConversation(sessionId: string) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMsgIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const isActiveRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDetail(null);
    const r = await getSessionDetail(sessionId);
    if (r.success) {
      setDetail(r.data);
      const msgs = r.data.messages;
      lastMsgIdRef.current = msgs[msgs.length - 1]?.id ?? null;
      isActiveRef.current = r.data.isActive;
    } else {
      setError(r.error);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll new messages for active sessions
  useEffect(() => {
    clearInterval(pollTimerRef.current);

    const startPoll = () => {
      pollTimerRef.current = setInterval(async () => {
        if (!isActiveRef.current) {
          clearInterval(pollTimerRef.current);
          return;
        }
        const r = await pollNewMessages(sessionId, lastMsgIdRef.current);
        if (!r.success) return;

        if (r.data.messages.length > 0) {
          setDetail((prev) => {
            if (!prev) return prev;
            // Deduplicate
            const existingIds = new Set(prev.messages.map((m) => m.id));
            const fresh = r.data.messages.filter((m) => !existingIds.has(m.id));
            if (fresh.length === 0) return prev;
            lastMsgIdRef.current = fresh[fresh.length - 1].id;
            return { ...prev, messages: [...prev.messages, ...fresh] };
          });
        }

        if (r.data.sessionEndedAt) {
          setDetail((prev) =>
            prev
              ? { ...prev, isActive: false, endedAt: r.data.sessionEndedAt }
              : prev,
          );
          isActiveRef.current = false;
          clearInterval(pollTimerRef.current);
        }
      }, MESSAGE_POLL_MS);
    };

    // Start poll only after initial load
    if (!loading && detail?.isActive) startPoll();

    return () => clearInterval(pollTimerRef.current);
  }, [loading, detail?.isActive, sessionId]);

  const appendOptimistic = (msg: MessageItem) => {
    setDetail((prev) =>
      prev ? { ...prev, messages: [...prev.messages, msg] } : prev,
    );
  };
  const replaceOptimistic = (tempId: string, real: MessageItem) => {
    setDetail((prev) => {
      if (!prev) return prev;
      lastMsgIdRef.current = real.id;
      return {
        ...prev,
        messages: prev.messages.map((m) => (m.id === tempId ? real : m)),
      };
    });
  };
  const removeOptimistic = (tempId: string) => {
    setDetail((prev) =>
      prev
        ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) }
        : prev,
    );
  };
  const markEnded = (endedAt: Date) => {
    setDetail((prev) => (prev ? { ...prev, isActive: false, endedAt } : prev));
    isActiveRef.current = false;
  };
  const markDeleted = () => setDetail(null);

  return {
    detail,
    loading,
    error,
    appendOptimistic,
    replaceOptimistic,
    removeOptimistic,
    markEnded,
    markDeleted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION PANEL
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationPanelProps {
  sessionId: string;
  onDeleted: () => void;
  onBack?: () => void;
}

function ConversationPanel({
  sessionId,
  onDeleted,
  onBack,
}: ConversationPanelProps) {
  const {
    detail,
    loading,
    error,
    appendOptimistic,
    replaceOptimistic,
    removeOptimistic,
    markEnded,
    markDeleted,
  } = useConversation(sessionId);

  const [reply, setReply] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const [isPending, start] = useTransition();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
  };

  // Auto-scroll when new messages arrive and user is near bottom
  useEffect(() => {
    if (!detail) return;
    const count = detail.messages.length;
    if (count > prevMsgCount.current) {
      prevMsgCount.current = count;
      if (atBottom) scrollToBottom();
    }
  }, [detail?.messages.length, atBottom, scrollToBottom]);

  // Scroll on first load
  useEffect(() => {
    if (!loading && detail) setTimeout(() => scrollToBottom(false), 60);
  }, [loading]);

  const handleSend = () => {
    if (!reply.trim() || !detail?.isActive) return;
    const content = reply.trim();
    const tempId = `opt-${Date.now()}`;
    setReply("");
    appendOptimistic({
      id: tempId,
      role: "assistant",
      content,
      createdAt: new Date(),
    });
    scrollToBottom();
    start(async () => {
      const r = await adminReply({ sessionId, content });
      if (r.success) replaceOptimistic(tempId, r.data);
      else {
        removeOptimistic(tempId);
        setReply(content);
      }
    });
  };

  const handleEnd = () => {
    start(async () => {
      const r = await endSession(sessionId);
      if (r.success) markEnded(r.data.endedAt);
    });
  };

  const handleDelete = () => {
    start(async () => {
      const r = await deleteSession(sessionId);
      if (r.success) {
        markDeleted();
        onDeleted();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 size={22} className="animate-spin text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Loading conversation…</p>
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 px-8 text-center">
        <p className="text-sm text-muted-foreground">
          {error ?? "Session not found"}
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs text-[#7b57fc] hover:underline"
          >
            ← Back
          </button>
        )}
      </div>
    );
  }

  const grouped = groupByDay(detail.messages);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40 shrink-0 bg-card/60 backdrop-blur-sm">
        {onBack && (
          <Button
            onClick={onBack}
            variant={"ghost"}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted transition-colors shrink-0 md:hidden"
          >
            <ChevronLeft size={18} />
          </Button>
        )}

        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 ring-2 ring-border/40">
            <AvatarImage src={detail.user?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#7b57fc]/15 text-[#7b57fc] text-xs font-bold">
              {detail.user
                ? getInitials(detail.user.fullName, detail.user.email)
                : "??"}
            </AvatarFallback>
          </Avatar>
          {detail.isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {detail.user?.fullName ?? detail.user?.email ?? "Anonymous"}
            </p>
            {detail.isActive ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                Ended
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {detail.messageCount} messages · {timeAgo(detail.startedAt)}
          </p>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {detail.isActive && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleEnd();
                }}
                disabled={isPending}
                className="text-sm gap-2 cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-500/10"
              >
                <StopCircle size={13} /> End session
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="text-sm gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
            >
              <Trash2 size={13} /> Delete session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5 min-h-0"
      >
        {detail.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <MessageSquare size={24} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
            {detail.isActive && (
              <p className="text-xs text-muted-foreground/60">
                Waiting for user to send a message…
              </p>
            )}
          </div>
        ) : (
          grouped.map(([label, msgs]) => (
            <Fragment key={label}>
              {/* Day divider */}
              <div className="flex items-center gap-3 my-5 shrink-0">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  {label}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              {msgs.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOptimistic={m.id.startsWith("opt-")}
                />
              ))}
            </Fragment>
          ))
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Scroll-to-bottom FAB */}
      <AnimatePresence>
        {!atBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-5 h-8 w-8 rounded-full bg-[#7b57fc] text-white flex items-center justify-center shadow-xl hover:bg-[#6a48e8] transition-colors z-10"
          >
            <ArrowDown size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Composer ────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/40 p-3 bg-card/60 backdrop-blur-sm">
        {detail.isActive ? (
          <>
            <div className="flex items-end gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to user…  (Enter sends · Shift+Enter new line)"
                rows={2}
                disabled={isPending}
                className="flex-1 resize-none text-sm bg-muted/40 border-border/50 rounded-xl focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 min-h-13 max-h-35 transition-all"
              />
              <Button
                onClick={handleSend}
                disabled={!reply.trim() || isPending}
                className="h-10 w-10 p-0 rounded-xl bg-[#7b57fc] hover:bg-[#6a48e8] text-white shrink-0 disabled:opacity-40 transition-all"
              >
                {isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-right tabular-nums">
              {reply.length}/4000
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/30 border border-dashed border-border/50">
            <CheckCircle2 size={13} className="text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Session ended — replies disabled
            </p>
            {detail.endedAt && (
              <span className="text-[10px] text-muted-foreground/50 ml-1">
                · <Clock size={9} className="inline" />{" "}
                {timeAgo(detail.endedAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE (no session selected)
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b57fc]/10 ring-1 ring-[#7b57fc]/20"
      >
        <MessageSquare size={28} className="text-[#7b57fc]/50" />
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-2xl animate-ping ring-1 ring-[#7b57fc]/20 opacity-40" />
      </motion.div>
      <div>
        <p className="text-sm font-semibold text-foreground/70">
          No conversation selected
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Sessions update in real time — no need to refresh
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mt-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </span>
        Polling every {SESSION_POLL_MS / 1000}s
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function MessagesClient() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView("chat");
  };

  const handleDeleted = () => {
    setSelectedId(null);
    setListKey((k) => k + 1);
    setMobileView("list");
  };

  return (
    <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex shadow-sm">
      {/* ── Left: session list ──────────────────────────────────────── */}
      <div
        className={cn(
          "w-full md:w-72 lg:w-80 shrink-0 border-r border-border/30 flex flex-col",
          mobileView === "chat" ? "hidden md:flex" : "flex",
        )}
      >
        <SessionListPanel
          key={listKey}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Right: conversation ─────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 relative",
          mobileView === "list" ? "hidden md:flex" : "flex",
        )}
      >
        {selectedId ? (
          <ConversationPanel
            key={selectedId}
            sessionId={selectedId}
            onDeleted={handleDeleted}
            onBack={() => setMobileView("list")}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
