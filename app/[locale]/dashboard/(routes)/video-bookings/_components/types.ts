import { VideoBooking, AvailabilitySlot, User, BookingStatusHistory } from '@prisma/client'

export type ClientBookingWithRelations = VideoBooking & {
  slot: AvailabilitySlot | null
  statusHistory: (BookingStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}