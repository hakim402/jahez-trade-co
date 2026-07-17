"use server"

// app/[locale]/admin/(routes)/video-bookings/actions.ts

import { prisma }         from "@/lib/prisma"
import { requireAdmin }   from "@/lib/admin-guard"
import { z }              from "zod"
import { BookingStatus, MeetingProvider, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type SerializedSlot = {
  id:              string
  startTime:       string
  endTime:         string
  durationMinutes: number
  createdById:     string
  isBooked:        boolean
  isActive:        boolean
  createdAt:       string
  updatedAt:       string
  booking?:        { id: string; status: BookingStatus } | null
  createdBy?:      { id: string; email: string; fullName: string | null }
}

export type SerializedStatusHistory = {
  id:         string
  bookingId:  string
  oldStatus:  BookingStatus
  newStatus:  BookingStatus
  changedAt:  string
  changedBy:  { id: string; email: string; fullName: string | null }
}

export type SerializedAdminBooking = {
  id:               string
  clientId:         string
  type:             string
  requestNotes:     string | null
  durationMinutes:  number
  status:           BookingStatus
  handledById:      string | null
  scheduledAt:      string | null
  meetingProvider:  MeetingProvider | null
  meetingLink:      string | null
  meetingPassword:  string | null
  clientConfirmedAt:string | null
  transcriptUrl:    string | null
  aiSummary:        string | null
  isDeleted:        boolean
  slotId:           string | null
  createdAt:        string
  updatedAt:        string
  client:           { id: string; email: string; fullName: string | null }
  slot:             SerializedSlot | null
  statusHistory:    SerializedStatusHistory[]
}

export type AdminBookingKpi = {
  total:     number
  requested: number
  proposed:  number
  confirmed: number
  completed: number
  canceled:  number
}

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// Using z.coerce.date() throughout — accepts both Date objects and ISO strings
// from form inputs / JSON requests.
// ─────────────────────────────────────────────────────────────────────────────

const getAllBookingsFilterSchema = z.object({
  page:        z.number().int().positive().default(1),
  pageSize:    z.number().int().positive().max(100).default(20),
  status:      z.nativeEnum(BookingStatus).optional(),
  clientEmail: z.string().optional(),
  dateFrom:    z.coerce.date().optional(),    // was z.date() — rejects ISO strings
  dateTo:      z.coerce.date().optional(),
})

const scheduleBookingSchema = z.object({
  bookingId:       z.string().cuid(),
  slotId:          z.string().cuid(),
  meetingLink:     z.string().url("Meeting link must be a valid URL"),
  meetingPassword: z.string().optional(),
  meetingProvider: z.nativeEnum(MeetingProvider).optional(),
})

const rescheduleBookingSchema = z.object({
  bookingId:       z.string().cuid(),
  slotId:          z.string().cuid(),
  meetingLink:     z.string().url("Meeting link must be a valid URL"),
  meetingPassword: z.string().optional(),
  meetingProvider: z.nativeEnum(MeetingProvider).optional(),
})

const completeBookingSchema = z.object({
  bookingId:     z.string().cuid(),
  transcriptUrl: z.string().url().optional().or(z.literal("")),
  aiSummary:     z.string().max(5000).optional(),
})

const cancelBookingSchema = z.object({
  bookingId: z.string().cuid(),
  reason:    z.string().max(500).optional(),
})

const markNoShowSchema = z.object({
  bookingId: z.string().cuid(),
})

const createSlotSchema = z.object({
  startTime:       z.coerce.date(),           // was z.date() — rejects ISO strings
  endTime:         z.coerce.date(),
  durationMinutes: z.coerce.number().int().positive().default(30),
})

const deleteSlotSchema = z.object({
  slotId: z.string().cuid(),
})

const toggleSlotActiveSchema = z.object({
  slotId:   z.string().cuid(),
  isActive: z.boolean(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Serializers — Date → ISO string. Prevents React hydration mismatches
// when booking objects are passed to client components.
// ─────────────────────────────────────────────────────────────────────────────

function serializeSlot(s: any): SerializedSlot {
  return {
    ...s,
    startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
    endTime:   s.endTime   instanceof Date ? s.endTime.toISOString()   : s.endTime,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  }
}

function serializeHistoryEntry(h: any): SerializedStatusHistory {
  return {
    ...h,
    changedAt: h.changedAt instanceof Date ? h.changedAt.toISOString() : h.changedAt,
  }
}

function serializeAdminBooking(b: any): SerializedAdminBooking {
  return {
    ...b,
    scheduledAt:       b.scheduledAt       instanceof Date ? b.scheduledAt.toISOString()       : b.scheduledAt,
    clientConfirmedAt: b.clientConfirmedAt instanceof Date ? b.clientConfirmedAt.toISOString() : b.clientConfirmedAt,
    createdAt:         b.createdAt         instanceof Date ? b.createdAt.toISOString()         : b.createdAt,
    updatedAt:         b.updatedAt         instanceof Date ? b.updatedAt.toISOString()         : b.updatedAt,
    slot:              b.slot ? serializeSlot(b.slot) : null,
    statusHistory:     (b.statusHistory ?? []).map(serializeHistoryEntry),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared include — used by all booking queries
// ─────────────────────────────────────────────────────────────────────────────

const bookingInclude = {
  client: { select: { id: true, email: true, fullName: true } },
  slot:   true,
  statusHistory: {
    include:  { changedBy: { select: { id: true, email: true, fullName: true } } },
    orderBy:  { changedAt: "desc" as const },
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Revalidation helper
// ─────────────────────────────────────────────────────────────────────────────

function revalidateBookings() {
  revalidatePath("/admin/video-bookings")
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 1. CONTEXT (KPI + slot count — one call for page.tsx) ────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function getAdminBookingContext(): Promise<ActionResult<{
  kpi:                AdminBookingKpi
  availableSlotCount: number
}>> {
  try {
    await requireAdmin()

    const [kpiCounts, availableSlotCount] = await Promise.all([
      prisma.videoBooking.groupBy({
        by:    ["status"],
        where: { isDeleted: false },
        _count:{ _all: true },
      }),
      prisma.availabilitySlot.count({
        where: { isBooked: false, isActive: true, startTime: { gte: new Date() } },
      }),
    ])

    const kpi: AdminBookingKpi = {
      total: 0, requested: 0, proposed: 0,
      confirmed: 0, completed: 0, canceled: 0,
    }
    for (const row of kpiCounts) {
      kpi.total += row._count._all
      if (row.status === "REQUESTED")  kpi.requested  += row._count._all
      if (row.status === "PROPOSED")   kpi.proposed   += row._count._all
      if (row.status === "CONFIRMED")  kpi.confirmed  += row._count._all
      if (row.status === "COMPLETED")  kpi.completed  += row._count._all
      if (row.status === "CANCELED")   kpi.canceled   += row._count._all
    }

    return { success: true, data: { kpi, availableSlotCount } }
  } catch (err) {
    console.error("[getAdminBookingContext]", err)
    return { success: false, error: "Failed to load context" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 2. READ — BOOKINGS ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function getAllBookings(
  filters: z.infer<typeof getAllBookingsFilterSchema>,
): Promise<ActionResult<{
  bookings:   SerializedAdminBooking[]
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
}>> {
  try {
    await requireAdmin()
    const { page, pageSize, status, clientEmail, dateFrom, dateTo } =
      getAllBookingsFilterSchema.parse(filters)

    const where: Prisma.VideoBookingWhereInput = {
      isDeleted: false,
      client:    { isDeleted: false, isActive: true },
    }

    if (status) where.status = status

    if (clientEmail?.trim()) {
      where.client = {
        isDeleted: false,
        isActive:  true,
        email:     { contains: clientEmail.trim(), mode: "insensitive" },
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo   && { lte: dateTo }),
      }
    }

    const [bookings, totalCount] = await Promise.all([
      prisma.videoBooking.findMany({
        where,
        include: bookingInclude,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      prisma.videoBooking.count({ where }),
    ])

    return {
      success: true,
      data: {
        bookings:   bookings.map(serializeAdminBooking),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[getAllBookings]", err)
    return { success: false, error: "Failed to fetch bookings" }
  }
}

export async function getBookingById(
  bookingId: string,
): Promise<ActionResult<SerializedAdminBooking>> {
  try {
    await requireAdmin()

    const booking = await prisma.videoBooking.findUnique({
      where:   { id: bookingId, isDeleted: false },
      include: bookingInclude,
    })
    if (!booking) return { success: false, error: "Booking not found" }

    return { success: true, data: serializeAdminBooking(booking) }
  } catch (err) {
    console.error("[getBookingById]", err)
    return { success: false, error: "Failed to fetch booking" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 3. READ — SLOTS ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Future, unbooked, active slots — for schedule dialog dropdown.
 */
export async function getAvailableSlots(): Promise<ActionResult<SerializedSlot[]>> {
  try {
    await requireAdmin()

    const slots = await prisma.availabilitySlot.findMany({
      where:   { isBooked: false, isActive: true, startTime: { gte: new Date() } },
      orderBy: { startTime: "asc" },
    })

    return { success: true, data: slots.map(serializeSlot) }
  } catch (err) {
    console.error("[getAvailableSlots]", err)
    return { success: false, error: "Failed to fetch available slots" }
  }
}

/**
 * All slots (paginated) — for the slot manager view.
 */
export async function getAllSlots(
  page     = 1,
  pageSize = 20,
): Promise<ActionResult<{
  slots:      SerializedSlot[]
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
}>> {
  try {
    await requireAdmin()

    const [slots, totalCount] = await Promise.all([
      prisma.availabilitySlot.findMany({
        include: {
          booking:   { select: { id: true, status: true } },
          createdBy: { select: { id: true, email: true, fullName: true } },
        },
        orderBy: { startTime: "desc" },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      prisma.availabilitySlot.count(),
    ])

    return {
      success: true,
      data: {
        slots:      slots.map(serializeSlot),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (err) {
    console.error("[getAllSlots]", err)
    return { success: false, error: "Failed to fetch slots" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 4. SLOT MUTATIONS ────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export async function createSlot(
  input: z.infer<typeof createSlotSchema>,
): Promise<ActionResult<SerializedSlot>> {
  try {
    const adminId   = await requireAdmin()
    const validated = createSlotSchema.parse(input)

    if (validated.endTime <= validated.startTime) {
      return { success: false, error: "End time must be after start time" }
    }
    if (validated.startTime < new Date()) {
      return { success: false, error: "Start time must be in the future" }
    }

    // Check for overlapping slots
    const overlap = await prisma.availabilitySlot.findFirst({
      where: {
        isActive: true,
        AND: [
          { startTime: { lt: validated.endTime } },
          { endTime:   { gt: validated.startTime } },
        ],
      },
    })
    if (overlap) {
      return { success: false, error: "This time slot overlaps with an existing slot" }
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        startTime:       validated.startTime,
        endTime:         validated.endTime,
        durationMinutes: validated.durationMinutes,
        createdById:     adminId,
      },
    })

    await prisma.auditLog.create({
      data: {
        adminId,
        action:   "CREATE_AVAILABILITY_SLOT",
        entity:   "AvailabilitySlot",
        entityId: slot.id,
        changes:  {
          startTime:       validated.startTime.toISOString(),
          endTime:         validated.endTime.toISOString(),
          durationMinutes: validated.durationMinutes,
        } satisfies Prisma.InputJsonValue,
      },
    })

    revalidateBookings()
    return { success: true, data: serializeSlot(slot) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[createSlot]", err)
    return { success: false, error: "Failed to create slot" }
  }
}

/**
 * Deletes a slot — blocked if an active (non-terminal) booking is assigned.
 */
export async function deleteSlot(
  input: z.infer<typeof deleteSlotSchema>,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId   = await requireAdmin()
    const { slotId }= deleteSlotSchema.parse(input)

    const slot = await prisma.availabilitySlot.findUnique({
      where:   { id: slotId },
      include: { booking: { select: { id: true, status: true } } },
    })
    if (!slot) return { success: false, error: "Slot not found" }

    const TERMINAL: BookingStatus[] = ["COMPLETED", "CANCELED", "NO_SHOW", "REJECTED"]
    if (slot.booking && !TERMINAL.includes(slot.booking.status)) {
      return {
        success: false,
        error:   `Cannot delete a slot with an active booking (status: ${slot.booking.status})`,
      }
    }

    await prisma.$transaction([
      prisma.availabilitySlot.delete({ where: { id: slotId } }),
      prisma.auditLog.create({
        data: {
          adminId,
          action:   "DELETE_AVAILABILITY_SLOT",
          entity:   "AvailabilitySlot",
          entityId: slotId,
          changes:  {
            startTime: slot.startTime.toISOString(),
            endTime:   slot.endTime.toISOString(),
          } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidateBookings()
    return { success: true, data: { ok: true } }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[deleteSlot]", err)
    return { success: false, error: "Failed to delete slot" }
  }
}

export async function toggleSlotActive(
  input: z.infer<typeof toggleSlotActiveSchema>,
): Promise<ActionResult<SerializedSlot>> {
  try {
    await requireAdmin()
    const { slotId, isActive } = toggleSlotActiveSchema.parse(input)

    const slot = await prisma.availabilitySlot.update({
      where: { id: slotId },
      data:  { isActive },
    })

    revalidateBookings()
    return { success: true, data: serializeSlot(slot) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[toggleSlotActive]", err)
    return { success: false, error: "Failed to update slot" }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 5. BOOKING MUTATIONS ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Propose a time to the client (REQUESTED → PROPOSED).
 * Uses a row-level lock to prevent double-booking the slot.
 */
export async function scheduleBooking(
  input: z.infer<typeof scheduleBookingSchema>,
): Promise<ActionResult<SerializedAdminBooking>> {
  try {
    const adminId   = await requireAdmin()
    const validated = scheduleBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      // Row-level lock prevents concurrent scheduleBooking calls from
      // grabbing the same slot simultaneously.
      await tx.$queryRaw`
        SELECT id FROM "AvailabilitySlot"
        WHERE id = ${validated.slotId}
        FOR UPDATE
      `

      const slot = await tx.availabilitySlot.findUnique({
        where: { id: validated.slotId },
      })
      if (!slot)           throw new Error("Slot not found")
      if (!slot.isActive)  throw new Error("Slot is not active")
      if (slot.isBooked)   throw new Error("Slot is already booked")
      if (slot.startTime < new Date()) throw new Error("Slot is in the past")

      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking)                    throw new Error("Booking not found")
      if (booking.status !== "REQUESTED") throw new Error("Booking must be REQUESTED to schedule")

      // Release the old slot if the booking was previously linked to one
      if (booking.slotId && booking.slotId !== validated.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data:  { isBooked: false },
        })
      }

      const updated = await tx.videoBooking.update({
        where:   { id: validated.bookingId },
        data: {
          status:          "PROPOSED",
          scheduledAt:     slot.startTime,
          meetingLink:     validated.meetingLink,
          meetingPassword: validated.meetingPassword ?? null,
          meetingProvider: validated.meetingProvider ?? null,
          handledById:     adminId,
          slotId:          validated.slotId,
        },
        include: bookingInclude,
      })

      await tx.availabilitySlot.update({
        where: { id: validated.slotId },
        data:  { isBooked: true },
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId: updated.id, oldStatus: "REQUESTED", newStatus: "PROPOSED", changedById: adminId },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     "Video Call Scheduled",
          message:   `Your video call has been scheduled for ${slot.startTime.toLocaleString()}. Please confirm.`,
          type:      "BOOKING_SCHEDULED",
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   "SCHEDULE_BOOKING",
          entity:   "VideoBooking",
          entityId: updated.id,
          changes:  {
            oldStatus:   "REQUESTED",
            newStatus:   "PROPOSED",
            slotId:      validated.slotId,
            scheduledAt: slot.startTime.toISOString(),   // Date → string for JSON
          } satisfies Prisma.InputJsonValue,
        },
      })

      return updated
    })

    revalidateBookings()
    return { success: true, data: serializeAdminBooking(result) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[scheduleBooking]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to schedule booking" }
  }
}

/**
 * Reschedule a PROPOSED or CONFIRMED booking to a new slot (→ RESCHEDULED).
 * Releases the old slot and locks the new one atomically.
 */
export async function rescheduleBooking(
  input: z.infer<typeof rescheduleBookingSchema>,
): Promise<ActionResult<SerializedAdminBooking>> {
  try {
    const adminId   = await requireAdmin()
    const validated = rescheduleBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "AvailabilitySlot"
        WHERE id = ${validated.slotId}
        FOR UPDATE
      `

      const slot = await tx.availabilitySlot.findUnique({
        where: { id: validated.slotId },
      })
      if (!slot)           throw new Error("Slot not found")
      if (!slot.isActive)  throw new Error("Slot is not active")
      if (slot.isBooked)   throw new Error("Slot is already booked")
      if (slot.startTime < new Date()) throw new Error("Slot is in the past")

      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error("Booking not found")

      const reschedulable: BookingStatus[] = ["PROPOSED", "CONFIRMED"]
      if (!reschedulable.includes(booking.status)) {
        throw new Error(`Only ${reschedulable.join(", ")} bookings can be rescheduled`)
      }

      const oldStatus  = booking.status
      const oldSlotId  = booking.slotId

      // Release old slot
      if (oldSlotId && oldSlotId !== validated.slotId) {
        await tx.availabilitySlot.update({
          where: { id: oldSlotId },
          data:  { isBooked: false },
        })
      }

      const updated = await tx.videoBooking.update({
        where:   { id: validated.bookingId },
        data: {
          status:           "RESCHEDULED",
          scheduledAt:      slot.startTime,
          meetingLink:      validated.meetingLink,
          meetingPassword:  validated.meetingPassword ?? null,
          meetingProvider:  validated.meetingProvider ?? null,
          handledById:      adminId,
          slotId:           validated.slotId,
          clientConfirmedAt:null,   // reset confirmation
        },
        include: bookingInclude,
      })

      await tx.availabilitySlot.update({
        where: { id: validated.slotId },
        data:  { isBooked: true },
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId: updated.id, oldStatus, newStatus: "RESCHEDULED", changedById: adminId },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     "Video Call Rescheduled",
          message:   `Your video call has been rescheduled to ${slot.startTime.toLocaleString()}. Please confirm the new time.`,
          type:      "BOOKING_RESCHEDULED",
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   "RESCHEDULE_BOOKING",
          entity:   "VideoBooking",
          entityId: updated.id,
          changes:  {
            oldStatus:   oldStatus,
            newStatus:   "RESCHEDULED",
            oldSlotId:   oldSlotId ?? null,
            newSlotId:   validated.slotId,
            scheduledAt: slot.startTime.toISOString(),
          } satisfies Prisma.InputJsonValue,
        },
      })

      return updated
    })

    revalidateBookings()
    return { success: true, data: serializeAdminBooking(result) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[rescheduleBooking]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to reschedule booking" }
  }
}

/**
 * Mark a booking as COMPLETED, optionally attaching a transcript and AI summary.
 * Releases the slot so it can be reused or deleted.
 */
export async function completeBooking(
  input: z.infer<typeof completeBookingSchema>,
): Promise<ActionResult<SerializedAdminBooking>> {
  try {
    const adminId   = await requireAdmin()
    const validated = completeBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error("Booking not found")

      const completable: BookingStatus[] = ["PROPOSED", "CONFIRMED"]
      if (!completable.includes(booking.status)) {
        throw new Error(`Booking must be ${completable.join(" or ")} to complete`)
      }

      const oldStatus = booking.status

      // Release the slot so it can be reused or toggled
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data:  { isBooked: false },
        })
      }

      const updated = await tx.videoBooking.update({
        where:   { id: validated.bookingId },
        data: {
          status:        "COMPLETED",
          transcriptUrl: validated.transcriptUrl || null,
          aiSummary:     validated.aiSummary     || null,
          slotId:        null,   // FK nullified — slot is released above
        },
        include: bookingInclude,
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId: updated.id, oldStatus, newStatus: "COMPLETED", changedById: adminId },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     "Video Call Completed",
          message:   "Your video call session has been completed.",
          type:      "BOOKING_COMPLETED",
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   "COMPLETE_BOOKING",
          entity:   "VideoBooking",
          entityId: updated.id,
          changes:  {
            oldStatus,
            newStatus:     "COMPLETED",
            hasTranscript: !!validated.transcriptUrl,
            hasAiSummary:  !!validated.aiSummary,
          } satisfies Prisma.InputJsonValue,
        },
      })

      return updated
    })

    revalidateBookings()
    return { success: true, data: serializeAdminBooking(result) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[completeBooking]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to complete booking" }
  }
}

/**
 * Admin cancels a booking for any reason.
 * Cannot cancel already-terminal bookings (COMPLETED, CANCELED, NO_SHOW, REJECTED).
 */
export async function cancelBookingByAdmin(
  input: z.infer<typeof cancelBookingSchema>,
): Promise<ActionResult<SerializedAdminBooking>> {
  try {
    const adminId   = await requireAdmin()
    const validated = cancelBookingSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error("Booking not found")

      const TERMINAL: BookingStatus[] = ["COMPLETED", "CANCELED", "NO_SHOW", "REJECTED"]
      if (TERMINAL.includes(booking.status)) {
        throw new Error(`Cannot cancel a booking with status: ${booking.status}`)
      }

      const oldStatus = booking.status

      // Release the slot
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data:  { isBooked: false },
        })
      }

      const updated = await tx.videoBooking.update({
        where:   { id: validated.bookingId },
        data:    { status: "CANCELED", slotId: null },
        include: bookingInclude,
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId: updated.id, oldStatus, newStatus: "CANCELED", changedById: adminId },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     "Video Call Cancelled",
          message:   `Your video call has been cancelled.${validated.reason ? ` Reason: ${validated.reason}` : ""}`,
          type:      "BOOKING_CANCELLED",
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   "CANCEL_BOOKING",
          entity:   "VideoBooking",
          entityId: updated.id,
          changes:  {
            oldStatus,
            newStatus: "CANCELED",
            reason:    validated.reason ?? null,
          } satisfies Prisma.InputJsonValue,
        },
      })

      return updated
    })

    revalidateBookings()
    return { success: true, data: serializeAdminBooking(result) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[cancelBookingByAdmin]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to cancel booking" }
  }
}

/**
 * Mark a confirmed booking as NO_SHOW when the client doesn't attend.
 * Releases the slot for future use.
 */
export async function markNoShow(
  input: z.infer<typeof markNoShowSchema>,
): Promise<ActionResult<SerializedAdminBooking>> {
  try {
    const adminId   = await requireAdmin()
    const validated = markNoShowSchema.parse(input)

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.videoBooking.findUnique({
        where:   { id: validated.bookingId, isDeleted: false },
        include: { client: { select: { id: true } } },
      })
      if (!booking) throw new Error("Booking not found")

      const noShowable: BookingStatus[] = ["PROPOSED", "CONFIRMED"]
      if (!noShowable.includes(booking.status)) {
        throw new Error(`Booking must be ${noShowable.join(" or ")} to mark as no-show`)
      }

      const oldStatus = booking.status

      // Release the slot
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data:  { isBooked: false },
        })
      }

      const updated = await tx.videoBooking.update({
        where:   { id: validated.bookingId },
        data:    { status: "NO_SHOW", slotId: null },
        include: bookingInclude,
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId: updated.id, oldStatus, newStatus: "NO_SHOW", changedById: adminId },
      })

      await tx.notification.create({
        data: {
          userId:    booking.client.id,
          title:     "Missed Video Call",
          message:   "You missed your scheduled video call. Please contact us to reschedule.",
          type:      "BOOKING_NO_SHOW",
          bookingId: updated.id,
        },
      })

      await tx.auditLog.create({
        data: {
          adminId,
          action:   "MARK_NO_SHOW",
          entity:   "VideoBooking",
          entityId: updated.id,
          changes:  { oldStatus, newStatus: "NO_SHOW" } satisfies Prisma.InputJsonValue,
        },
      })

      return updated
    })

    revalidateBookings()
    return { success: true, data: serializeAdminBooking(result) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    console.error("[markNoShow]", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to mark no-show" }
  }
}

/**
 * Soft-delete a booking (isDeleted: true). Used for cleanup — does not notify the client.
 * Only allowed when the booking is in a terminal state.
 */
export async function softDeleteBooking(
  bookingId: string,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const adminId = await requireAdmin()

    const booking = await prisma.videoBooking.findUnique({
      where:  { id: bookingId, isDeleted: false },
      select: { id: true, status: true, slotId: true },
    })
    if (!booking) return { success: false, error: "Booking not found" }

    const TERMINAL: BookingStatus[] = ["COMPLETED", "CANCELED", "NO_SHOW", "REJECTED"]
    if (!TERMINAL.includes(booking.status)) {
      return { success: false, error: "Only terminal-status bookings can be deleted" }
    }

    await prisma.$transaction([
      prisma.videoBooking.update({
        where: { id: bookingId },
        data:  { isDeleted: true },
      }),
      prisma.auditLog.create({
        data: {
          adminId,
          action:   "DELETE_BOOKING",
          entity:   "VideoBooking",
          entityId: bookingId,
          changes:  { status: booking.status } satisfies Prisma.InputJsonValue,
        },
      }),
    ])

    revalidateBookings()
    return { success: true, data: { ok: true } }
  } catch (err) {
    console.error("[softDeleteBooking]", err)
    return { success: false, error: "Failed to delete booking" }
  }
}