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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'
import { SubscriptionDetailsDrawer } from './SubscriptionDetailsDrawer'
import { MoreHorizontal, Eye, XCircle } from 'lucide-react'

interface SubscriptionsTableProps {
  initialData: {
    items: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  CANCELED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  UPCOMING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ENDED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  ABANDONED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  PAST_DUE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

export default function SubscriptionsTable({ initialData }: SubscriptionsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    return sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []
  })
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.planName}
          {row.original.isDefaultPlan && (
            <Badge variant="outline" className="ml-2">Free</Badge>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge className={statusStyles[status] || ''} variant="outline">
            {status.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'currentPeriodStart',
      header: 'Start Date',
      cell: ({ row }) => (row.original.currentPeriodStart ? formatDate(row.original.currentPeriodStart) : '—'),
    },
    {
      accessorKey: 'currentPeriodEnd',
      header: 'End Date',
      cell: ({ row }) => (row.original.currentPeriodEnd ? formatDate(row.original.currentPeriodEnd) : '—'),
    },
    {
      accessorKey: 'trialEndsAt',
      header: 'Trial Ends',
      cell: ({ row }) => (row.original.trialEndsAt ? formatDate(row.original.trialEndsAt) : '—'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original
        const canCancel = ['ACTIVE', 'PAST_DUE', 'INCOMPLETE'].includes(item.status)

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
                  setSelectedItem(item)
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
                    onClick={() => {
                      setSelectedItem(item)
                      setCancelOpen(true)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Subscription
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
    data: initialData.items,
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
      router.push(`/dashboard/my-subscriptions?${params.toString()}`)
    },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
                  No subscriptions found.
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
              router.push(`/dashboard/my-subscriptions?${params.toString()}`)
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
              router.push(`/dashboard/my-subscriptions?${params.toString()}`)
            }}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Subscription Details Drawer */}
      {selectedItem && (
        <SubscriptionDetailsDrawer
          item={selectedItem}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

    </>
  )
}