'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuditLog } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, SortingState, getSortedRowModel } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate, formatTime } from '@/lib/utils'
import { AuditDetailsDrawer } from './AuditDetailsDrawer'
import { Eye } from 'lucide-react'

type AuditLogWithAdmin = AuditLog & {
  admin: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
}

interface AuditTableProps {
  logs: AuditLogWithAdmin[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export function AuditTable({ logs, totalCount, pageCount, currentPage, pageSize }: AuditTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedLog, setSelectedLog] = useState<AuditLogWithAdmin | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const columns: ColumnDef<AuditLogWithAdmin>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatDate(row.original.createdAt)}</span>
          <span className="text-xs text-muted-foreground">{formatTime(row.original.createdAt)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'admin.fullName',
      header: 'Admin',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={row.original.admin.avatarUrl || ''} />
            <AvatarFallback>{row.original.admin.fullName?.charAt(0) || row.original.admin.email.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.admin.fullName || '—'}</span>
            <span className="text-xs text-muted-foreground">{row.original.admin.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge>,
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.entity}</span>,
    },
    {
      accessorKey: 'entityId',
      header: 'Entity ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.entityId ? row.original.entityId.slice(0, 8) + '...' : '—'}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(row.original); setDetailsOpen(true); }}>
          <Eye className="h-4 w-4 mr-2" /> View
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: logs,
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
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total {totalCount} log(s)</div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pageCount}>
            Next
          </Button>
        </div>
      </div>

      {/* Details Drawer */}
      <AuditDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        log={selectedLog}
      />
    </>
  )
}