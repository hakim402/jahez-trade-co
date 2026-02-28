'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { toast } from 'sonner' // 👈 Import from sonner
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { updateUserRole } from './actions'

interface UpdateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any // UserWithStats
  onSuccess: () => void
}

export function UpdateRoleDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UpdateRoleDialogProps) {
  const [role, setRole] = useState<UserRole>(user?.role)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateUserRole(user.id, role)
      toast.success('Role updated', {
        description: `${user.fullName || 'User'} is now ${role}`,
      })
      onSuccess()
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to update role',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change user role</DialogTitle>
          <DialogDescription>
            Update the role for {user?.fullName || user?.email}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRole).map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || role === user?.role}
          >
            {loading ? 'Updating...' : 'Update role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}