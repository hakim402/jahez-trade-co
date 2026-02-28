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
import { formatDate, formatCurrency, truncate } from '@/lib/utils'
import { cancelRequest } from '../actions'
import { RequestDetailsDrawer } from './RequestDetailsDrawer'
import { EditRequestDialog } from './EditRequestDialog'
import { toast } from 'sonner'
import { MoreHorizontal, Eye, Pencil, XCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RequestsTableProps {
  initialData: {
    requests: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

const statusStyles: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  QUOTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  IN_PRODUCTION: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  SHIPPED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export default function RequestsTable({ initialData }: RequestsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    return sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []
  })
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'productLink',
      header: 'Product',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.productLink
            ? truncate(row.original.productLink, 30)
            : `Request #${row.original.id.slice(-6)}`}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
    },
    {
      accessorKey: 'shippingCountry',
      header: 'Country',
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'quotes',
      header: 'Latest Quote',
      cell: ({ row }) => {
        const quote = row.original.quotes?.[0]
        return quote ? formatCurrency(quote.price, quote.currency) : '—'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original
        const canEdit = request.status === 'SUBMITTED'
        const canCancel = request.status === 'SUBMITTED'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                id={`actions-${request.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRequest(request)
                  setDetailsOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRequest(request)
                    setEditOpen(true)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setCancelId(request.id)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Request
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
    data: initialData.requests,
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
      router.push(`/dashboard/my-requests?${params.toString()}`)
    },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleCancel = async () => {
    if (!cancelId) return
    const result = await cancelRequest(cancelId)
    if (result.success) {
      toast.success('Request cancelled')
      setCancelId(null)
      router.refresh()
    } else {
      toast.error('Failed to cancel request')
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  No requests found. Create your first request!
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
              router.push(`/dashboard/my-requests?${params.toString()}`)
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
              router.push(`/dashboard/my-requests?${params.toString()}`)
            }}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Request Details Drawer */}
      {selectedRequest && (
        <RequestDetailsDrawer
          request={selectedRequest}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {/* Edit Request Dialog */}
      {selectedRequest && (
        <EditRequestDialog
          request={selectedRequest}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this request? This action cannot be undone.
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