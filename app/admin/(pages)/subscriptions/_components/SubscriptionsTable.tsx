'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Subscription } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, SortingState, getSortedRowModel } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Pencil, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { UpdateSubscriptionDialog } from './UpdateSubscriptionDialog'
import { SubscriptionDetailsDrawer } from './SubscriptionDetailsDrawer'

type SubscriptionWithUser = Subscription & {
  user: { fullName: string | null; email: string; avatarUrl: string | null }
}

interface SubscriptionsTableProps {
  subscriptions: SubscriptionWithUser[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export function SubscriptionsTable({ subscriptions, totalCount, pageCount, currentPage, pageSize }: SubscriptionsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedSub, setSelectedSub] = useState<SubscriptionWithUser | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)

  const columns: ColumnDef<SubscriptionWithUser>[] = [
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
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => <Badge variant="outline">{row.original.plan}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variantMap: Record<string, string> = {
          ACTIVE: 'default',
          PAST_DUE: 'destructive',
          CANCELED: 'secondary',
          INCOMPLETE: 'outline',
          TRIALING: 'default',
        }
        return <Badge variant={variantMap[status] as any}>{status}</Badge>
      },
    },
    {
      accessorKey: 'currentPeriodStart',
      header: 'Current Period',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs">From {formatDate(row.original.currentPeriodStart)}</span>
          <span className="text-xs">To {formatDate(row.original.currentPeriodEnd)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'cancelAtPeriodEnd',
      header: 'Cancel at period end',
      cell: ({ row }) => (row.original.cancelAtPeriodEnd ? <Badge variant="destructive">Yes</Badge> : <Badge variant="secondary">No</Badge>),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
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
            <DropdownMenuItem onClick={() => { setSelectedSub(row.original); setDetailsOpen(true); }}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelectedSub(row.original); setUpdateDialogOpen(true); }}>
              <Pencil className="mr-2 h-4 w-4" /> Update status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {/* Stripe sync placeholder */}}>
              <RefreshCw className="mr-2 h-4 w-4" /> Sync from Stripe
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: subscriptions,
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
                  No subscriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total {totalCount} subscription(s)</div>
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
      {selectedSub && (
        <UpdateSubscriptionDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          subscription={selectedSub}
          onSuccess={() => { setUpdateDialogOpen(false); router.refresh(); }}
        />
      )}
      <SubscriptionDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        subscriptionId={selectedSub?.id ?? ''}
      />
    </>
  )
}