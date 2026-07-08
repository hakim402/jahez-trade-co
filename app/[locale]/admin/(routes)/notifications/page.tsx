// app/[locale]/admin/(routes)/notifications/page.tsx

import { AdminHeader } from "../../_components/AdminHeader";
import { NotificationsClient } from "./_components/NotificationsClient";
import { getNotificationStats } from "./actions";


// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Notifications — Admin" };

export default async function NotificationsPage() {
  const statsResult = await getNotificationStats();
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="px-6 py-8 space-y-6">
        {/* ── Main client component ────────────────────────────────────────── */}
        <NotificationsClient initialStats={stats} />
      </div>
    </div>
  );
}
