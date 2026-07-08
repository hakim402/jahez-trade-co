// app/[locale]/dashboard/(routes)/messages/page.tsx

import { ClientHeader } from "../../_components/ClientHeader"
import { ClientMessagesClient } from "./_components/ClientMessagesClient"
import { getUserContext }        from "./actions"
import { redirect }              from "next/navigation"

// ─── FORCE DYNAMIC RENDERING ──────────────────
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Messages — Dashboard" }

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function MessagesPage({ params }: PageProps) {
  const { locale } = await params
  const isAr = locale === "ar"

  const result = await getUserContext()
  if (!result.success) redirect("/dashboard")
  const { user, plan, sessions } = result.data

  return (
    <>
    <ClientHeader />
    <div className="flex flex-col h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 space-y-7 "
      dir={isAr ? "rtl" : "ltr"}>
      <div className="flex-1 min-h-0">
        <ClientMessagesClient
          initialUser={user}
          initialPlan={plan}
          initialSessions={sessions}
          isAr={isAr}
        />
      </div>
    </div>
        </>
  )
}