"use client";

// app/[locale]/dashboard/(routes)/messages/_components/ClientMessagesClient.tsx

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
import { arSA, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Bot,
  User,
  StopCircle,
  Sparkles,
  Lock,
  AlertTriangle,
  Check,
  Crown,
  RefreshCw,
  X,
  Clock,
  CheckCircle2,
  ArrowDown,
  Zap,
  BellDot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  startSession,
  getClientSessionDetail,
  sendUserMessage,
  pollClientMessages,
  endClientSession,
  type PlanInfo,
  type ClientSession,
  type ClientSessionDetail,
  type ClientMessage,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// Bilingual strings
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  en: {
    messages: "Messages",
    live: "Live",
    newConversation: "New conversation",
    starting: "Starting…",
    upgradeToChat: "Upgrade to chat",
    noConversations: "No conversations yet",
    newTap: (n: number) => `${n} new — tap to load`,
    selectOrStart:
      "Select a session or start a new conversation with our sourcing team.",
    yourConversations: "Your conversations",
    updatesEvery: (s: number) => `Updates every ${s}s`,
    active: "Active",
    ended: "Ended",
    msgs: (n: number) => `${n} msg${n !== 1 ? "s" : ""}`,
    noMessagesYet: "No messages yet",
    sourcingTeam: "Sourcing Team",
    liveStatus: "Live",
    endedStatus: "Ended",
    messageCount: (n: number, ago: string) => `${n} messages · ${ago}`,
    endBtn: "End",
    endConfirmText:
      "End this conversation? You won't be able to send more messages.",
    cancel: "Cancel",
    loadingConv: "Loading conversation…",
    back: "Back",
    howCanWeHelp: "How can we help?",
    helpDesc:
      "Ask our sourcing team about product requests, quotes, bookings, or anything about the platform.",
    suggestions: [
      "How do I submit a product request?",
      "How long does a quote take?",
      "What sourcing services do you offer?",
    ],
    inputPlaceholder:
      "Ask anything…  (Enter to send · Shift+Enter for new line)",
    aiFootnote:
      "AI replies instantly · Our team follows up for complex requests",
    convEnded: "Conversation ended",
    upgradeTitle: "Upgrade to send messages",
    upgradeDesc:
      "Direct messaging with our sourcing team is available on paid plans.",
    viewPlans: "View plans",
    upgradePlanError: "Upgrade your plan to start a conversation.",
    upgradeSendError: "Upgrade your plan to send messages.",
    free: "Free",
    today: "Today",
    yesterday: "Yesterday",
  },
  ar: {
    messages: "الرسائل",
    live: "مباشر",
    newConversation: "محادثة جديدة",
    starting: "جارٍ البدء…",
    upgradeToChat: "ترقية للدردشة",
    noConversations: "لا توجد محادثات بعد",
    newTap: (n: number) => `${n} جديد — اضغط للتحميل`,
    selectOrStart: "اختر جلسة أو ابدأ محادثة جديدة مع فريق المصادر.",
    yourConversations: "محادثاتك",
    updatesEvery: (s: number) => `تحديث كل ${s} ث`,
    active: "نشطة",
    ended: "منتهية",
    msgs: (n: number) => `${n} رسالة`,
    noMessagesYet: "لا توجد رسائل بعد",
    sourcingTeam: "فريق المصادر",
    liveStatus: "مباشر",
    endedStatus: "منتهية",
    messageCount: (n: number, ago: string) => `${n} رسالة · ${ago}`,
    endBtn: "إنهاء",
    endConfirmText: "إنهاء هذه المحادثة؟ لن تتمكن من إرسال المزيد من الرسائل.",
    cancel: "إلغاء",
    loadingConv: "جارٍ تحميل المحادثة…",
    back: "رجوع",
    howCanWeHelp: "كيف يمكننا مساعدتك؟",
    helpDesc:
      "اسأل فريق المصادر عن طلبات المنتجات أو عروض الأسعار أو الحجوزات أو أي شيء عن المنصة.",
    suggestions: [
      "كيف أُرسل طلب منتج؟",
      "كم يستغرق استلام عرض السعر؟",
      "ما خدمات المصادر التي تقدمونها؟",
    ],
    inputPlaceholder: "اسأل أي شيء…  (Enter للإرسال · Shift+Enter لسطر جديد)",
    aiFootnote: "يرد الذكاء الاصطناعي فوراً · يتابع فريقنا الطلبات المعقدة",
    convEnded: "انتهت المحادثة",
    upgradeTitle: "قم بالترقية لإرسال الرسائل",
    upgradeDesc: "المراسلة المباشرة مع فريق المصادر متاحة في الخطط المدفوعة.",
    viewPlans: "عرض الخطط",
    upgradePlanError: "قم بترقية خطتك لبدء محادثة.",
    upgradeSendError: "قم بترقية خطتك لإرسال الرسائل.",
    free: "مجاني",
    today: "اليوم",
    yesterday: "أمس",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_POLL_MS = 5_000;
const MESSAGE_POLL_MS = 3_000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(d: Date | string, isAr: boolean) {
  return formatDistanceToNow(new Date(d), {
    addSuffix: true,
    locale: isAr ? arSA : enUS,
  });
}

function msgTime(d: Date | string, t: typeof T.en) {
  const date = new Date(d);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return `${t.yesterday} ${format(date, "HH:mm")}`;
  return format(date, "dd MMM, HH:mm");
}

function dayLabel(d: Date | string, t: typeof T.en) {
  const date = new Date(d);
  if (isToday(date)) return t.today;
  if (isYesterday(date)) return t.yesterday;
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

function groupByDay(messages: ClientMessage[], t: typeof T.en) {
  const map = new Map<string, ClientMessage[]>();
  for (const m of messages) {
    const label = dayLabel(m.createdAt, t);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(m);
  }
  return [...map.entries()];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useSessionListSync
// ─────────────────────────────────────────────────────────────────────────────

function useSessionListSync(initial: ClientSession[]) {
  const [sessions, setSessions] = useState<ClientSession[]>(initial);
  const [newCount, setNewCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const knownIds = useRef<Set<string>>(new Set(initial.map((s) => s.id)));
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const sync = useCallback(async (silent = true) => {
    if (!silent) setSyncing(true);
    const { getUserContext } = await import("../actions");
    const r = await getUserContext();
    if (!r.success) {
      if (!silent) setSyncing(false);
      return;
    }

    const incoming = r.data.sessions;
    setSessions((prev) => {
      const prevMap = new Map(prev.map((s) => [s.id, s]));
      let added = 0;
      for (const s of incoming) {
        if (!knownIds.current.has(s.id)) added++;
        prevMap.set(s.id, s);
      }
      if (added > 0 && knownIds.current.size > 0) setNewCount((c) => c + added);
      knownIds.current = new Set(incoming.map((s) => s.id));
      return incoming.map((s) => prevMap.get(s.id) ?? s);
    });
    if (!silent) setSyncing(false);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => sync(true), SESSION_POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [sync]);

  return {
    sessions,
    setSessions,
    newCount,
    clearNewCount: () => setNewCount(0),
    forceSync: () => sync(false),
    syncing,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useConversation
// ─────────────────────────────────────────────────────────────────────────────

function useConversation(sessionId: string) {
  const [detail, setDetail] = useState<ClientSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMsgId = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const isActiveRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDetail(null);
    const r = await getClientSessionDetail(sessionId);
    if (r.success) {
      setDetail(r.data);
      const msgs = r.data.messages;
      lastMsgId.current = msgs[msgs.length - 1]?.id ?? null;
      isActiveRef.current = r.data.isActive;
    } else {
      setError(r.error);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    clearInterval(pollTimer.current);
    if (loading || !detail?.isActive) return;
    pollTimer.current = setInterval(async () => {
      if (!isActiveRef.current) {
        clearInterval(pollTimer.current);
        return;
      }
      const r = await pollClientMessages(sessionId, lastMsgId.current);
      if (!r.success) return;
      if (r.data.messages.length > 0) {
        setDetail((prev) => {
          if (!prev) return prev;
          const existingIds = new Set(prev.messages.map((m) => m.id));
          const fresh = r.data.messages.filter((m) => !existingIds.has(m.id));
          if (fresh.length === 0) return prev;
          lastMsgId.current = fresh[fresh.length - 1].id;
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
        clearInterval(pollTimer.current);
      }
    }, MESSAGE_POLL_MS);
    return () => clearInterval(pollTimer.current);
  }, [loading, detail?.isActive, sessionId]);

  const appendOptimistic = (msg: ClientMessage) =>
    setDetail((prev) =>
      prev ? { ...prev, messages: [...prev.messages, msg] } : prev,
    );

  const replaceOptimistic = (
    tempId: string,
    real: ClientMessage,
    aiMsg?: ClientMessage | null,
  ) => {
    setDetail((prev) => {
      if (!prev) return prev;
      let msgs = prev.messages.map((m) => (m.id === tempId ? real : m));
      if (aiMsg) msgs = [...msgs, aiMsg];
      lastMsgId.current = aiMsg?.id ?? real.id;
      return { ...prev, messages: msgs };
    });
  };

  const removeOptimistic = (tempId: string) =>
    setDetail((prev) =>
      prev
        ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) }
        : prev,
    );

  const markEnded = (endedAt: Date) => {
    setDetail((prev) => (prev ? { ...prev, isActive: false, endedAt } : prev));
    isActiveRef.current = false;
    clearInterval(pollTimer.current);
  };

  return {
    detail,
    loading,
    error,
    setError,
    appendOptimistic,
    replaceOptimistic,
    removeOptimistic,
    markEnded,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan badge
// ─────────────────────────────────────────────────────────────────────────────

function PlanBadge({ plan, t }: { plan: PlanInfo; t: typeof T.en }) {
  if (plan.isDefault || plan.amount === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <MessageSquare size={9} /> {t.free}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/25">
      <Crown size={9} /> {plan.name}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upgrade wall
// ─────────────────────────────────────────────────────────────────────────────

function UpgradeWall({ t }: { t: typeof T.en }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25">
        <Lock size={26} className="text-amber-500" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {t.upgradeTitle}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          {t.upgradeDesc}
        </p>
      </div>
      <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2 rounded-xl">
        <Crown size={14} /> {t.viewPlans}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session list item
// ─────────────────────────────────────────────────────────────────────────────

function SessionItem({
  session,
  isSelected,
  isNew,
  onSelect,
  t,
  isAr,
}: {
  session: ClientSession;
  isSelected: boolean;
  isNew: boolean;
  onSelect: () => void;
  t: typeof T.en;
  isAr: boolean;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: isAr ? 8 : -8, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 relative",
        isSelected
          ? "bg-[#7b57fc]/12 border border-[#7b57fc]/25 shadow-sm"
          : isNew
            ? "bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/8"
            : "hover:bg-muted/50 border border-transparent",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {isNew && !isSelected && (
        <span
          className={cn(
            "absolute top-2.5 h-1.5 w-1.5 rounded-full bg-emerald-400",
            isAr ? "left-2.5" : "right-2.5",
          )}
        />
      )}

      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
          isSelected
            ? "bg-[#7b57fc]/15"
            : session.isActive
              ? "bg-emerald-500/10"
              : "bg-muted/50",
        )}
      >
        <MessageSquare
          size={15}
          className={cn(
            isSelected
              ? "text-[#7b57fc]"
              : session.isActive
                ? "text-emerald-500"
                : "text-muted-foreground",
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p
            className={cn(
              "text-xs font-semibold truncate",
              isSelected ? "text-[#7b57fc]" : "text-foreground",
            )}
          >
            {isToday(new Date(session.startedAt))
              ? `${t.today} · ${format(new Date(session.startedAt), "HH:mm")}`
              : format(new Date(session.startedAt), "MMM d · HH:mm")}
          </p>
          <span
            className="text-[10px] text-muted-foreground shrink-0 tabular-nums"
            suppressHydrationWarning
          >
            {timeAgo(session.startedAt, isAr)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
          {session.lastMessage
            ? `${session.lastMessage.role === "assistant" ? "🤖" : "👤"} ${session.lastMessage.content}`
            : t.noMessagesYet}
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
            {session.isActive ? t.active : t.ended}
          </span>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          <span className="text-[10px] text-muted-foreground/60">
            {t.msgs(session.messageCount)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator
// ─────────────────────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-end gap-2.5 self-start"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mb-1">
        <Bot size={13} className="text-muted-foreground" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted border border-border/30">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              style={{ animationDelay: `${delay}ms` }}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  user,
  isOptimistic,
  t,
  isAr,
}: {
  message: ClientMessage;
  user: { fullName: string | null; email: string; avatarUrl: string | null };
  isOptimistic?: boolean;
  t: typeof T.en;
  isAr: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: isOptimistic ? 0.6 : 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex gap-2.5 max-w-[80%]",
        isUser ? "self-end flex-row-reverse" : "self-start",
      )}
    >
      {/* Avatar */}
      <div className="mt-auto mb-1 shrink-0">
        {isUser ? (
          <Avatar className="h-7 w-7 ring-1 ring-border/40">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#7b57fc]/15 text-[#7b57fc] text-[10px] font-bold">
              {getInitials(user.fullName, user.email)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center ring-1 ring-border/40">
            <Bot size={13} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap wrap-break-words",
            isUser
              ? "bg-[#7b57fc] text-white rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm",
          )}
        >
          {message.content}
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <span
            className="text-[10px] text-muted-foreground/60 tabular-nums"
            suppressHydrationWarning
          >
            {msgTime(message.createdAt, t)}
          </span>
          {isUser &&
            (isOptimistic ? (
              <Loader2
                size={9}
                className="animate-spin text-muted-foreground/50"
              />
            ) : (
              <Check size={9} className="text-[#7b57fc]/60" />
            ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation view
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationViewProps {
  sessionId: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  plan: PlanInfo;
  onEnded: (sessionId: string, endedAt: Date) => void;
  onBack?: () => void;
  t: typeof T.en;
  isAr: boolean;
}

function ConversationView({
  sessionId,
  user,
  plan,
  onEnded,
  onBack,
  t,
  isAr,
}: ConversationViewProps) {
  const {
    detail,
    loading,
    error,
    setError,
    appendOptimistic,
    replaceOptimistic,
    removeOptimistic,
    markEnded,
  } = useConversation(sessionId);

  const [reply, setReply] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [endConfirm, setEndConfirm] = useState(false);
  const [isPending, start] = useTransition();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    if (!detail) return;
    const count = detail.messages.length;
    if (count > prevMsgCount.current) {
      prevMsgCount.current = count;
      if (atBottom) scrollToBottom();
      setAiTyping(false);
    }
  }, [detail?.messages.length, atBottom, scrollToBottom]);

  useEffect(() => {
    if (!loading && detail) setTimeout(() => scrollToBottom(false), 60);
  }, [loading]);

  const handleSend = () => {
    if (!reply.trim() || !detail?.isActive || isPending) return;
    const content = reply.trim();
    const tempId = `opt-${Date.now()}`;
    setReply("");
    setError(null);
    appendOptimistic({
      id: tempId,
      role: "user",
      content,
      createdAt: new Date(),
    });
    scrollToBottom();
    setAiTyping(true);

    start(async () => {
      const r = await sendUserMessage({ sessionId, content });
      if (r.success) {
        replaceOptimistic(tempId, r.data.userMessage, r.data.aiMessage);
        setAiTyping(false);
        scrollToBottom();
      } else {
        removeOptimistic(tempId);
        setAiTyping(false);
        setReply(content);
        setError(r.error === "UPGRADE_REQUIRED" ? t.upgradeSendError : r.error);
      }
    });
  };

  const handleEnd = () => {
    start(async () => {
      const r = await endClientSession(sessionId);
      if (r.success) {
        markEnded(r.data.endedAt);
        onEnded(sessionId, r.data.endedAt);
        setEndConfirm(false);
      } else {
        setError(r.error);
        setEndConfirm(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading)
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 size={22} className="animate-spin text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">{t.loadingConv}</p>
      </div>
    );
  if (error && !detail)
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-center px-8">
        <AlertTriangle size={22} className="text-red-400/70" />
        <p className="text-sm text-muted-foreground">{error}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs text-[#7b57fc] hover:underline mt-1"
          >
            ← {t.back}
          </button>
        )}
      </div>
    );
  if (!detail) return null;

  const grouped = groupByDay(detail.messages, t);

  return (
    <div className="flex flex-col h-full" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40 shrink-0 bg-card/60 backdrop-blur-sm">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted transition-colors shrink-0 md:hidden"
          >
            {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        )}

        <div className="relative shrink-0">
          <div className="h-9 w-9 rounded-full bg-[#7b57fc]/15 ring-2 ring-border/40 flex items-center justify-center">
            <Bot size={16} className="text-[#7b57fc]" />
          </div>
          {detail.isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {t.sourcingTeam}
            </p>
            {detail.isActive ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {t.liveStatus}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                {t.endedStatus}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t.messageCount(
              detail.messageCount,
              timeAgo(detail.startedAt, isAr),
            )}
          </p>
        </div>

        {detail.isActive && (
          <button
            onClick={() => setEndConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/8"
          >
            <StopCircle size={13} /> {t.endBtn}
          </button>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs shrink-0"
          >
            <AlertTriangle size={12} />
            <span className="flex-1">{error}</span>
            <Button variant="ghost" onClick={() => setError(null)}>
              <X size={12} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End confirm */}
      <AnimatePresence>
        {endConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0"
          >
            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400 flex-1">
              {t.endConfirmText}
            </p>
            <button
              onClick={() => setEndConfirm(false)}
              className="text-xs text-muted-foreground hover:text-foreground px-2"
            >
              {t.cancel}
            </button>
            <Button
              size="sm"
              onClick={handleEnd}
              disabled={isPending}
              className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
            >
              {isPending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                t.endBtn
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5 min-h-0"
      >
        {detail.messages.length === 0 && !aiTyping ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b57fc]/10 ring-1 ring-[#7b57fc]/20"
            >
              <Sparkles size={26} className="text-[#7b57fc]/70" />
            </motion.div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {t.howCanWeHelp}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {t.helpDesc}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {t.suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setReply(q);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#7b57fc]/25 bg-[#7b57fc]/5 text-[#7b57fc] hover:bg-[#7b57fc]/12 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          grouped.map(([label, msgs]) => (
            <Fragment key={label}>
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
                  user={user}
                  isOptimistic={m.id.startsWith("opt-")}
                  t={t}
                  isAr={isAr}
                />
              ))}
            </Fragment>
          ))
        )}

        <AnimatePresence>
          {aiTyping && (
            <div className="mt-2">
              <TypingIndicator />
            </div>
          )}
        </AnimatePresence>

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

      {/* Composer */}
      <div className="shrink-0 border-t border-border/40 p-3 bg-card/60 backdrop-blur-sm">
        {detail.isActive ? (
          <>
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.inputPlaceholder}
                rows={2}
                disabled={isPending}
                className="flex-1 resize-none text-sm bg-muted/40 border-border/50 rounded-xl focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 min-h-13 max-h-35 transition-all"
                dir={isAr ? "rtl" : "ltr"}
              />
              <Button
                onClick={handleSend}
                disabled={!reply.trim() || isPending}
                className="h-10 w-10 p-0 rounded-xl bg-[#7b57fc] hover:bg-[#6a48e8] text-white shrink-0 disabled:opacity-40"
              >
                {isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5 flex items-center gap-1">
              <Bot size={9} /> {t.aiFootnote}
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/30 border border-dashed border-border/50">
            <CheckCircle2 size={13} className="text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">{t.convEnded}</p>
            {detail.endedAt && (
              <span
                className="text-[10px] text-muted-foreground/50"
                suppressHydrationWarning
              >
                · <Clock size={9} className="inline" />{" "}
                {timeAgo(detail.endedAt, isAr)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({
  onNew,
  plan,
  isPending,
  t,
}: {
  onNew: () => void;
  plan: PlanInfo;
  isPending: boolean;
  t: typeof T.en;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7b57fc]/10 ring-1 ring-[#7b57fc]/20"
      >
        <MessageSquare size={28} className="text-[#7b57fc]/50" />
        <span className="absolute inset-0 rounded-2xl animate-ping ring-1 ring-[#7b57fc]/15 opacity-40" />
      </motion.div>
      <div>
        <p className="text-sm font-semibold text-foreground/80">
          {t.yourConversations}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xs">
          {t.selectOrStart}
        </p>
      </div>
      {plan.hasAccess && (
        <Button
          onClick={onNew}
          disabled={isPending}
          className="bg-[#7b57fc] hover:bg-[#6a48e8] text-white gap-2 rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 size={13} className="animate-spin" /> {t.starting}
            </>
          ) : (
            <>
              <Plus size={14} /> {t.newConversation}
            </>
          )}
        </Button>
      )}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </span>
        {t.updatesEvery(SESSION_POLL_MS / 1000)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialUser: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  initialPlan: PlanInfo;
  initialSessions: ClientSession[];
  isAr?: boolean;
}

export function ClientMessagesClient({
  initialUser,
  initialPlan,
  initialSessions,
  isAr = false,
}: Props) {
  const t = (isAr ? T.ar : T.en) as typeof T.en;

  const { sessions, setSessions, newCount, clearNewCount, forceSync, syncing } =
    useSessionListSync(initialSessions);

  const [selectedId, setSelectedId] = useState<string | null>(
    initialSessions.find((s) => s.isActive)?.id ??
      initialSessions[0]?.id ??
      null,
  );
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isPending, start] = useTransition();
  const [startError, setStartError] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const prevIdsRef = useRef<Set<string>>(
    new Set(initialSessions.map((s) => s.id)),
  );
  useEffect(() => {
    const curr = new Set(sessions.map((s) => s.id));
    const added = new Set<string>();
    for (const id of curr) {
      if (!prevIdsRef.current.has(id)) added.add(id);
    }
    if (added.size > 0) {
      setNewIds((prev) => new Set([...prev, ...added]));
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
    prevIdsRef.current = curr;
  }, [sessions]);

  const handleNewSession = () => {
    if (!initialPlan.hasAccess) return;
    setStartError(null);
    start(async () => {
      const r = await startSession();
      if (r.success) {
        setSessions((prev) => [r.data, ...prev]);
        setSelectedId(r.data.id);
        setMobileView("chat");
      } else
        setStartError(
          r.error === "UPGRADE_REQUIRED" ? t.upgradePlanError : r.error,
        );
    });
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView("chat");
    setNewIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleEnded = (id: string, endedAt: Date) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: false, endedAt } : s)),
    );
  };

  return (
    <div
      className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden flex shadow-sm"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Left: session list */}
      <div
        className={cn(
          "w-full md:w-72 lg:w-80 shrink-0 border-r border-border/30 flex flex-col",
          isAr && "border-r-0 border-l",
          mobileView === "chat" ? "hidden md:flex" : "flex",
        )}
      >
        {/* List header */}
        <div className="px-3 pt-3 pb-2 border-b border-border/40 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {t.messages}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                {t.live}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <PlanBadge plan={initialPlan} t={t} />
              <Button
                variant="ghost"
                onClick={forceSync}
                className="text-muted-foreground hover:text-foreground transition-colors h-7 w-7 p-0"
              >
                <RefreshCw
                  size={11}
                  className={syncing ? "animate-spin" : ""}
                />
              </Button>
            </div>
          </div>

          {initialPlan.hasAccess ? (
            <Button
              onClick={handleNewSession}
              disabled={isPending}
              size="sm"
              className="w-full h-8 text-xs bg-[#7b57fc] hover:bg-[#6a48e8] text-white gap-1.5 rounded-lg"
            >
              {isPending ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> {t.starting}
                </>
              ) : (
                <>
                  <Plus size={12} /> {t.newConversation}
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/8 gap-1.5 rounded-lg"
            >
              <Crown size={11} /> {t.upgradeToChat}
            </Button>
          )}
          {startError && <p className="text-xs text-red-500">{startError}</p>}
        </div>

        {/* New sessions banner */}
        <AnimatePresence>
          {newCount > 0 && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => {
                clearNewCount();
                forceSync();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#7b57fc]/10 border-b border-[#7b57fc]/20 text-xs font-semibold text-[#7b57fc] hover:bg-[#7b57fc]/15 transition-colors shrink-0"
            >
              <BellDot size={12} /> {t.newTap(newCount)}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
              <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
                <MessageSquare size={18} className="text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground">
                {t.noConversations}
              </p>
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
                  t={t}
                  isAr={isAr}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border/40 flex items-center gap-2.5 shrink-0">
          <Avatar className="h-7 w-7 ring-1 ring-border/40 shrink-0">
            <AvatarImage src={initialUser.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#7b57fc]/15 text-[#7b57fc] text-[10px] font-bold">
              {getInitials(initialUser.fullName, initialUser.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {initialUser.fullName ?? initialUser.email}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {initialUser.email}
            </p>
          </div>
        </div>
      </div>

      {/* Right: conversation */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 relative",
          mobileView === "list" ? "hidden md:flex" : "flex",
        )}
      >
        {!initialPlan.hasAccess ? (
          <UpgradeWall t={t} />
        ) : selectedId ? (
          <ConversationView
            key={selectedId}
            sessionId={selectedId}
            user={initialUser}
            plan={initialPlan}
            onEnded={handleEnded}
            onBack={() => setMobileView("list")}
            t={t}
            isAr={isAr}
          />
        ) : (
          <EmptyState
            onNew={handleNewSession}
            plan={initialPlan}
            isPending={isPending}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
