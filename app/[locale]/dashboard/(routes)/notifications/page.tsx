// app/[locale]/dashboard/(routes)/notifications/page.tsx


import { Suspense } from "react";
import { listClientNotifications } from "./actions";
import { NotificationsClient } from "./_components/NotificationsClient";
import { NotificationsPageSkeleton } from "./_components/NotificationsPageSkeleton";
import type { ClientNotification, PaginationInfo } from "./_components/types";
import { Bell } from "lucide-react";
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
    <>
      <ClientHeader />

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-7">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Notifications
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Stay up to date with your bookings, requests, and messages.
              </p>
            </div>
          </div>

          {initialUnread > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {initialUnread} unread
              </span>
            </div>
          )}
        </div>

        {/* Main component */}
        <Suspense fallback={<NotificationsPageSkeleton />}>
          <NotificationsClient
            initialItems={initialItems}
            initialPagination={initialPagination}
            initialUnread={initialUnread}
          />
        </Suspense>
      </div>
    </>
  );
}
