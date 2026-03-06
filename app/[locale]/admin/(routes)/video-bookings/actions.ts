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
  page:        z.number().int().positive().default(1),
  pageSize:    z.number().int().positive().max(100).default(20),
  status:      z.nativeEnum(BookingStatus).optional(),
  clientEmail: z.string().optional(),
  dateFrom:    z.date().optional(),
  dateTo:      z.date().optional(),
})

const scheduleBookingSchema = z.object({
  bookingId:       z.string().cuid(),
  slotId:          z.string().cuid(),
  meetingLink:     z.string().url(),
  meetingPassword: z.string().optional(),
  meetingProvider: z.nativeEnum(MeetingProvider).optional(),
})

const completeBookingSchema = z.object({
  bookingId:    z.string().cuid(),
  transcriptUrl: z.string().url().optional().or(z.literal('')),
  aiSummary:    z.string().optional(),
})

const cancelBookingSchema = z.object({
  bookingId: z.string().cuid(),
  reason:    z.string().optional(),
})

const markNoShowSchema = z.object({
  bookingId: z.string().cuid(),
})

// Slot schemas
const createSlotSchema = z.object({
  startTime:       z.date(),
  endTime:         z.date(),
  durationMinutes: z.coerce.number().int().positive().default(30),
})

const deleteSlotSchema = z.object({
  slotId: z.string().cuid(),
})

const toggleSlotActiveSchema = z.object({
  slotId:   z.string().cuid(),
  isActive: z.boolean(),
})

// ------------------------------------------------------------------
// getAdminBookingContext — KPI + page data in one call
// ------------------------------------------------------------------
export async function getAdminBookingContext() {
  try {
    await requireAdmin()

    const [kpiCounts, availableSlotCount] = await Promise.all([
      prisma.videoBooking.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { _all: true },
      }),
      prisma.availabilitySlot.count({
        where: { isBooked: false, isActive: true },
      }),
    ])

    const kpi = {
      total: 0, requested: 0, proposed: 0,
      confirmed: 0, completed: 0, canceled: 0,
    }
    for (const row of kpiCounts) {
      kpi.total += row._count._all
      if (row.status === 'REQUESTED')  kpi.requested  += row._count._all
      if (row.status === 'PROPOSED')   kpi.proposed   += row._count._all
      if (row.status === 'CONFIRMED')  kpi.confirmed  += row._count._all
      if (row.status === 'COMPLETED')  kpi.completed  += row._count._all
      if (row.status === 'CANCELED')   kpi.canceled   += row._count._all
    }

    return { success: true as const, data: { kpi, availableSlotCount } }
  } catch {
    return { success: false as const, error: 'Failed to load context' }
  }
}

// ------------------------------------------------------------------
// getAllBookings
// ------------------------------------------------------------------
export async function getAllBookings(filters: z.infer<typeof getAllBookingsFilterSchema>) {
  try {
    await requireAdmin()
    const { page, pageSize, status, clientEmail, dateFrom, dateTo } =
      getAllBookingsFilterSchema.parse(filters)
    const skip = (page - 1) * pageSize

    const where: Prisma.VideoBookingWhereInput = {
      isDeleted: false,
      client:    { isDeleted: false, isActive: true },
    }

    if (status) where.status = status

    if (clientEmail) {
      where.client = {
        isDeleted: false, isActive: true,
        email: { contains: clientEmail, mode: 'insensitive' },
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo)   where.createdAt.lte = dateTo
    }

    const [bookings, totalCount] = await prisma.$transaction([
      prisma.videoBooking.findMany({
        where,
        include: {
          client: { select: { id: true, email: true, fullName: true } },
          slot:   true,
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
// getAvailableSlots — for schedule dialog dropdown
// ------------------------------------------------------------------
export async function getAvailableSlots() {
  try {
    await requireAdmin()
    const slots = await prisma.availabilitySlot.findMany({
      where:   { booking: null, isActive: true },
      orderBy: { startTime: 'asc' },
    })
    return { success: true as const, data: slots }
  } catch {
    return { success: false as const, error: 'Failed to fetch slots' }
  }
}

// ------------------------------------------------------------------
// getAllSlots — for slot manager
// ------------------------------------------------------------------
export async function getAllSlots(page = 1, pageSize = 20) {
  try {
    await requireAdmin()
    const skip = (page - 1) * pageSize

    const [slots, totalCount] = await prisma.$transaction([
      prisma.availabilitySlot.findMany({
        include: {
          booking:   { select: { id: true, status: true } },
          createdBy: { select: { id: true, email: true, fullName: true } },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.availabilitySlot.count(),
    ])

    return {
      success: true as const,
      data: {
        slots,
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch {
    return { success: false as const, error: 'Failed to fetch slots' }
  }
}

// ------------------------------------------------------------------
// createSlot
// ------------------------------------------------------------------
export async function createSlot(input: z.infer<typeof createSlotSchema>) {
  try {
    const adminId  = await requireAdmin()
    const validated = createSlotSchema.parse(input)

    if (validated.endTime <= validated.startTime) {
      return { success: false as const, error: 'End time must be after start time' }
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        startTime:       validated.startTime,
        endTime:         validated.endTime,
        durationMinutes: validated.durationMinutes,
        createdById:     adminId,
      },
    })

    return { success: true as const, data: slot }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: 'Failed to create slot' }
  }
}

// ------------------------------------------------------------------
// deleteSlot — only if not booked
// ------------------------------------------------------------------
export async function deleteSlot(input: z.infer<typeof deleteSlotSchema>) {
  try {
    await requireAdmin()
    const { slotId } = deleteSlotSchema.parse(input)

    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { booking: { select: { id: true } } },
    })
    if (!slot) return { success: false as const, error: 'Slot not found' }
    if (slot.booking) return { success: false as const, error: 'Cannot delete a slot that has a booking assigned' }

    await prisma.availabilitySlot.delete({ where: { id: slotId } })
    return { success: true as const }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to delete slot' }
  }
}

// ------------------------------------------------------------------
// toggleSlotActive
// ------------------------------------------------------------------
export async function toggleSlotActive(input: z.infer<typeof toggleSlotActiveSchema>) {
  try {
    await requireAdmin()
    const { slotId, isActive } = toggleSlotActiveSchema.parse(input)

    const slot = await prisma.availabilitySlot.update({
      where: { id: slotId },
      data:  { isActive },
    })
    return { success: true as const, data: slot }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: 'Failed to update slot' }
  }
}

// ------------------------------------------------------------------
// scheduleBooking
// ------------------------------------------------------------------
export async function scheduleBooking(input: z.infer<typeof scheduleBookingSchema>) {
  try {
    const adminId  = await requireAdmin()
    const validated = scheduleBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      // Row-level lock on the slot
      await tx.$queryRaw`SELECT id FROM "AvailabilitySlot" WHERE id = ${validated.slotId} FOR UPDATE`

      const slot = await tx.availabilitySlot.findUnique({
        where:   { id: validated.slotId },
        include: { booking: true },
      })
      if (!slot || !slot.isActive || slot.booking) {
        throw new Error('Slot is not available')
      }

      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error('Booking not found')
      if (booking.status !== 'REQUESTED') throw new Error('Booking must be in REQUESTED status')

      const updated = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: {
          status:          'PROPOSED',
          scheduledAt:     slot.startTime,
          meetingLink:     validated.meetingLink,
          meetingPassword: validated.meetingPassword,
          meetingProvider: validated.meetingProvider,
          handledById:     adminId,
          slotId:          validated.slotId,
        },
        include: { client: true },
      })

      await tx.availabilitySlot.update({
        where: { id: validated.slotId },
        data:  { isBooked: true },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId:   updated.id,
          oldStatus:   'REQUESTED',
          newStatus:   'PROPOSED',
          changedById: adminId,
        },
      })

      await tx.notification.create({
        data: {
          userId:    updated.client.id,
          title:     'Video Call Scheduled',
          message:   `Your video call has been scheduled for ${slot.startTime.toLocaleString()}. Please confirm.`,
          type:      'BOOKING_SCHEDULED',
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   'SCHEDULE_BOOKING',
          entity:   'VideoBooking',
          entityId: updated.id,
          changes:  { oldStatus: 'REQUESTED', newStatus: 'PROPOSED', slotId: validated.slotId, scheduledAt: slot.startTime },
        },
      })

      return updated
    })

    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to schedule booking' }
  }
}

// ------------------------------------------------------------------
// completeBooking
// ------------------------------------------------------------------
export async function completeBooking(input: z.infer<typeof completeBookingSchema>) {
  try {
    const adminId  = await requireAdmin()
    const validated = completeBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error('Booking not found')
      if (!['PROPOSED', 'CONFIRMED'].includes(booking.status)) {
        throw new Error('Booking must be PROPOSED or CONFIRMED to complete')
      }

      const updated = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: {
          status:        'COMPLETED',
          transcriptUrl: validated.transcriptUrl || null,
          aiSummary:     validated.aiSummary || null,
        },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId:   updated.id,
          oldStatus:   booking.status,
          newStatus:   'COMPLETED',
          changedById: adminId,
        },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     'Video Call Completed',
          message:   'Your video call has been marked as completed.',
          type:      'BOOKING_COMPLETED',
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   'COMPLETE_BOOKING',
          entity:   'VideoBooking',
          entityId: updated.id,
          changes:  { oldStatus: booking.status, newStatus: 'COMPLETED' },
        },
      })

      return updated
    })

    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to complete booking' }
  }
}

// ------------------------------------------------------------------
// cancelBookingByAdmin
// ------------------------------------------------------------------
export async function cancelBookingByAdmin(input: z.infer<typeof cancelBookingSchema>) {
  try {
    const adminId  = await requireAdmin()
    const validated = cancelBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error('Booking not found')
      if (['COMPLETED', 'CANCELED'].includes(booking.status)) {
        throw new Error('Booking cannot be cancelled')
      }

      const oldStatus = booking.status

      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data:  { isBooked: false },
        })
      }

      const updated = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data: {
          status: 'CANCELED',
          slot:   booking.slotId ? { disconnect: true } : undefined,
        },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId:   updated.id,
          oldStatus,
          newStatus:   'CANCELED',
          changedById: adminId,
        },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     'Video Call Cancelled',
          message:   `Your video call has been cancelled.${validated.reason ? ` Reason: ${validated.reason}` : ''}`,
          type:      'BOOKING_CANCELLED',
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   'CANCEL_BOOKING',
          entity:   'VideoBooking',
          entityId: updated.id,
          changes:  { oldStatus, newStatus: 'CANCELED', reason: validated.reason },
        },
      })

      return updated
    })

    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to cancel booking' }
  }
}

// ------------------------------------------------------------------
// markNoShow
// ------------------------------------------------------------------
export async function markNoShow(input: z.infer<typeof markNoShowSchema>) {
  try {
    const adminId  = await requireAdmin()
    const validated = markNoShowSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error('Booking not found')
      if (!['PROPOSED', 'CONFIRMED'].includes(booking.status)) {
        throw new Error('Booking must be PROPOSED or CONFIRMED to mark as no-show')
      }

      const updated = await tx.videoBooking.update({
        where: { id: validated.bookingId },
        data:  { status: 'NO_SHOW' },
      })

      await tx.bookingStatusHistory.create({
        data: {
          bookingId:   updated.id,
          oldStatus:   booking.status,
          newStatus:   'NO_SHOW',
          changedById: adminId,
        },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     'Missed Video Call',
          message:   'You missed your scheduled video call.',
          type:      'BOOKING_NO_SHOW',
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   'MARK_NO_SHOW',
          entity:   'VideoBooking',
          entityId: updated.id,
          changes:  { oldStatus: booking.status, newStatus: 'NO_SHOW' },
        },
      })

      return updated
    })

    return { success: true as const, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false as const, error: 'Invalid input' }
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to mark no-show' }
  }
}