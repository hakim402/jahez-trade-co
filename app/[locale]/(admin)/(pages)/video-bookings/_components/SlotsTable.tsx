'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AvailabilitySlot } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, SortingState, getSortedRowModel } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { SlotFormDialog } from './SlotFormDialog'
import { DeleteSlotDialog } from './DeleteSlotDialog'

type SlotWithBooking = AvailabilitySlot & {
  booking?: { user: { fullName: string | null; email: string } } | null
}

interface SlotsTableProps {
  slots: SlotWithBooking[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export function SlotsTable({ slots, totalCount, pageCount, currentPage, pageSize }: SlotsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBooking | null>(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const columns: ColumnDef<SlotWithBooking>[] = [
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
      accessorKey: 'startTime',
      header: 'Start',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatDate(row.original.startTime)}</span>
          <span className="text-xs text-muted-foreground">{formatTime(row.original.startTime)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'endTime',
      header: 'End',
      cell: ({ row }) =>
        row.original.endTime ? (
          <div className="flex flex-col">
            <span>{formatDate(row.original.endTime)}</span>
            <span className="text-xs text-muted-foreground">{formatTime(row.original.endTime)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'durationMinutes',
      header: 'Duration',
      cell: ({ row }) => `${row.original.durationMinutes} min`,
    },
    {
      accessorKey: 'isAvailable',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isAvailable ? 'default' : 'secondary'}>
          {row.original.isAvailable ? 'Available' : 'Booked'}
        </Badge>
      ),
    },
    {
      accessorKey: 'booking',
      header: 'Booked By',
      cell: ({ row }) => {
        const booking = row.original.booking
        return booking ? (
          <div className="flex flex-col">
            <span className="font-medium">{booking.user.fullName || '—'}</span>
            <span className="text-xs text-muted-foreground">{booking.user.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
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
            <DropdownMenuItem onClick={() => { setSelectedSlot(row.original); setFormDialogOpen(true); }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => { setSelectedSlot(row.original); setDeleteDialogOpen(true); }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: slots,
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
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
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
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No slots found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total {totalCount} slot(s)</div>
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
      <SlotFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        
        onSuccess={() => { setFormDialogOpen(false); router.refresh(); }}
      />
      <DeleteSlotDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        slot={selectedSlot}
        onSuccess={() => { setDeleteDialogOpen(false); router.refresh(); }}
      />
    </>
  )
}