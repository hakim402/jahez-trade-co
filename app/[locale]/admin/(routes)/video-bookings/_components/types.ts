import { VideoBooking, AvailabilitySlot, User, BookingStatusHistory } from '@prisma/client'

export type BookingWithRelations = VideoBooking & {
  client: Pick<User, 'id' | 'email' | 'fullName'>
  slot: AvailabilitySlot | null
  statusHistory: (BookingStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}