// app/[locale]/admin/(routes)/notifications/page.tsx

import { Bell } from "lucide-react";
import { AdminHeader } from "../../_components/AdminHeader";
import { NotificationsClient } from "./_components/NotificationsClient";
import { getNotificationStats } from "./actions";

export const metadata = { title: "Notifications — Admin" };

export default async function NotificationsPage() {
  const statsResult = await getNotificationStats();
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">

        {/* ── KPI strip ───────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, g: ["#7b57fc", "#6366f1"] },
              {
                label: "Unread",
                value: stats.unread,
                g: ["#f59e0b", "#f97316"],
              },
              {
                label: "Today",
                value: stats.sentToday,
                g: ["#10b981", "#14b8a6"],
              },
              {
                label: "This Week",
                value: stats.sentThisWeek,
                g: ["#ec4899", "#f43f5e"],
              },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-1"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {k.label}
                </span>
                <span className="text-2xl font-extrabold tabular-nums tracking-tight bg-clip-text text-transparent">
                  {k.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Main client component ────────────────────────────────────────── */}
        <NotificationsClient initialStats={stats} />
      </div>
    </div>
  );
}
