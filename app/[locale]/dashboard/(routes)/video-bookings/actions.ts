// app/[locale]/dashboard/(routes)/video-bookings/actions.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { BookingStatus, BookingType } from '@prisma/client'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true, isActive: true, isDeleted: true },
  })

  if (!user || user.isDeleted || !user.isActive) throw new Error('User not found or inactive')
  if (user.role !== 'CLIENT') throw new Error('Forbidden')
  return user.id
}

async function getAllAdminIds() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isDeleted: false, isActive: true },
    select: { id: true },
  })
  return admins.map(a => a.id)
}

/**
 * Returns the user's active plan and the corresponding video booking limit.
 * Plan names are assumed to be stored in Clerk and synced to the Plan model.
 * Adjust the mapping to match your actual plan names.
 */
async function getUserVideoBookingLimits(userId: string): Promise<{ planName: string; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        include: {
          items: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
          },
        },
      },
    },
  })

  // Default to no plan (limit 0) if no active subscription
  if (!user?.subscription || user.subscription.items.length === 0) {
    return { planName: 'NONE', limit: 0 }
  }

  // Assume the first active item represents the plan
  const plan = user.subscription.items[0].plan
  if (!plan) return { planName: 'UNKNOWN', limit: 0 }

  // Map plan name to video booking limit – adjust to your exact plan names
  const limitMap: Record<string, number> = {
    free: 0,   // basic plan: 3 video bookings allowed
    pro: 0,     // pro plan: 5 video bookings allowed
    vip: Infinity, // vip: unlimited
  }
  const planName = plan.name.toLowerCase()
  const limit = limitMap[planName] ?? 0
  return { planName, limit }
}

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------
const createBookingSchema = z.object({
  requestNotes: z.string().optional(),
  type: z.nativeEnum(BookingType).default('CUSTOM'),
  durationMinutes: z.number().int().positive().default(30),
  preferredTime: z.date().optional(),
})

const getMyBookingsFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status: z.nativeEnum(BookingStatus).optional(),
})

const confirmBookingSchema = z.object({
  bookingId: z.string().cuid(),
})

const cancelMyBookingSchema = z.object({
  bookingId: z.string().cuid(),
})

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------
export async function createBooking(input: z.infer<typeof createBookingSchema>) {
  try {
    const clientId = await requireClient()
    const validated = createBookingSchema.parse(input)

    // Check subscription limits (unchanged)
    const { planName, limit } = await getUserVideoBookingLimits(clientId)
    if (limit === 0) {
      return { success: false, error: 'No active subscription or plan not recognized' }
    }
    if (limit !== Infinity) {
      const existingCount = await prisma.videoBooking.count({
        where: { clientId, isDeleted: false },
      })
      if (existingCount >= limit) {
        return {
          success: false,
          error: `Your ${planName} plan allows only ${limit} active video bookings. Please upgrade or cancel some bookings.`,
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.create({
        data: {
          clientId,
          type: validated.type,                // <-- use validated.type
          requestNotes: validated.requestNotes,
          durationMinutes: validated.durationMinutes,
          scheduledAt: validated.preferredTime,
          status: 'REQUESTED',
        },
      })

      // Status history (initial)
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          oldStatus: 'REQUESTED',
          newStatus: 'REQUESTED',
          changedById: clientId,
        },
      })

      // Notify all admins (unchanged)
      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId: adminId,
            title: 'New Video Booking Request',
            message: 'A client has requested a video call.',
            type: 'NEW_BOOKING_REQUEST',
            bookingId: booking.id,
          })),
        })
      }

      return booking
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: 'Failed to create booking' }
  }
}

export async function getMyBookings(filters: z.infer<typeof getMyBookingsFilterSchema>) {
  try {
    const clientId = await requireClient()
    const validated = getMyBookingsFilterSchema.parse(filters)

    const { page, pageSize, status } = validated
    const skip = (page - 1) * pageSize

    const where = {
      clientId,
      isDeleted: false,
      ...(status && { status }),
    }

    const [bookings, totalCount] = await prisma.$transaction([
      prisma.videoBooking.findMany({
        where,
        include: {
          slot: true,
          statusHistory: {
            include: { changedBy: { select: { id: true, email: true, fullName: true } } },
            orderBy: { changedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.videoBooking.count({ where }),
    ])

    return {
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid filters' }
    }
    return { success: false, error: 'Failed to fetch bookings' }
  }
}

export async function confirmScheduledBooking(input: z.infer<typeof confirmBookingSchema>) {
  try {
    const clientId = await requireClient()
    const validated = confirmBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where: { id: validated.bookingId, isDeleted: false },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.clientId !== clientId) throw new Error('Unauthorized')
      if (booking.status !== 'PROPOSED') throw new Error('Booking must be in PROPOSED status to confirm')

      const updatedBooking = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: {
          status: 'CONFIRMED',
          clientConfirmedAt: new Date(), // record confirmation time
        },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: updatedBooking.id,
          oldStatus: 'PROPOSED',
          newStatus: 'CONFIRMED',
          changedById: clientId,
        },
      })

      // Notify all admins
      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId: adminId,
            title: 'Booking Confirmed',
            message: 'A client has confirmed their video call.',
            type: 'BOOKING_CONFIRMED',
            bookingId: updatedBooking.id,
          })),
        })
      }

      return updatedBooking
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to confirm booking' }
  }
}

export async function cancelMyBooking(input: z.infer<typeof cancelMyBookingSchema>) {
  try {
    const clientId = await requireClient()
    const validated = cancelMyBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where: { id: validated.bookingId, isDeleted: false },
        include: { slot: true },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.clientId !== clientId) throw new Error('Unauthorized')
      if (booking.status !== 'REQUESTED' && booking.status !== 'PROPOSED') {
        throw new Error('Booking can only be cancelled if it is REQUESTED or PROPOSED')
      }

      const oldStatus = booking.status

      // If a slot was assigned, free it
      if (booking.slotId) {
        // Mark slot as free
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { isBooked: false },
        })
        // Disconnect slot from booking (slotId set to null)
        await tx.videoBooking.update({
          where: { id: validated.bookingId },
          data: { slot: { disconnect: true } },
        })
      }

      // Update booking status to CANCELED (slot already disconnected above)
      const updatedBooking = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: { status: 'CANCELED' },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: updatedBooking.id,
          oldStatus,
          newStatus: 'CANCELED',
          changedById: clientId,
        },
      })

      // Notify admins
      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map(adminId => ({
            userId: adminId,
            title: 'Booking Cancelled',
            message: 'A client has cancelled their video call.',
            type: 'BOOKING_CANCELLED',
            bookingId: updatedBooking.id,
          })),
        })
      }

      return updatedBooking
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel booking' }
  }
}