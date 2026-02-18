// app/dashboard/payments/page.tsx

import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserPayments } from './actions'
import PaymentsTable from './_components/PaymentTable'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) redirect('/sign-in')

  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const sortBy = params.sortBy as string
  const sortOrder = params.sortOrder as 'asc' | 'desc' | undefined
  const status = params.status as any

  const paymentsData = await getUserPayments({
    page,
    pageSize,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
    status,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Payment History</h1>
      <Suspense fallback={<div>Loading payments...</div>}>
        <PaymentsTable initialData={paymentsData} />
      </Suspense>
    </div>
  )
}