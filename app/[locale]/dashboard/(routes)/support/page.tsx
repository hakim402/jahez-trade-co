// app/[locale]/dashboard/(routes)/messages/page.tsx

import { BotMessageSquare } from "lucide-react";
import { ClientHeader } from "../../_components/ClientHeader";
import { ClientMessagesClient } from "./_components/ClientMessagesClient";
import { getUserContext } from "./actions";
import { redirect } from "next/navigation";

export const metadata = { title: "Messages — Dashboard" };

export default async function MessagesPage() {
  const result = await getUserContext();
  if (!result.success) redirect("/dashboard");
  const { user, plan, sessions } = result.data;

  return (
    <>
      <ClientHeader />
      <div className="flex flex-col h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-7">

        {/* ── Messenger — fills remaining height ──────────────────────── */}
        <div className="flex-1 min-h-0">
          <ClientMessagesClient
            initialUser={user}
            initialPlan={plan}
            initialSessions={sessions}
          />
        </div>
      </div>
    </>
  );
}
