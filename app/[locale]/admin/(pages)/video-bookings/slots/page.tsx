'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAvailabilitySlots } from '../actions'
import { SlotsTable } from '../_components/SlotsTable'
import { SlotsFilter } from '../_components/SlotsFilter'
import { Button } from '@/components/ui/button'
import { SlotFormDialog } from '../_components/SlotFormDialog'
import { PlusCircle } from 'lucide-react'
import { useEffect } from 'react'
import AdminHeader from '@/app/admin/_components/Header/AdminHeader'

export default function SlotsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [slots, setSlots] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formDialogOpen, setFormDialogOpen] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const sortBy = searchParams.get('sortBy') || 'startTime'
  const sortOrder = searchParams.get('sortOrder') || 'asc'
  const type = searchParams.get('type')
  const location = searchParams.get('location')
  const isAvailable = searchParams.get('isAvailable')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true)
      const result = await getAvailabilitySlots({
        page,
        pageSize,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        type: type as any,
        location: location ?? undefined,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      })
      setSlots(result.slots)
      setTotalCount(result.totalCount)
      setPageCount(result.pageCount)
      setLoading(false)
    }
    fetchSlots()
  }, [page, pageSize, sortBy, sortOrder, type, location, isAvailable, from, to])

  return (
    <div className="space-y-6">
      <AdminHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Availability Slots</h1>
        <Button onClick={() => setFormDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Slot
        </Button>
      </div>
      <SlotsFilter />
      {loading ? (
        <div className="h-96 flex items-center justify-center">Loading...</div>
      ) : (
        <SlotsTable
          slots={slots}
          totalCount={totalCount}
          pageCount={pageCount}
          currentPage={page}
          pageSize={pageSize}
        />
      )}
      <SlotFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSuccess={() => {
          setFormDialogOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}