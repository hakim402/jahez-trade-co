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
        {/* ── Page header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between shrink-0">
          

           {/* Title block */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-color/20 blur-md scale-110" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-color/30 to-color/10 border border-color/20 shadow-lg shadow-color/10">
                  <BotMessageSquare size={24} className="text-color" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-bold tracking-tight text-color">
                    Support Center
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chat with our sourcing team and AI assistant.
                </p>
              </div>
            </div>

          {sessions.some((s) => s.isActive) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 self-start">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {sessions.filter((s) => s.isActive).length} active session
                {sessions.filter((s) => s.isActive).length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

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
