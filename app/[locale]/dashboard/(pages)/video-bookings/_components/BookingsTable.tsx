'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatTime } from '@/lib/utils'
import { cancelBooking } from '../actions'
import { BookingDetailsDrawer } from './BookingDetailsDrawer'
import { toast } from 'sonner'
import { MoreHorizontal, Eye, XCircle } from 'lucide-react'

interface BookingsTableProps {
  initialData: {
    bookings: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

const statusStyles: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  SCHEDULED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  CANCELED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export default function BookingsTable({ initialData }: BookingsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    return sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []
  })
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => row.original.supplier?.name || '—',
    },
    {
      accessorKey: 'supplier.type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.supplier?.type || '—'}</Badge>
      ),
    },
    {
      accessorKey: 'supplier.location',
      header: 'Location',
      cell: ({ row }) => row.original.supplier?.location || '—',
    },
    {
      accessorKey: 'scheduledAt',
      id: 'date',
      header: 'Date',
      cell: ({ row }) => (row.original.scheduledAt ? formatDate(row.original.scheduledAt) : '—'),
    },
    {
      accessorKey: 'scheduledAt',
      id: 'time',
      header: 'Time',
      cell: ({ row }) => (row.original.scheduledAt ? formatTime(row.original.scheduledAt) : '—'),
    },
    {
      accessorKey: 'durationMinutes',
      header: 'Duration',
      cell: ({ row }) => `${row.original.durationMinutes} min`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge className={statusStyles[status] || ''} variant="outline">
            {status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const booking = row.original
        const canCancel = booking.status === 'REQUESTED'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBooking(booking)
                  setDetailsOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setCancelId(booking.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: initialData.bookings,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      const params = new URLSearchParams(searchParams.toString())
      if (newSorting.length) {
        params.set('sortBy', newSorting[0].id)
        params.set('sortOrder', newSorting[0].desc ? 'desc' : 'asc')
      } else {
        params.delete('sortBy')
        params.delete('sortOrder')
      }
      params.set('page', '1')
      router.push(`/dashboard/my-video-bookings?${params.toString()}`)
    },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleCancel = async () => {
    if (!cancelId) return
    const result = await cancelBooking(cancelId)
    if (result.success) {
      toast.success('Booking cancelled')
      setCancelId(null)
      router.refresh()
    } else {
      toast.error('Failed to cancel booking')
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No bookings found. Book your first video consultation!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {initialData.page} of {initialData.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={initialData.page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', String(initialData.page - 1))
              router.push(`/dashboard/my-video-bookings?${params.toString()}`)
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={initialData.page >= initialData.totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', String(initialData.page + 1))
              router.push(`/dashboard/my-video-bookings?${params.toString()}`)
            }}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Booking Details Drawer */}
      {selectedBooking && (
        <BookingDetailsDrawer
          booking={selectedBooking}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Yes, cancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}