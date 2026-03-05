// app/[locale]/admin/(routes)/video-slots/_components/SlotsTable.tsx
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
import { MoreHorizontal, Edit, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleSlotActive, deleteSlot } from '../actions'
import { ConfirmDialog } from './ConfirmDialog'
import { EditSlotDialog } from './EditSlotDialog'
import { formatDate, formatTime } from '@/lib/utils'
import type { Slot } from './types'

interface SlotsTableProps {
  slots: Slot[]
  onActionComplete: () => void
}

export function SlotsTable({ slots, onActionComplete }: SlotsTableProps) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null)

  const handleToggleActive = async (slot: Slot) => {
    const newStatus = !slot.isActive
    const result = await toggleSlotActive({ slotId: slot.id, isActive: newStatus })
    if (result.success) {
      toast.success(`Slot ${newStatus ? 'activated' : 'deactivated'}`, {
        description: `The slot has been ${newStatus ? 'activated' : 'deactivated'}.`,
      })
      onActionComplete()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  const handleDelete = async () => {
    if (!slotToDelete) return
    const result = await deleteSlot(slotToDelete)
    if (result.success) {
      toast.success('Slot deleted', { description: 'The slot has been permanently deleted.' })
      onActionComplete()
    } else {
      toast.error('Error', { description: result.error })
    }
    setDeleteConfirmOpen(false)
    setSlotToDelete(null)
  }

  const isSlotEditable = (slot: Slot) => !slot.isBooked

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell>
                  {formatDate(slot.startTime)} {formatTime(slot.startTime)}
                </TableCell>
                <TableCell>
                  {formatDate(slot.endTime)} {formatTime(slot.endTime)}
                </TableCell>
                <TableCell>{slot.durationMinutes} min</TableCell>
                <TableCell>
                  <Badge variant={slot.isActive ? 'default' : 'secondary'}>
                    {slot.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {slot.isBooked ? (
                    <Badge variant="outline" className="bg-blue-50">
                      {slot.booking?.client.fullName || 'Booked'}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{slot.createdBy.fullName}</div>
                    <div className="text-muted-foreground">{slot.createdBy.email}</div>
                  </div>
                </TableCell>
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
                          setSelectedSlot(slot)
                          setIsEditOpen(true)
                        }}
                        disabled={!isSlotEditable(slot)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(slot)}
                        disabled={slot.isBooked && slot.isActive} // can't deactivate booked slot
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {slot.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSlotToDelete(slot.id)
                          setDeleteConfirmOpen(true)
                        }}
                        disabled={slot.isBooked}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditSlotDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        slot={selectedSlot}
        onSuccess={onActionComplete}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Slot"
        description="Are you sure you want to permanently delete this slot? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}