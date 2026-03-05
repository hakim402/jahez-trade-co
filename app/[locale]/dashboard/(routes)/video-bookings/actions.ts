'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { BookingStatus, BookingType } from '@prisma/client'
import { PLAN_BOOKING_LIMITS } from './_components/types'

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
  return admins.map((a) => a.id)
}

// ------------------------------------------------------------------
// getUserPlanInfo — respects BILLING_ENABLED env var
// ------------------------------------------------------------------
export async function getUserPlanInfo(userId: string) {
  const billingEnabled = process.env.BILLING_ENABLED === 'true'

  const usedCount = await prisma.videoBooking.count({
    where: { clientId: userId, isDeleted: false },
  })

  if (!billingEnabled) {
    return {
      planName: 'unlimited',
      limit: Infinity,
      usedCount,
      hasAccess: true,
      billingEnabled: false,
    }
  }

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

  const activeItem = user?.subscription?.items[0]
  if (!activeItem?.plan) {
    const limit = PLAN_BOOKING_LIMITS['free'] ?? 1
    return {
      planName: 'free',
      limit,
      usedCount,
      hasAccess: usedCount < limit,
      billingEnabled: true,
    }
  }

  const planName = activeItem.plan.name.toLowerCase()
  const limit = PLAN_BOOKING_LIMITS[planName] ?? 1

  return {
    planName,
    limit,
    usedCount,
    hasAccess: limit === Infinity || usedCount < limit,
    billingEnabled: true,
  }
}

// ------------------------------------------------------------------
// getUserBookingContext — single call for page.tsx
// ------------------------------------------------------------------
export async function getUserBookingContext() {
  try {
    const clerkId = (await auth()).userId
    if (!clerkId) return { success: false as const, error: 'Unauthorized' }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, isActive: true, isDeleted: true },
    })
    if (!user || user.isDeleted || !user.isActive || user.role !== 'CLIENT') {
      return { success: false as const, error: 'Forbidden' }
    }

    const [planInfo, kpiCounts] = await Promise.all([
      getUserPlanInfo(user.id),
      prisma.videoBooking.groupBy({
        by: ['status'],
        where: { clientId: user.id, isDeleted: false },
        _count: { _all: true },
      }),
    ])

    const kpi = { total: 0, pending: 0, confirmed: 0, completed: 0 }
    for (const row of kpiCounts) {
      kpi.total += row._count._all
      if (row.status === 'REQUESTED' || row.status === 'PROPOSED') kpi.pending += row._count._all
      if (row.status === 'CONFIRMED') kpi.confirmed += row._count._all
      if (row.status === 'COMPLETED') kpi.completed += row._count._all
    }

    return { success: true as const, data: { planInfo, kpi } }
  } catch {
    return { success: false as const, error: 'Failed to load context' }
  }
}

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------
const createBookingSchema = z.object({
  type:            z.nativeEnum(BookingType).default('CUSTOM'),
  requestNotes:    z.string().max(2000).optional(),
  durationMinutes: z.coerce.number().int().positive().default(30),
  preferredTime:   z.date().optional(),
})

type CreateBookingInput = z.infer<typeof createBookingSchema>

const getMyBookingsSchema = z.object({
  page:     z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status:   z.nativeEnum(BookingStatus).optional(),
})

// ------------------------------------------------------------------
// createBooking
// ------------------------------------------------------------------
export async function createBooking(input: CreateBookingInput) {
  try {
    const clientId = await requireClient()
    const validated = createBookingSchema.parse(input)

    const planInfo = await getUserPlanInfo(clientId)
    if (!planInfo.hasAccess) {
      return {
        success: false as const,
        error: planInfo.billingEnabled
          ? `UPGRADE_REQUIRED: Your ${planInfo.planName} plan allows ${planInfo.limit} video booking${planInfo.limit === 1 ? '' : 's'}. Please upgrade to request more.`
          : 'Booking limit reached.',
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.create({
        data: {
          clientId,
          type:            validated.type,
          requestNotes:    validated.requestNotes,
          durationMinutes: validated.durationMinutes,
          scheduledAt:     validated.preferredTime,
          status:          'REQUESTED',
        },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId:   booking.id,
          oldStatus:   'REQUESTED',
          newStatus:   'REQUESTED',
          changedById: clientId,
        },
      })

      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId:    adminId,
            title:     'New Video Booking Request',
            message:   'A client has requested a video call.',
            type:      'NEW_BOOKING_REQUEST',
            bookingId: booking.id,
          })),
        })
      }

      return booking
    })

    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: 'Failed to create booking' }
  }
}

// ------------------------------------------------------------------
// getMyBookings
// ------------------------------------------------------------------
export async function getMyBookings(filters: z.infer<typeof getMyBookingsSchema>) {
  try {
    const clientId = await requireClient()
    const { page, pageSize, status } = getMyBookingsSchema.parse(filters)
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
            include: {
              changedBy: { select: { id: true, email: true, fullName: true } },
            },
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
      success: true as const,
      data: {
        bookings,
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid filters' }
    return { success: false as const, error: 'Failed to fetch bookings' }
  }
}

// ------------------------------------------------------------------
// confirmScheduledBooking
// ------------------------------------------------------------------
export async function confirmScheduledBooking(input: { bookingId: string }) {
  try {
    const clientId = await requireClient()
    const bookingId = z.string().cuid().parse(input.bookingId)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where: { id: bookingId, isDeleted: false },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.clientId !== clientId) throw new Error('Unauthorized')
      if (booking.status !== 'PROPOSED') throw new Error('Booking must be in PROPOSED status to confirm')

      const updated = await tx.videoBooking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED', clientConfirmedAt: new Date() },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId:   updated.id,
          oldStatus:   'PROPOSED',
          newStatus:   'CONFIRMED',
          changedById: clientId,
        },
      })

      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId:    adminId,
            title:     'Booking Confirmed',
            message:   'A client has confirmed their video call.',
            type:      'BOOKING_CONFIRMED',
            bookingId: updated.id,
          })),
        })
      }

      return updated
    })

    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to confirm booking',
    }
  }
}

// ------------------------------------------------------------------
// cancelMyBooking
// ------------------------------------------------------------------
export async function cancelMyBooking(input: { bookingId: string }) {
  try {
    const clientId = await requireClient()
    const bookingId = z.string().cuid().parse(input.bookingId)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where: { id: bookingId, isDeleted: false },
        include: { slot: true },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.clientId !== clientId) throw new Error('Unauthorized')
      if (!['REQUESTED', 'PROPOSED'].includes(booking.status)) {
        throw new Error('Only REQUESTED or PROPOSED bookings can be cancelled')
      }

      const oldStatus = booking.status

      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { isBooked: false },
        })
        await tx.videoBooking.update({
          where: { id: bookingId },
          data: { slot: { disconnect: true } },
        })
      }

      const updated = await tx.videoBooking.update({
        where: { id: bookingId },
        data: { status: 'CANCELED' },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId:   updated.id,
          oldStatus,
          newStatus:   'CANCELED',
          changedById: clientId,
        },
      })

      const adminIds = await getAllAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId:    adminId,
            title:     'Booking Cancelled',
            message:   'A client has cancelled their video call.',
            type:      'BOOKING_CANCELLED',
            bookingId: updated.id,
          })),
        })
      }

      return updated
    })

    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to cancel booking',
    }
  }
}