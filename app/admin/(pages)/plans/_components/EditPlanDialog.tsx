'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { updatePlan } from '../actions'

interface EditPlanDialogProps {
  plan: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPlanDialog({ plan, open, onOpenChange }: EditPlanDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('id', plan.id)

    try {
      const result = await updatePlan(formData)
      if (result.success) {
        toast.success('Plan updated')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error('Failed to update plan')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Convert features array back to newline-separated string for editing
  const featuresText = Array.isArray(plan.features) ? plan.features.join('\n') : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update plan details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (enum)</Label>
                <Input id="name" name="name" defaultValue={plan.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" defaultValue={plan.displayName} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={plan.description || ''} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={plan.price} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue={plan.currency} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                name="features"
                rows={4}
                defaultValue={featuresText}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="isPopular" name="isPopular" defaultChecked={plan.isPopular} />
              <Label htmlFor="isPopular">Mark as popular</Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stripePriceId">Stripe Price ID (optional)</Label>
              <Input id="stripePriceId" name="stripePriceId" defaultValue={plan.stripePriceId || ''} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}