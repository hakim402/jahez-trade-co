import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserRequests } from './actions'
import RequestsTable from './_components/RequestsTable'
import { CreateRequestDialog } from './_components/CreateRequestDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Header from '../_components/Header/header'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MyRequestsPage({ searchParams }: PageProps) {
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

  const requestsData = await getUserRequests({
    page,
    pageSize,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
    status,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Product Requests</h1>
        <CreateRequestDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </CreateRequestDialog>
      </div>

      <Suspense fallback={<div>Loading requests...</div>}>
        <RequestsTable initialData={requestsData} />
      </Suspense>
    </div>
  )
}