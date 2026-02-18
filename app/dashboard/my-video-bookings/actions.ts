'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { BookingStatus, BookingType } from '@prisma/client'

// ----------------------------------------------------------------------
// Validation Schemas
// ----------------------------------------------------------------------
const createBookingSchema = z.object({
  slotId: z.string().min(1),
  type: z.nativeEnum(BookingType),
  location: z.string().min(1),
  scheduledAt: z.string().datetime(), // ISO string from the slot
  durationMinutes: z.coerce.number().int().positive().default(30),
})

// ----------------------------------------------------------------------
// Types for params
// ----------------------------------------------------------------------
type GetBookingsParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: BookingStatus
  type?: BookingType
}

// ----------------------------------------------------------------------
// Helper: get current user ID
// ----------------------------------------------------------------------
async function getCurrentUserId() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) throw new Error('User not found')
  return user.id
}

// ----------------------------------------------------------------------
// Get user's bookings with pagination, sorting, filtering
// ----------------------------------------------------------------------
export async function getUserBookings(params: GetBookingsParams = {}) {
  const userId = await getCurrentUserId()
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'scheduledAt',
    sortOrder = 'desc',
    status,
    type,
  } = params

  const where = { userId, ...(status && { status }), ...(type && { type }) }
  const total = await prisma.videoBooking.count({ where })

  const bookings = await prisma.videoBooking.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      payment: true,
      slot: true, // now works because relation is defined
    },
  })

  return {
    bookings,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ----------------------------------------------------------------------
// Get single booking details
// ----------------------------------------------------------------------
export async function getBookingDetails(bookingId: string) {
  const userId = await getCurrentUserId()
  const booking = await prisma.videoBooking.findFirst({
    where: { id: bookingId, userId },
    include: {
      payment: true,
      slot: true,
    },
  })
  if (!booking) throw new Error('Booking not found')
  return booking
}

// ----------------------------------------------------------------------
// Get available slots for a given type and location (for booking form)
// ----------------------------------------------------------------------
export async function getAvailableSlots(type: BookingType, location: string) {
  const now = new Date()
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      type,
      location,
      isAvailable: true,
      startTime: { gte: now },
      bookingId: null, // not booked
    },
    orderBy: { startTime: 'asc' },
  })
  return slots
}

// ----------------------------------------------------------------------
// Get distinct locations that have available slots for a given type
// ----------------------------------------------------------------------
export async function getAvailableLocations(type: BookingType) {
  const now = new Date()
  const locations = await prisma.availabilitySlot.findMany({
    where: {
      type,
      isAvailable: true,
      startTime: { gte: now },
      bookingId: null,
    },
    select: { location: true },
    distinct: ['location'],
  })
  return locations.map(l => l.location)
}

// ----------------------------------------------------------------------
// Create new booking – with race condition safety
// ----------------------------------------------------------------------
export async function createBooking(formData: FormData) {
  const userId = await getCurrentUserId()
  const rawData = {
    slotId: formData.get('slotId') as string,
    type: formData.get('type') as BookingType,
    location: formData.get('location') as string,
    scheduledAt: formData.get('scheduledAt') as string,
    durationMinutes: formData.get('durationMinutes'),
  }
  const validated = createBookingSchema.parse(rawData)

  // Verify the slot exists and is still available
  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: validated.slotId },
  })
  if (!slot || !slot.isAvailable || slot.bookingId) {
    throw new Error('Selected slot is no longer available')
  }

  // 👇 NEW: Ensure the slot matches the selected type/location (security)
  if (slot.type !== validated.type || slot.location !== validated.location) {
    throw new Error('Slot does not match selected type or location')
  }

  // Create booking and link slot in a transaction with safety check
  const booking = await prisma.$transaction(async (tx) => {
    const booking = await tx.videoBooking.create({
      data: {
        userId,
        type: validated.type,
        location: validated.location,
        scheduledAt: new Date(validated.scheduledAt),
        durationMinutes: validated.durationMinutes,
        status: 'PENDING',
        slotId: validated.slotId,
      },
    })

    // Atomically mark slot as booked only if it's still free
    const updatedSlot = await tx.availabilitySlot.updateMany({
      where: {
        id: validated.slotId,
        bookingId: null, // ensures no one else booked it
      },
      data: {
        isAvailable: false,
        bookingId: booking.id,
      },
    })

    if (updatedSlot.count === 0) {
      throw new Error('Slot was already taken')
    }

    return booking
  })

  revalidatePath('/dashboard/my-video-bookings')
  return { success: true, bookingId: booking.id }
}



// ----------------------------------------------------------------------
// Cancel booking (only if status is PENDING or CONFIRMED)
// ----------------------------------------------------------------------
export async function cancelBooking(bookingId: string) {
  const userId = await getCurrentUserId()
  const booking = await prisma.videoBooking.findFirst({
    where: { id: bookingId, userId },
    include: { slot: true },
  })
  if (!booking) throw new Error('Booking not found')
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new Error('Cannot cancel this booking')
  }

  await prisma.$transaction(async (tx) => {
    await tx.videoBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELED' },
    })
    // Free up the slot if it exists
    if (booking.slotId) {
      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { isAvailable: true, bookingId: null },
      })
    }
  })

  revalidatePath('/dashboard/my-video-bookings')
  return { success: true }
}