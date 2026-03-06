// app/[locale]/admin/(routes)/messages/page.tsx

import { AdminHeader } from "../../_components/AdminHeader";
import { MessagesClient } from "./_components/MessagesClient";
import { getMessagesStats } from "./actions";
import { MessageSquare, Zap, Hash, CalendarDays } from "lucide-react";

export const metadata = { title: "Messages — Admin" };

const KPI_META = [
  {
    key: "totalSessions",
    label: "Total Sessions",
    icon: MessageSquare,
    gradient: "from-violet-500 to-[#7b57fc]",
    glow: "shadow-violet-500/20",
  },
  {
    key: "activeSessions",
    label: "Active Now",
    icon: Zap,
    gradient: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/20",
  },
  {
    key: "totalMessages",
    label: "Total Messages",
    icon: Hash,
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-500/20",
  },
  {
    key: "sessionsToday",
    label: "Started Today",
    icon: CalendarDays,
    gradient: "from-pink-500 to-rose-500",
    glow: "shadow-pink-500/20",
  },
] as const;

export default async function MessagesPage() {
  const statsResult = await getMessagesStats();
  const stats = statsResult.success ? statsResult.data : null;

  return (
    // Use flex-col on the outermost shell; MessagesClient owns the remaining height
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AdminHeader />

      {/* Page body — scrollable header zone + fixed-height messenger */}
      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">
        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Messages
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor and respond to user chat sessions in real time.
            </p>
          </div>

          {stats && stats.activeSessions > 0 && (
            <div className=" flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {stats.activeSessions} live session
                {stats.activeSessions !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* ── Messenger — takes all remaining height ────────────────────── */}
        <div className="flex-1 overflow-hidden min-h-0">
          <MessagesClient />
        </div>
      </div>
    </div>
  );
}
