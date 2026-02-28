'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { createBooking, getAvailableSlots, getAvailableLocations } from '../actions'
import { BookingType } from '@prisma/client'

interface CreateBookingDialogProps {
  children: React.ReactNode
}

export function CreateBookingDialog({ children }: CreateBookingDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [type, setType] = useState<BookingType>(BookingType.MARKET)
  const [location, setLocation] = useState('')
  const [locations, setLocations] = useState<string[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [requestNotes, setRequestNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingLocations, setFetchingLocations] = useState(false)
  const [fetchingSlots, setFetchingSlots] = useState(false)

  useEffect(() => {
    if (!open) {
      setStep(1)
      setType(BookingType.MARKET)
      setLocation('')
      setLocations([])
      setSlots([])
      setSelectedSlot('')
      setRequestNotes('')
    }
  }, [open])

  useEffect(() => {
    if (open && type) {
      setFetchingLocations(true)
      setLocation('')
      getAvailableLocations(type)
        .then(setLocations)
        .catch((error) => {
          console.error(error)
          toast.error('Failed to load locations')
        })
        .finally(() => setFetchingLocations(false))
    }
  }, [open, type])

  useEffect(() => {
    if (step === 2 && type && location) {
      setFetchingSlots(true)
      getAvailableSlots(type, location)
        .then(setSlots)
        .catch((error) => {
          console.error(error)
          toast.error('Failed to load available slots')
        })
        .finally(() => setFetchingSlots(false))
    }
  }, [step, type, location])

  const handleNext = () => {
    if (!type || !location) {
      toast.error('Please select type and location')
      return
    }
    setStep(2)
  }

  const handleBack = () => setStep(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) {
      toast.error('Please select a time slot')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.set('slotId', selectedSlot)
    if (requestNotes) formData.set('requestNotes', requestNotes)

    try {
      const result = await createBooking(formData)
      if (result.success) {
        toast.success('Booking requested successfully')
        setOpen(false)
        router.refresh()
      } else {
        toast.error('Failed to create booking')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Book a Video Consultation</DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Select the type and location for your consultation.'
                : 'Choose an available time slot and add any notes.'}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Consultation Type</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v: string) => setType(v as BookingType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={BookingType.MARKET} id="market" />
                    <Label htmlFor="market">Market</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={BookingType.FACTORY} id="factory" />
                    <Label htmlFor="factory">Factory</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={location}
                  onValueChange={setLocation}
                  disabled={fetchingLocations || locations.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        fetchingLocations
                          ? 'Loading locations...'
                          : locations.length === 0
                          ? 'No locations available'
                          : 'Select a location'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!fetchingLocations && locations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No available slots for this type at the moment.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 py-4">
              {fetchingSlots ? (
                <div className="text-center py-4">Loading available slots...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No available slots for this type and location.
                </div>
              ) : (
                <>
                  <div className="grid gap-2 max-h-75 overflow-y-auto">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 border rounded cursor-pointer ${
                          selectedSlot === slot.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedSlot(slot.id)}
                      >
                        <div>
                          <p className="font-medium">
                            {format(new Date(slot.startTime), 'EEEE, MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(slot.startTime), 'h:mm a')} - {slot.durationMinutes} min
                          </p>
                        </div>
                        <div className="text-sm font-medium">{slot.supplier.name}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requestNotes">Additional Notes (optional)</Label>
                    <Textarea
                      id="requestNotes"
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      placeholder="Any specific questions or requirements..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {step === 2 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!type || !location || fetchingLocations}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={loading || !selectedSlot}>
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}