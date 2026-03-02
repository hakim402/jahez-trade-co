'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { softDeleteMyRequest } from '../actions'
import { ConfirmDialog } from './ConfirmDialog'
import { RequestDetailsDialog } from './RequestDetailsDialog'
import { formatDate } from '@/lib/utils'
import type { ClientRequestWithRelations } from './types'

const statusColorMap: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  QUOTED: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PRODUCTION: 'bg-orange-100 text-orange-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
}

interface RequestsTableProps {
  requests: ClientRequestWithRelations[]
  onActionComplete: () => void
}

export function RequestsTable({ requests, onActionComplete }: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<ClientRequestWithRelations | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!requestToDelete) return
    const result = await softDeleteMyRequest(requestToDelete)
    if (result.success) {
      toast.success('Request deleted', { description: 'Your request has been deleted.' })
      onActionComplete()
    } else {
      toast.error('Error', { description: result.error })
    }
    setDeleteConfirmOpen(false)
    setRequestToDelete(null)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product Link</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-xs">{request.id.slice(0, 8)}</TableCell>
                <TableCell className="max-w-50 truncate">
                  <a
                    href={request.productLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {request.productLink || '—'}
                  </a>
                </TableCell>
                <TableCell>{request.quantity}</TableCell>
                <TableCell>
                  <Badge className={statusColorMap[request.status]}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      {request.status === 'SUBMITTED' && (
                        <DropdownMenuItem
                          onClick={() => {
                            setRequestToDelete(request.id)
                            setDeleteConfirmOpen(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RequestDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        request={selectedRequest}
        onActionComplete={onActionComplete}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Request"
        description="Are you sure you want to delete this request? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}