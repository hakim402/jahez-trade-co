'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoBooking } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, SortingState, getSortedRowModel } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Pencil, Calendar } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { UpdateBookingDialog } from './UpdateBookingDialog'
import { BookingDetailsDrawer } from './BookingDetailsDrawer'

type BookingWithRelations = VideoBooking & {
  user: { fullName: string | null; email: string }
  slot: any
  payment: any
}

interface BookingsTableProps {
  bookings: BookingWithRelations[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export function BookingsTable({ bookings, totalCount, pageCount, currentPage, pageSize }: BookingsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)

  const columns: ColumnDef<BookingWithRelations>[] = [
    {
      accessorKey: 'user.fullName',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.user.fullName || '—'}</span>
          <span className="text-xs text-muted-foreground">{row.original.user.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: 'location',
      header: 'Location',
    },
    {
      accessorKey: 'scheduledAt',
      header: 'Scheduled',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatDate(row.original.scheduledAt)}</span>
          <span className="text-xs text-muted-foreground">{formatTime(row.original.scheduledAt)}</span>
        </div>
      ),
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
        const variantMap: Record<string, string> = {
          PENDING: 'secondary',
          CONFIRMED: 'default',
          COMPLETED: 'default',
          CANCELED: 'destructive',
        }
        return <Badge variant={variantMap[status] as any}>{status}</Badge>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { setSelectedBooking(row.original); setDetailsOpen(true); }}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedBooking(row.original); setUpdateDialogOpen(true); }}>
              <Pencil className="mr-2 h-4 w-4" /> Update status
            </DropdownMenuItem>
            {row.original.meetingLink && (
              <DropdownMenuItem onClick={() => row.original.meetingLink && window.open(row.original.meetingLink, '_blank')}>
                <Calendar className="mr-2 h-4 w-4" /> Join meeting
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: bookings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  })

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
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
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  No bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total {totalCount} booking(s)</div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pageCount}>
            Next
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <UpdateBookingDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        booking={selectedBooking}
        onSuccess={() => { setUpdateDialogOpen(false); router.refresh(); }}
      />
      <BookingDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        bookingId={selectedBooking?.id ?? null}
      />
    </>
  )
}