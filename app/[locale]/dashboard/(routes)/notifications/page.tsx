import { Suspense } from "react";
import { listClientNotifications } from "./actions";
import { NotificationsClient } from "./_components/NotificationsClient";
import { NotificationsPageSkeleton } from "./_components/NotificationsPageSkeleton";
import type { ClientNotification, PaginationInfo } from "./_components/types";
import { Bell, Sparkles } from "lucide-react";
import { ClientHeader } from "../../_components/ClientHeader";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const result = await listClientNotifications({ page: 1, pageSize: 20 });

  const initialItems: ClientNotification[] = result.success
    ? result.data.items
    : [];
  const initialPagination: PaginationInfo = result.success
    ? result.data.pagination
    : { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };
  const initialUnread: number = result.success ? result.data.unreadCount : 0;

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
        <Suspense fallback={<NotificationsPageSkeleton />}>
          <NotificationsClient
            initialItems={initialItems}
            initialPagination={initialPagination}
            initialUnread={initialUnread}
          />
        </Suspense>
      </div>
    </div>
  );
}
