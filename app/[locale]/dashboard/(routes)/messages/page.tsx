// app/[locale]/dashboard/(routes)/messages/page.tsx

import { ClientMessagesClient } from './_components/ClientMessagesClient'
import { getUserContext }        from './actions'
import { redirect }              from 'next/navigation'

export const metadata = { title: 'Messages — Dashboard' }

export default async function MessagesPage() {
  const result = await getUserContext()

  if (!result.success) redirect('/dashboard')

  const { user, plan, sessions } = result.data

  return (
    <ClientMessagesClient
      initialUser={user}
      initialPlan={plan}
      initialSessions={sessions}
    />
  )
}