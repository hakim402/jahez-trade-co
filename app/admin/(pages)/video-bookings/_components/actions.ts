'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { BookingStatus, BookingType } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-guard'
import { logAdminAction } from '@/lib/audit'

// ---------- BOOKINGS ----------
export async function getBookings({
  page = 1,
  pageSize = 10,
  sortBy = 'scheduledAt',
  sortOrder = 'desc',
  status,
  type,
  search,
  from,
  to,
}: {
  page?: number
  pageSize?: number
  sortBy?: 'scheduledAt' | 'createdAt' | 'status' | 'user.fullName'
  sortOrder?: 'asc' | 'desc'
  status?: BookingStatus
  type?: BookingType
  search?: string
  from?: Date
  to?: Date
}) {
  await requireAdmin()

  const skip = (page - 1) * pageSize
  const where: any = {}

  if (status) where.status = status
  if (type) where.type = type
  if (search) {
    where.OR = [
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { location: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (from || to) {
    where.scheduledAt = {}
    if (from) where.scheduledAt.gte = from
    if (to) where.scheduledAt.lte = to
  }

  // Handle sorting by user field
  let orderBy: any = {}
  if (sortBy === 'user.fullName') {
    orderBy = { user: { fullName: sortOrder } }
  } else {
    orderBy = { [sortBy]: sortOrder }
  }

  const [bookings, totalCount] = await Promise.all([
    prisma.videoBooking.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        slot: true,
        payment: true,
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.videoBooking.count({ where }),
  ])

  return { bookings, totalCount, pageCount: Math.ceil(totalCount / pageSize) }
}

export async function getBookingById(bookingId: string) {
  await requireAdmin()
  return prisma.videoBooking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
      slot: true,
      payment: true,
    },
  })
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  meetingLink?: string,
  adminNotes?: string
) {
  await requireAdmin()
  const booking = await prisma.videoBooking.update({
    where: { id: bookingId },
    data: { status, meetingLink, adminNotes },
  })
  await logAdminAction({
    action: 'UPDATE_BOOKING_STATUS',
    entity: 'VideoBooking',
    entityId: bookingId,
    changes: { status, meetingLink, adminNotes },
  })
  revalidatePath('/admin/video-bookings')
  return booking
}

// ---------- AVAILABILITY SLOTS ----------
export async function getAvailabilitySlots({
  page = 1,
  pageSize = 20,
  sortBy = 'startTime',
  sortOrder = 'asc',
  type,
  location,
  isAvailable,
  from,
  to,
}: {
  page?: number
  pageSize?: number
  sortBy?: 'startTime' | 'createdAt' | 'location'
  sortOrder?: 'asc' | 'desc'
  type?: BookingType
  location?: string
  isAvailable?: boolean
  from?: Date
  to?: Date
}) {
  await requireAdmin()

  const skip = (page - 1) * pageSize
  const where: any = {}

  if (type) where.type = type
  if (location) where.location = { contains: location, mode: 'insensitive' }
  if (isAvailable !== undefined) where.isAvailable = isAvailable
  if (from || to) {
    where.startTime = {}
    if (from) where.startTime.gte = from
    if (to) where.startTime.lte = to
  }

  const [slots, totalCount] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where,
      include: { booking: { include: { user: { select: { fullName: true, email: true } } } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
    }),
    prisma.availabilitySlot.count({ where }),
  ])

  return { slots, totalCount, pageCount: Math.ceil(totalCount / pageSize) }
}

export async function getSlotById(slotId: string) {
  await requireAdmin()
  return prisma.availabilitySlot.findUnique({
    where: { id: slotId },
    include: { booking: { include: { user: true } } },
  })
}

export async function createAvailabilitySlot(data: {
  type: BookingType
  location: string
  startTime: Date
  endTime?: Date
  durationMinutes?: number
}) {
  await requireAdmin()
  const slot = await prisma.availabilitySlot.create({
    data: {
      type: data.type,
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes || 30,
      isAvailable: true,
    },
  })
  await logAdminAction({
    action: 'CREATE_SLOT',
    entity: 'AvailabilitySlot',
    entityId: slot.id,
    changes: data,
  })
  revalidatePath('/admin/video-bookings/slots')
  return slot
}

export async function updateAvailabilitySlot(
  slotId: string,
  data: Partial<{
    type: BookingType
    location: string
    startTime: Date
    endTime?: Date
    durationMinutes: number
    isAvailable: boolean
  }>
) {
  await requireAdmin()
  const slot = await prisma.availabilitySlot.update({
    where: { id: slotId },
    data,
  })
  await logAdminAction({
    action: 'UPDATE_SLOT',
    entity: 'AvailabilitySlot',
    entityId: slotId,
    changes: data,
  })
  revalidatePath('/admin/video-bookings/slots')
  return slot
}

export async function deleteAvailabilitySlot(slotId: string) {
  await requireAdmin()
  await prisma.availabilitySlot.delete({ where: { id: slotId } })
  await logAdminAction({
    action: 'DELETE_SLOT',
    entity: 'AvailabilitySlot',
    entityId: slotId,
  })
  revalidatePath('/admin/video-bookings/slots')
}