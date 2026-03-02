// app/[locale]/admin/(routes)/video-bookings/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { z } from 'zod'
import { BookingStatus, MeetingProvider, Prisma } from '@prisma/client'

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------
const getAllBookingsFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status: z.nativeEnum(BookingStatus).optional(),
  clientEmail: z.string().email().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
})

const scheduleBookingSchema = z.object({
  bookingId: z.string().cuid(),
  slotId: z.string().cuid(),
  meetingLink: z.string().url(),
  meetingProvider: z.nativeEnum(MeetingProvider).optional(),
  adminNotes: z.string().optional(),
})

const completeBookingSchema = z.object({
  bookingId: z.string().cuid(),
  transcriptUrl: z.string().url().optional(),
  aiSummary: z.string().optional(),
})

const cancelBookingSchema = z.object({
  bookingId: z.string().cuid(),
  reason: z.string().optional(),
})

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------
export async function getAllBookings(filters: z.infer<typeof getAllBookingsFilterSchema>) {
  try {
    await requireAdmin()
    const validated = getAllBookingsFilterSchema.parse(filters)

    const { page, pageSize, status, clientEmail, dateFrom, dateTo } = validated
    const skip = (page - 1) * pageSize

    // Build where clause incrementally to avoid type errors
    const where: Prisma.VideoBookingWhereInput = {
      isDeleted: false,
      client: {
        isDeleted: false,
        isActive: true,
      },
    }

    if (status) {
      where.status = status
    }

    if (clientEmail) {
      // Override client condition with email filter while preserving base filters
      where.client = {
        isDeleted: false,
        isActive: true,
        email: { contains: clientEmail, mode: 'insensitive' },
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const [bookings, totalCount] = await prisma.$transaction([
      prisma.videoBooking.findMany({
        where,
        include: {
          client: { select: { id: true, email: true, fullName: true } },
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

export async function getAvailableSlots() {
  try {
    await requireAdmin()

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        booking: null,   // no booking attached (relation filter)
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    })

    return { success: true, data: slots }
  } catch {
    return { success: false, error: 'Failed to fetch slots' }
  }
}

export async function scheduleBooking(input: z.infer<typeof scheduleBookingSchema>) {
  try {
    const adminId = await requireAdmin()
    const validated = scheduleBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      // Lock the slot to prevent concurrent assignments
      await tx.$queryRaw`SELECT * FROM "AvailabilitySlot" WHERE id = ${validated.slotId} FOR UPDATE`

      const slot = await tx.availabilitySlot.findUnique({
        where: { id: validated.slotId },
        include: { booking: true }, // include the booking relation to check if already attached
      })
      if (!slot || !slot.isActive || slot.booking) {
        throw new Error('Slot is not available')
      }

      const booking = await tx.videoBooking.findUnique({
        where: { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.status !== 'REQUESTED') throw new Error('Booking must be in REQUESTED status')

      // Update booking
      const updatedBooking = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: {
          status: 'PROPOSED',
          scheduledAt: slot.startTime,
          meetingLink: validated.meetingLink,
          meetingProvider: validated.meetingProvider,
          handledById: adminId,
          slotId: validated.slotId,
          ...(validated.adminNotes && { requestNotes: validated.adminNotes }),
        },
        include: { client: true },
      })

      // Mark slot as booked
      await tx.availabilitySlot.update({
        where: { id: validated.slotId },
        data: { isBooked: true },
      })

      // Status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: updatedBooking.id,
          oldStatus: 'REQUESTED',
          newStatus: 'PROPOSED',
          changedById: adminId,
        },
      })

      // Notify client
      await tx.notification.create({
        data: {
          userId: updatedBooking.client.id,
          title: 'Video Call Scheduled',
          message: `Your video call has been scheduled for ${slot.startTime.toLocaleString()}. Please confirm.`,
          type: 'BOOKING_SCHEDULED',
          bookingId: updatedBooking.id,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'SCHEDULE_BOOKING',
          entity: 'VideoBooking',
          entityId: updatedBooking.id,
          changes: {
            oldStatus: 'REQUESTED',
            newStatus: 'PROPOSED',
            slotId: validated.slotId,
            scheduledAt: slot.startTime,
          },
        },
      })

      return updatedBooking
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule booking' }
  }
}

export async function completeBooking(input: z.infer<typeof completeBookingSchema>) {
  try {
    const adminId = await requireAdmin()
    const validated = completeBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where: { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.status !== 'PROPOSED' && booking.status !== 'CONFIRMED') {
        throw new Error('Booking must be in PROPOSED or CONFIRMED status to complete')
      }

      const updatedBooking = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: {
          status: 'COMPLETED',
          transcriptUrl: validated.transcriptUrl,
          aiSummary: validated.aiSummary,
        },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: updatedBooking.id,
          oldStatus: booking.status,
          newStatus: 'COMPLETED',
          changedById: adminId,
        },
      })

      await tx.notification.create({
        data: {
          userId: booking.client.id,
          title: 'Video Call Completed',
          message: 'Your video call has been marked as completed.',
          type: 'BOOKING_COMPLETED',
          bookingId: updatedBooking.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'COMPLETE_BOOKING',
          entity: 'VideoBooking',
          entityId: updatedBooking.id,
          changes: { oldStatus: booking.status, newStatus: 'COMPLETED' },
        },
      })

      return updatedBooking
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to complete booking' }
  }
}

export async function cancelBookingByAdmin(input: z.infer<typeof cancelBookingSchema>) {
  try {
    const adminId = await requireAdmin()
    const validated = cancelBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where: { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.status === 'COMPLETED' || booking.status === 'CANCELED') {
        throw new Error('Booking cannot be cancelled')
      }

      const oldStatus = booking.status

      // If a slot was assigned, free it
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { isBooked: false },
        })
      }

      // Disconnect slot and set status to CANCELED
      const updatedBooking = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: {
          status: 'CANCELED',
          slot: booking.slotId ? { disconnect: true } : undefined,
        },
      })

      // Status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: updatedBooking.id,
          oldStatus,
          newStatus: 'CANCELED',
          changedById: adminId,
        },
      })

      // Notify client
      await tx.notification.create({
        data: {
          userId: booking.client.id,
          title: 'Video Call Cancelled',
          message: `Your video call has been cancelled by admin.${validated.reason ? ` Reason: ${validated.reason}` : ''}`,
          type: 'BOOKING_CANCELLED',
          bookingId: updatedBooking.id,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'CANCEL_BOOKING',
          entity: 'VideoBooking',
          entityId: updatedBooking.id,
          changes: { oldStatus, newStatus: 'CANCELED', reason: validated.reason },
        },
      })

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