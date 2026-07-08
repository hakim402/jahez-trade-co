// app/[locale]/admin/(routes)/messages/page.tsx

import { AdminHeader } from "../../_components/AdminHeader";
import { MessagesClient } from "./_components/MessagesClient";
import { getMessagesStats } from "./actions";

// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Messages — Admin" };

export default async function MessagesPage() {
  const statsResult = await getMessagesStats();
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AdminHeader />

      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-4 gap-5 max-w-screen-2xl mx-auto w-full">
        <div className="flex-1 overflow-hidden min-h-0">
          <MessagesClient />
        </div>
      </div>
    </div>
  );
}
