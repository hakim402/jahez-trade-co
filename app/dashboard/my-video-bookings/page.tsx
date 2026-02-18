// app/dashboard/my-video-bookings/page.tsx

import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserBookings } from './actions'
import BookingsTable from './_components/BookingsTable'
import { CreateBookingDialog } from './_components/CreateBookingDialog'
import { Button } from '@/components/ui/button'
import { Plus, Video } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MyVideoBookingsPage({ searchParams }: PageProps) {
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
  const type = params.type as any

  const bookingsData = await getUserBookings({
    page,
    pageSize,
    sortBy: sortBy || 'scheduledAt',
    sortOrder: sortOrder || 'desc',
    status,
    type,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Video Bookings</h1>
        <CreateBookingDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </CreateBookingDialog>
      </div>

      <Suspense fallback={<div>Loading bookings...</div>}>
        <BookingsTable initialData={bookingsData} />
      </Suspense>
    </div>
  )
}