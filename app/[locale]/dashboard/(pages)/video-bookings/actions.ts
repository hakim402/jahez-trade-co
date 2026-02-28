'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { BookingStatus, BookingType } from '@prisma/client'

const createBookingSchema = z.object({
  slotId: z.string().min(1),
  requestNotes: z.string().optional().nullable(),
})

type GetBookingsParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: BookingStatus
  type?: BookingType
}

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

  const where = { userId, ...(status && { status }) }
  const bookings = await prisma.videoBooking.findMany({
    where: {
      ...where,
      supplier: type ? { type } : undefined,
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      supplier: true,
      slot: true,
    },
  })

  const total = await prisma.videoBooking.count({ where })

  return {
    bookings,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getBookingDetails(bookingId: string) {
  const userId = await getCurrentUserId()
  const booking = await prisma.videoBooking.findFirst({
    where: { id: bookingId, userId },
    include: {
      supplier: true,
      slot: true,
    },
  })
  if (!booking) throw new Error('Booking not found')
  return booking
}

export async function getAvailableLocations(type: BookingType) {
  const now = new Date()
  const suppliers = await prisma.supplier.findMany({
    where: {
      type,
      status: 'ACTIVE',
      availabilitySlots: {
        some: {
          startTime: { gte: now },
          bookingId: null,
        },
      },
    },
    select: { location: true },
    distinct: ['location'],
  })
  return suppliers.map(s => s.location)
}

export async function getAvailableSlots(type: BookingType, location: string) {
  const now = new Date()
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      supplier: {
        type,
        location,
        status: 'ACTIVE',
      },
      startTime: { gte: now },
      bookingId: null,
    },
    include: {
      supplier: true,
    },
    orderBy: { startTime: 'asc' },
  })
  return slots
}

export async function createBooking(formData: FormData) {
  const userId = await getCurrentUserId()
  const rawData = {
    slotId: formData.get('slotId') as string,
    requestNotes: formData.get('requestNotes') as string | null,
  }
  const validated = createBookingSchema.parse(rawData)

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: validated.slotId },
    include: { supplier: true },
  })
  if (!slot || slot.bookingId || slot.startTime < new Date()) {
    throw new Error('Selected slot is no longer available')
  }

  const booking = await prisma.$transaction(async (tx) => {
    const booking = await tx.videoBooking.create({
      data: {
        userId,
        supplierId: slot.supplierId,
        requestNotes: validated.requestNotes,
        durationMinutes: slot.durationMinutes,
        scheduledAt: slot.startTime,
        status: 'REQUESTED',
        slotId: slot.id,
      },
    })

    await tx.availabilitySlot.update({
      where: { id: slot.id },
      data: { bookingId: booking.id },
    })

    return booking
  })

  revalidatePath('/dashboard/my-video-bookings')
  return { success: true, bookingId: booking.id }
}

export async function cancelBooking(bookingId: string) {
  const userId = await getCurrentUserId()
  const booking = await prisma.videoBooking.findFirst({
    where: { id: bookingId, userId },
    include: { slot: true },
  })
  if (!booking) throw new Error('Booking not found')
  if (booking.status !== 'REQUESTED') {
    throw new Error('Cannot cancel this booking after it has been scheduled')
  }

  await prisma.$transaction(async (tx) => {
    await tx.videoBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELED' },
    })
    if (booking.slotId) {
      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { bookingId: null },
      })
    }
  })

  revalidatePath('/dashboard/my-video-bookings')
  return { success: true }
}