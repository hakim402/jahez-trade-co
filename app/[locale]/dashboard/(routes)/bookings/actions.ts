"use server"

// app/[locale]/dashboard/(routes)/video-booking/actions.ts

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { BookingStatus, BookingType, MeetingProvider } from "@prisma/client"
import { revalidatePath } from "next/cache"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type UserPlanInfo = {
  planName: string
  limit: number    // Infinity = unlimited
  usedCount: number
  hasAccess: boolean
  billingEnabled: boolean
}

export type SerializedSlot = {
  id: string
  startTime: string
  endTime: string
  durationMinutes: number
  createdById: string
  isBooked: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type SerializedStatusHistory = {
  id: string
  bookingId: string
  oldStatus: BookingStatus
  newStatus: BookingStatus
  changedAt: string
  changedBy: { id: string; email: string; fullName: string | null }
}

export type SerializedBooking = {
  id: string
  clientId: string
  type: BookingType
  requestNotes: string | null
  durationMinutes: number
  status: BookingStatus
  handledById: string | null
  scheduledAt: string | null
  meetingProvider: MeetingProvider | null
  meetingLink: string | null
  meetingPassword: string | null
  clientConfirmedAt: string | null
  transcriptUrl: string | null
  aiSummary: string | null
  isDeleted: boolean
  slotId: string | null
  createdAt: string
  updatedAt: string
  slot: SerializedSlot | null
  statusHistory: SerializedStatusHistory[]
}

export type BookingKpi = {
  total: number
  pending: number
  confirmed: number
  completed: number
}

export type BookingPageContext = {
  planInfo: UserPlanInfo
  kpi: BookingKpi
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan limits — kept here, not in _components, so this server file
// has no dependency on client-side code.
// Adjust keys to match your exact Clerk plan names.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_BOOKING_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 10,
  business: Infinity,
  enterprise: Infinity,
  vip: Infinity,
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

async function requireClient(): Promise<string> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("UNAUTHORIZED")

  const user = await prisma.user.findUnique({
    where: { clerkId, isDeleted: false, isActive: true },
    select: { id: true, role: true },
  })

  if (!user) throw new Error("USER_NOT_FOUND")
  if (user.role !== "CLIENT") throw new Error("FORBIDDEN")
  return user.id
}

function authError(err: unknown): ActionResult<never> {
  const msg = err instanceof Error ? err.message : ""
  if (msg === "UNAUTHORIZED") return { success: false, error: "Please sign in to continue." }
  if (msg === "USER_NOT_FOUND") return { success: false, error: "Account not found." }
  if (msg === "FORBIDDEN") return { success: false, error: "Only client accounts can perform this action." }
  return { success: false, error: "An unexpected error occurred." }
}

async function getAdminIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isDeleted: false, isActive: true },
    select: { id: true },
  })
  return admins.map((a) => a.id)
}

// ─────────────────────────────────────────────────────────────────────────────
// Serializers — all Date → ISO string, all Decimal → number
// ─────────────────────────────────────────────────────────────────────────────

function serializeSlot(s: any): SerializedSlot {
  return {
    ...s,
    startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
    endTime: s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime,
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

function serializeBooking(b: any): SerializedBooking {
  return {
    ...b,
    scheduledAt: b.scheduledAt instanceof Date ? b.scheduledAt.toISOString() : b.scheduledAt,
    clientConfirmedAt: b.clientConfirmedAt instanceof Date ? b.clientConfirmedAt.toISOString() : b.clientConfirmedAt,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt,
    slot: b.slot ? serializeSlot(b.slot) : null,
    statusHistory: (b.statusHistory ?? []).map(serializeHistoryEntry),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Prisma select for a full booking with relations
// ─────────────────────────────────────────────────────────────────────────────

const bookingInclude = {
  slot: true,
  statusHistory: {
    orderBy: { changedAt: "desc" as const },
    include: {
      changedBy: { select: { id: true, email: true, fullName: true } },
    },
  },
} as const

// ═════════════════════════════════════════════════════════════════════════════
// ── 1. PLAN INFO ─────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resolves the user's current plan and how many bookings they have used.
 *
 * BILLING_ENABLED=false  →  unlimited access for everyone.
 * BILLING_ENABLED=true   →  reads active SubscriptionItem → Plan → name,
 *                           maps via PLAN_BOOKING_LIMITS.
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const billingEnabled = process.env.BILLING_ENABLED === "true"

  const usedCount = await prisma.videoBooking.count({
    where: { clientId: userId, isDeleted: false },
  })

  // ── Billing disabled — everyone gets unlimited ────────────────────────────
  if (!billingEnabled) {
    return {
      planName: "Platform Access",
      limit: Infinity,
      usedCount,
      hasAccess: true,
      billingEnabled: false,
    }
  }

  // ── Billing enabled — query subscription directly (not via user join) ─────
  // Note: We query Subscription by userId directly — same pattern as the
  // requests/consulting action files for consistency and efficiency.
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      items: {
        where: { status: "ACTIVE" },
        orderBy: { isDefaultPlan: "asc" },   // non-default (paid plan) first
        take: 1,
        select: { plan: { select: { name: true, isDefault: true } } },
      },
    },
  })

  const plan = subscription?.items[0]?.plan

  // No subscription or no active item → treat as free
  if (!plan) {
    const limit = PLAN_BOOKING_LIMITS["free"] ?? 1
    return {
      planName: "free",
      limit,
      usedCount,
      hasAccess: usedCount < limit,
      billingEnabled: true,
    }
  }

  const key = plan.name.toLowerCase()
  const limit = PLAN_BOOKING_LIMITS[key] ?? (plan.isDefault ? 1 : 0)

  return {
    planName: plan.name,
    limit,
    usedCount,
    hasAccess: limit === Infinity || usedCount < limit,
    billingEnabled: true,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 2. PAGE CONTEXT (one call to hydrate the entire page) ─────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Returns plan info + booking KPIs in a single round-trip.
 * Called by page.tsx (server component) to avoid waterfalls.
 */
export async function getUserBookingContext(): Promise<ActionResult<BookingPageContext>> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Please sign in to continue." }

    const user = await prisma.user.findUnique({
      where: { clerkId, isDeleted: false, isActive: true },
      select: { id: true, role: true },
    })
    if (!user) return { success: false, error: "Account not found." }
    if (user.role !== "CLIENT") return { success: false, error: "Forbidden." }

    const [planInfo, byStatus] = await Promise.all([
      getUserPlanInfo(user.id),
      prisma.videoBooking.groupBy({
        by: ["status"],
        where: { clientId: user.id, isDeleted: false },
        _count: { _all: true },
      }),
    ])

    const kpi: BookingKpi = { total: 0, pending: 0, confirmed: 0, completed: 0 }
    for (const row of byStatus) {
      kpi.total += row._count._all
      if (row.status === "REQUESTED" || row.status === "PROPOSED" || row.status === "RESCHEDULED") {
        kpi.pending += row._count._all
      }
      if (row.status === "CONFIRMED") kpi.confirmed += row._count._all
      if (row.status === "COMPLETED") kpi.completed += row._count._all
    }

    return { success: true, data: { planInfo, kpi } }
  } catch (err) {
    console.error("[getUserBookingContext]", err)
    return { success: false, error: "Failed to load context." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 3. GET AVAILABLE SLOTS ────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Returns future, unbooked, active availability slots.
 * Used by the booking form to let clients pick a time.
 */
export async function getAvailableSlots(): Promise<ActionResult<SerializedSlot[]>> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Please sign in to continue." }

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        isBooked: false,
        isActive: true,
        startTime: { gte: new Date() },  // future slots only
      },
      orderBy: { startTime: "asc" },
      take: 50,   // reasonable upper bound for the picker
    })

    return { success: true, data: slots.map(serializeSlot) }
  } catch (err) {
    console.error("[getAvailableSlots]", err)
    return { success: false, error: "Failed to load available slots." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 4. GET MY BOOKINGS ────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const getMyBookingsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status: z.nativeEnum(BookingStatus).optional(),
})

export async function getMyBookings(
  filters: z.infer<typeof getMyBookingsSchema>,
): Promise<ActionResult<{
  bookings: SerializedBooking[]
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
}>> {
  try {
    const clientId = await requireClient()
    const { page, pageSize, status } = getMyBookingsSchema.parse(filters)
    const skip = (page - 1) * pageSize

    const where = {
      clientId,
      isDeleted: false,
      ...(status && { status }),
    }

    const [bookings, totalCount] = await Promise.all([
      prisma.videoBooking.findMany({
        where,
        include: bookingInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.videoBooking.count({ where }),
    ])

    return {
      success: true,
      data: {
        bookings: bookings.map(serializeBooking),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyBookings]", err)
    return { success: false, error: "Failed to fetch bookings." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE BOOKING (ownership-verified)
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyBooking(
  bookingId: string,
): Promise<ActionResult<SerializedBooking>> {
  try {
    const clientId = await requireClient()

    const booking = await prisma.videoBooking.findUnique({
      where: { id: bookingId, isDeleted: false },
      include: bookingInclude,
    })

    if (!booking) return { success: false, error: "Booking not found." }
    if (booking.clientId !== clientId) return { success: false, error: "Access denied." }

    return { success: true, data: serializeBooking(booking) }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getMyBooking]", err)
    return { success: false, error: "Failed to fetch booking." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 5. CREATE BOOKING ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const createBookingSchema = z.object({
  type: z.nativeEnum(BookingType).default("CUSTOM"),
  requestNotes: z.string().max(2000).optional(),
  durationMinutes: z.coerce.number().int().positive().default(30),
  // z.coerce.date() so ISO strings from datetime-local inputs are accepted
  preferredTime: z.coerce.date().optional(),
  slotId: z.string().optional(),
})

export async function createBooking(
  input: z.infer<typeof createBookingSchema>,
): Promise<ActionResult<SerializedBooking>> {
  try {
    const clientId = await requireClient()
    const validated = createBookingSchema.parse(input)

    // ── Plan gate ──────────────────────────────────────────────────────────
    const planInfo = await getUserPlanInfo(clientId)
    if (!planInfo.hasAccess) {
      if (planInfo.billingEnabled) {
        return {
          success: false,
          error: `UPGRADE_REQUIRED: Your ${planInfo.planName} plan allows ${planInfo.limit} video booking${planInfo.limit === 1 ? "" : "s"}. Please upgrade to request more.`,
        }
      }
      return { success: false, error: "Booking limit reached." }
    }

    // ── Validate slot if provided ─────────────────────────────────────────
    if (validated.slotId) {
      const slot = await prisma.availabilitySlot.findUnique({
        where: { id: validated.slotId },
      })
      if (!slot) return { success: false, error: "Slot not found." }
      if (!slot.isActive) return { success: false, error: "This slot is no longer available." }
      if (slot.isBooked) return { success: false, error: "This slot has already been booked." }
      if (slot.startTime < new Date()) return { success: false, error: "This slot is in the past." }
    }

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.videoBooking.create({
        data: {
          clientId,
          type: validated.type,
          requestNotes: validated.requestNotes ?? null,
          durationMinutes: validated.durationMinutes,
          // Use slot's startTime if a slot is chosen, otherwise use preferredTime
          scheduledAt: validated.slotId
            ? (await tx.availabilitySlot.findUniqueOrThrow({ where: { id: validated.slotId } })).startTime
            : (validated.preferredTime ?? null),
          slotId: validated.slotId ?? null,
          status: "REQUESTED",
        },
        include: bookingInclude,
      })

      // Seed status history
      await tx.bookingStatusHistory.create({
        data: { bookingId: b.id, oldStatus: "REQUESTED", newStatus: "REQUESTED", changedById: clientId },
      })

      // Mark slot as booked
      if (validated.slotId) {
        await tx.availabilitySlot.update({
          where: { id: validated.slotId },
          data: { isBooked: true },
        })
      }

      // Notify all admins
      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId: adminId,
            title: "New Video Booking Request",
            message: `A client has requested a ${validated.type.toLowerCase()} video call.`,
            type: "NEW_BOOKING_REQUEST",
            bookingId: b.id,
          })),
        })
      }

      return b
    })

    revalidatePath("/dashboard/video-booking")
    return { success: true, data: serializeBooking(booking) }
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message }
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[createBooking]", err)
    return { success: false, error: "Failed to create booking." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 6. CONFIRM SCHEDULED BOOKING ──────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Client confirms an admin-proposed booking time.
 * Only allowed when status = PROPOSED.
 */
export async function confirmScheduledBooking(
  bookingId: string,
): Promise<ActionResult<SerializedBooking>> {
  try {
    const clientId = await requireClient()

    const booking = await prisma.videoBooking.findUnique({
      where: { id: bookingId, isDeleted: false },
      include: bookingInclude,
    })

    if (!booking) return { success: false, error: "Booking not found." }
    if (booking.clientId !== clientId) return { success: false, error: "Unauthorized." }
    if (booking.status !== "PROPOSED") return { success: false, error: "Only PROPOSED bookings can be confirmed." }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.videoBooking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED", clientConfirmedAt: new Date() },
        include: bookingInclude,
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId, oldStatus: "PROPOSED", newStatus: "CONFIRMED", changedById: clientId },
      })

      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId: adminId,
            title: "Booking Confirmed",
            message: "A client has confirmed their video call booking.",
            type: "BOOKING_CONFIRMED",
            bookingId,
          })),
        })
      }

      return b
    })

    revalidatePath("/dashboard/video-booking")
    return { success: true, data: serializeBooking(updated) }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[confirmScheduledBooking]", err)
    return { success: false, error: "Failed to confirm booking." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 7. CANCEL BOOKING ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Client cancels their own booking.
 * Allowed while status is REQUESTED, PROPOSED, or RESCHEDULED.
 * Releases the linked AvailabilitySlot automatically.
 */
export async function cancelMyBooking(
  bookingId: string,
): Promise<ActionResult<SerializedBooking>> {
  try {
    const clientId = await requireClient()

    const booking = await prisma.videoBooking.findUnique({
      where: { id: bookingId, isDeleted: false },
      include: { slot: true },
    })

    if (!booking) return { success: false, error: "Booking not found." }
    if (booking.clientId !== clientId) return { success: false, error: "Unauthorized." }

    const cancellable: BookingStatus[] = ["REQUESTED", "PROPOSED", "RESCHEDULED"]
    if (!cancellable.includes(booking.status)) {
      return {
        success: false,
        error: `Only ${cancellable.join(", ")} bookings can be cancelled.`,
      }
    }

    const oldStatus = booking.status

    const updated = await prisma.$transaction(async (tx) => {
      // Release slot so it becomes available again
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { isBooked: false },
        })
        // Disconnect relation without deleting the slot
        await tx.videoBooking.update({
          where: { id: bookingId },
          data: { slot: { disconnect: true } },
        })
      }

      const b = await tx.videoBooking.update({
        where: { id: bookingId },
        data: { status: "CANCELED" },
        include: bookingInclude,
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId, oldStatus, newStatus: "CANCELED", changedById: clientId },
      })

      const adminIds = await getAdminIds()
      if (adminIds.length > 0) {
        await tx.notification.createMany({
          data: adminIds.map((adminId) => ({
            userId: adminId,
            title: "Booking Cancelled",
            message: "A client has cancelled their video call booking.",
            type: "BOOKING_CANCELLED",
            bookingId,
          })),
        })
      }

      return b
    })

    revalidatePath("/dashboard/video-booking")
    return { success: true, data: serializeBooking(updated) }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[cancelMyBooking]", err)
    return { success: false, error: "Failed to cancel booking." }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── 8. DASHBOARD SUMMARY (one call for page.tsx) ──────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export type BookingDashboardSummary = {
  planInfo: UserPlanInfo
  kpi: BookingKpi
  bookings: SerializedBooking[]
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number }
}

/**
 * Single parallel call to hydrate the entire dashboard page.
 * Fetches plan info, KPIs, and the paginated booking list together.
 */
export async function getBookingDashboardSummary(
  page = 1,
  pageSize = 10,
  status?: BookingStatus,
): Promise<ActionResult<BookingDashboardSummary>> {
  try {
    const clientId = await requireClient()
    const skip = (page - 1) * pageSize

    const baseWhere = { clientId, isDeleted: false }
    const listWhere = { ...baseWhere, ...(status && { status }) }

    const [planInfo, byStatus, totalCount, bookings] = await Promise.all([
      getUserPlanInfo(clientId),
      prisma.videoBooking.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.videoBooking.count({ where: listWhere }),
      prisma.videoBooking.findMany({
        where: listWhere,
        include: bookingInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ])

    const kpi: BookingKpi = { total: 0, pending: 0, confirmed: 0, completed: 0 }
    for (const row of byStatus) {
      kpi.total += row._count._all
      if (["REQUESTED", "PROPOSED", "RESCHEDULED"].includes(row.status)) kpi.pending += row._count._all
      if (row.status === "CONFIRMED") kpi.confirmed += row._count._all
      if (row.status === "COMPLETED") kpi.completed += row._count._all
    }

    return {
      success: true,
      data: {
        planInfo,
        kpi,
        bookings: bookings.map(serializeBooking),
        pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
      },
    }
  } catch (err) {
    if (err instanceof Error && ["UNAUTHORIZED", "USER_NOT_FOUND", "FORBIDDEN"].includes(err.message)) return authError(err)
    console.error("[getBookingDashboardSummary]", err)
    return { success: false, error: "Failed to load dashboard." }
  }
}