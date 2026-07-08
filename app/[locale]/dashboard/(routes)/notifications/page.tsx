// app/[locale]/dashboard/(routes)/notifications/page.tsx

import { Suspense } from "react";
import type { Metadata } from "next";
import { listClientNotifications } from "./actions";
import { NotificationsClient } from "./_components/NotificationsClient";
import { NotificationsPageSkeleton } from "./_components/NotificationsPageSkeleton";
import type { ClientNotification, PaginationInfo } from "./_components/types";
import { ClientHeader } from "../../_components/ClientHeader";

// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Notifications | Dashboard" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const result = await listClientNotifications({ page: 1, pageSize: 20 });

  const initialItems: ClientNotification[] = result.success
    ? result.data.items
    : [];
  const initialPagination: PaginationInfo = result.success
    ? result.data.pagination
    : { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };
  const initialUnread: number = result.success ? result.data.unreadCount : 0;

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <ClientHeader />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 max-w-7xl m-auto">
        <Suspense fallback={<NotificationsPageSkeleton />}>
          <NotificationsClient
            initialItems={initialItems}
            initialPagination={initialPagination}
            initialUnread={initialUnread}
            isAr={isAr}
          />
        </Suspense>
      </div>
    </div>
  );
}
