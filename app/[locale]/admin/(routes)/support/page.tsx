// app/[locale]/admin/(routes)/messages/page.tsx

import { AdminHeader } from "../../_components/AdminHeader";
import { MessagesClient } from "./_components/MessagesClient";
import { getMessagesStats } from "./actions";
import {
  MessageSquare,
  Zap,
  Hash,
  CalendarDays,
  BotMessageSquare,
} from "lucide-react";

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
    <div className="flex flex-col h-screen overflow-hidden">
      <AdminHeader />

      {/* Page body — scrollable header zone + fixed-height messenger */}
      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">
       

        {/* ── Messenger — takes all remaining height ────────────────────── */}
        <div className="flex-1 overflow-hidden min-h-0">
          <MessagesClient />
        </div>
      </div>
    </div>
  );
}
