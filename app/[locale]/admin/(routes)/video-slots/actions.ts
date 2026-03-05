// app/[locale]/admin/(routes)/video-slots/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { logAdminAction } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------
const getSlotsFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  startDateFrom: z.date().optional(),
  startDateTo: z.date().optional(),
  isActive: z.boolean().optional(),
  isBooked: z.boolean().optional(),
})

const createSlotSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  durationMinutes: z.number().int().positive(),
  isActive: z.boolean().default(true),
})

const updateSlotSchema = z.object({
  slotId: z.string().cuid(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  durationMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

const toggleSlotActiveSchema = z.object({
  slotId: z.string().cuid(),
  isActive: z.boolean(),
})

// ------------------------------------------------------------------
// Types (exported for client components)
// ------------------------------------------------------------------
export type Slot = {
  id: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  isActive: boolean
  isBooked: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    fullName: string | null
    email: string
  }
  booking?: {
    id: string
    client: { fullName: string | null; email: string }
    status: string
  } | null
}

export type GetSlotsReturn = {
  slots: Slot[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------

/**
 * Get paginated list of slots with optional filters
 */
export async function getSlots(
  filters: z.infer<typeof getSlotsFilterSchema>
): Promise<{ success: true; data: GetSlotsReturn } | { success: false; error: string }> {
  try {
    const adminId = await requireAdmin()
    const validated = getSlotsFilterSchema.parse(filters)

    const { page, pageSize, startDateFrom, startDateTo, isActive, isBooked } = validated
    const skip = (page - 1) * pageSize

    const where: Prisma.AvailabilitySlotWhereInput = {}

    if (startDateFrom || startDateTo) {
      where.startTime = {}
      if (startDateFrom) where.startTime.gte = startDateFrom
      if (startDateTo) where.startTime.lte = startDateTo
    }

    if (isActive !== undefined) where.isActive = isActive
    if (isBooked !== undefined) where.isBooked = isBooked

    const [slots, totalCount] = await prisma.$transaction([
      prisma.availabilitySlot.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: {
              id: true,
              client: { select: { fullName: true, email: true } },
              status: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.availabilitySlot.count({ where }),
    ])

    return {
      success: true,
      data: {
        slots: slots as Slot[],
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
    console.error('Get slots error:', error)
    return { success: false, error: 'Failed to fetch slots' }
  }
}

/**
 * Create a new availability slot
 */
export async function createSlot(
  input: z.infer<typeof createSlotSchema>
): Promise<{ success: true; data: Slot } | { success: false; error: string }> {
  try {
    const adminId = await requireAdmin()
    const validated = createSlotSchema.parse(input)

    // Validate time range
    if (validated.endTime <= validated.startTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    const slot = await prisma.$transaction(async (tx) => {
      const newSlot = await tx.availabilitySlot.create({
        data: {
          startTime: validated.startTime,
          endTime: validated.endTime,
          durationMinutes: validated.durationMinutes,
          createdById: adminId,
          isActive: validated.isActive,
          isBooked: false,
        },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: {
              id: true,
              client: { select: { fullName: true, email: true } },
              status: true,
            },
          },
        },
      })

      // Audit log
      await logAdminAction({
        action: 'CREATE_SLOT',
        entity: 'AvailabilitySlot',
        entityId: newSlot.id,
        changes: {
          startTime: validated.startTime,
          endTime: validated.endTime,
          durationMinutes: validated.durationMinutes,
        },
      })

      return newSlot
    })

    revalidatePath('/admin/video-slots')
    return { success: true, data: slot as Slot }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    console.error('Create slot error:', error)
    return { success: false, error: 'Failed to create slot' }
  }
}

/**
 * Update an existing slot (only if not booked)
 */
export async function updateSlot(
  input: z.infer<typeof updateSlotSchema>
): Promise<{ success: true; data: Slot } | { success: false; error: string }> {
  try {
    const adminId = await requireAdmin()
    const validated = updateSlotSchema.parse(input)

    // Fetch current slot to check if it's booked
    const existing = await prisma.availabilitySlot.findUnique({
      where: { id: validated.slotId },
      select: { isBooked: true, startTime: true, endTime: true, durationMinutes: true, isActive: true },
    })
    if (!existing) return { success: false, error: 'Slot not found' }
    if (existing.isBooked) {
      return { success: false, error: 'Cannot update a booked slot' }
    }

    // Validate time range if both are provided
    if (validated.startTime && validated.endTime && validated.endTime <= validated.startTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    const slot = await prisma.$transaction(async (tx) => {
      const updatedSlot = await tx.availabilitySlot.update({
        where: { id: validated.slotId },
        data: {
          startTime: validated.startTime,
          endTime: validated.endTime,
          durationMinutes: validated.durationMinutes,
          isActive: validated.isActive,
        },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: {
              id: true,
              client: { select: { fullName: true, email: true } },
              status: true,
            },
          },
        },
      })

      // Audit log
      await logAdminAction({
        action: 'UPDATE_SLOT',
        entity: 'AvailabilitySlot',
        entityId: updatedSlot.id,
        changes: {
          before: existing,
          after: {
            startTime: validated.startTime ?? existing.startTime,
            endTime: validated.endTime ?? existing.endTime,
            durationMinutes: validated.durationMinutes ?? existing.durationMinutes,
            isActive: validated.isActive ?? existing.isActive,
          },
        },
      })

      return updatedSlot
    })

    revalidatePath('/admin/video-slots')
    return { success: true, data: slot as Slot }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    console.error('Update slot error:', error)
    return { success: false, error: 'Failed to update slot' }
  }
}

/**
 * Toggle active status (activate/deactivate) – allowed even if booked? Probably not, but we allow deactivating only if not booked.
 */
export async function toggleSlotActive(
  input: z.infer<typeof toggleSlotActiveSchema>
): Promise<{ success: true; data: Slot } | { success: false; error: string }> {
  try {
    const adminId = await requireAdmin()
    const validated = toggleSlotActiveSchema.parse(input)

    const existing = await prisma.availabilitySlot.findUnique({
      where: { id: validated.slotId },
      select: { isBooked: true, isActive: true },
    })
    if (!existing) return { success: false, error: 'Slot not found' }
    if (existing.isBooked && validated.isActive === false) {
      // If deactivating a booked slot, maybe allow? Usually you'd want to keep it active until booking is done.
      // We'll allow but warn? For now, prevent.
      return { success: false, error: 'Cannot deactivate a booked slot' }
    }

    const slot = await prisma.$transaction(async (tx) => {
      const updatedSlot = await tx.availabilitySlot.update({
        where: { id: validated.slotId },
        data: { isActive: validated.isActive },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: {
              id: true,
              client: { select: { fullName: true, email: true } },
              status: true,
            },
          },
        },
      })

      await logAdminAction({
        action: validated.isActive ? 'ACTIVATE_SLOT' : 'DEACTIVATE_SLOT',
        entity: 'AvailabilitySlot',
        entityId: updatedSlot.id,
        changes: { oldIsActive: existing.isActive, newIsActive: validated.isActive },
      })

      return updatedSlot
    })

    revalidatePath('/admin/video-slots')
    return { success: true, data: slot as Slot }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' }
    }
    console.error('Toggle slot active error:', error)
    return { success: false, error: 'Failed to update slot' }
  }
}

/**
 * Hard delete a slot (only if not booked and probably not used). Use with caution.
 * Alternative: just deactivate (toggle isActive) instead of delete.
 */
export async function deleteSlot(
  slotId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const adminId = await requireAdmin()
    const id = z.string().cuid().parse(slotId)

    const slot = await prisma.availabilitySlot.findUnique({
      where: { id },
      select: { isBooked: true },
    })
    if (!slot) return { success: false, error: 'Slot not found' }
    if (slot.isBooked) {
      return { success: false, error: 'Cannot delete a booked slot' }
    }

    await prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.delete({ where: { id } })

      await logAdminAction({
        action: 'DELETE_SLOT',
        entity: 'AvailabilitySlot',
        entityId: id,
        changes: { deleted: true },
      })
    })

    revalidatePath('/admin/video-slots')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid slot ID' }
    }
    console.error('Delete slot error:', error)
    return { success: false, error: 'Failed to delete slot' }
  }
}