'use server';
// app/[locale]/admin/(routes)/manage-employees/actions.ts

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const getEmployeesSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'displayOrder', 'fullName']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const getEmployeeByIdSchema = z.object({
  id: z.string().min(1), // EmployeeProfile.id
});

const getEmployeeByUserIdSchema = z.object({
  userId: z.string().min(1),
});

const otherLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: z.string().url(),
});

const createEmployeeProfileSchema = z.object({
  userId: z.string().min(1),
  positionEn: z.string().max(200).optional(),
  positionAr: z.string().max(200).optional(),
  bioEn: z.string().optional(),
  bioAr: z.string().optional(),
  shortBioEn: z.string().max(500).optional(),
  shortBioAr: z.string().max(500).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
    .max(100)
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  displayOrder: z.number().int().min(0).default(0),
  photoUrl: z.string().url().optional().nullable(),
  photoAltEn: z.string().max(200).optional().nullable(),
  photoAltAr: z.string().max(200).optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  youtubeUrl: z.string().url().optional().nullable(),
  tiktokUrl: z.string().url().optional().nullable(),
  snapchatUrl: z.string().url().optional().nullable(),
  otherLinks: z.array(otherLinkSchema).optional().nullable(),
});

const updateEmployeeProfileSchema = z.object({
  id: z.string().min(1), // EmployeeProfile.id
  positionEn: z.string().max(200).optional(),
  positionAr: z.string().max(200).optional(),
  bioEn: z.string().optional(),
  bioAr: z.string().optional(),
  shortBioEn: z.string().max(500).optional(),
  shortBioAr: z.string().max(500).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
    .max(100)
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  displayOrder: z.number().int().min(0).optional(),
  photoUrl: z.string().url().optional().nullable(),
  photoAltEn: z.string().max(200).optional().nullable(),
  photoAltAr: z.string().max(200).optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  youtubeUrl: z.string().url().optional().nullable(),
  tiktokUrl: z.string().url().optional().nullable(),
  snapchatUrl: z.string().url().optional().nullable(),
  otherLinks: z.array(otherLinkSchema).optional().nullable(),
});

const promoteToEmployeeSchema = z.object({
  userId: z.string().min(1),
});

const demoteFromEmployeeSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

const reorderEmployeesSchema = z.object({
  // Array of { id: EmployeeProfile.id, displayOrder: number }
  items: z.array(
    z.object({
      id: z.string().min(1),
      displayOrder: z.number().int().min(0),
    })
  ).min(1),
});

const publishEmployeeSchema = z.object({
  id: z.string().min(1),
});

const unpublishEmployeeSchema = z.object({
  id: z.string().min(1),
  reason: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type GetEmployeesParams = z.infer<typeof getEmployeesSchema>;

export type EmployeeProfileListItem = {
  id: string;
  userId: string;
  positionEn: string | null;
  positionAr: string | null;
  shortBioEn: string | null;
  shortBioAr: string | null;
  slug: string | null;
  status: string;
  displayOrder: number;
  photoUrl: string | null;
  photoAltEn: string | null;
  photoAltAr: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  otherLinks: unknown;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    clerkId: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    role: UserRole;
  };
};

export type GetEmployeesReturn = {
  employees: EmployeeProfileListItem[];
  nextCursor: string | null;
  total: number;
};

export type EmployeeProfileDetail = {
  id: string;
  userId: string;
  positionEn: string | null;
  positionAr: string | null;
  bioEn: string | null;
  bioAr: string | null;
  shortBioEn: string | null;
  shortBioAr: string | null;
  slug: string | null;
  status: string;
  displayOrder: number;
  photoUrl: string | null;
  photoAltEn: string | null;
  photoAltAr: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  otherLinks: unknown;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    clerkId: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: UserRole;
    isActive: boolean;
    isEmployee: boolean;
    createdAt: Date;
    _count: {
      requests: number;
      clientBookings: number;
      uploadedFiles: number;
      notifications: number;
      chatSessions: number;
    };
    subscription: {
      id: string;
      items: Array<{
        status: string;
        plan: { name: string; amount: number; currency: string; interval: string | null } | null;
      }>;
    } | null;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIST EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployees(
  rawParams: GetEmployeesParams
): Promise<ActionResult<GetEmployeesReturn>> {
  try {
    await requireAdmin();

    const params = getEmployeesSchema.parse(rawParams);
    const { take, cursor, search, status, isActive, sortBy, sortOrder } = params;

    // Build where clause on EmployeeProfile joined through user
    const where: Prisma.EmployeeProfileWhereInput = {
      user: { isDeleted: false, isEmployee: true },
    };

    if (status) where.status = status;
    if (isActive !== undefined) where.user = { ...where.user as object, isActive };

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { positionEn: { contains: search, mode: 'insensitive' } },
        { positionAr: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Resolve orderBy — displayOrder/createdAt live on profile; fullName is on user
    const orderBy: Prisma.EmployeeProfileOrderByWithRelationInput =
      sortBy === 'fullName'
        ? { user: { fullName: sortOrder } }
        : { [sortBy]: sortOrder };

    const [total, rawProfiles] = await Promise.all([
      prisma.employeeProfile.count({ where }),
      prisma.employeeProfile.findMany({
        take: take + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
        select: {
          id: true,
          userId: true,
          positionEn: true,
          positionAr: true,
          shortBioEn: true,
          shortBioAr: true,
          slug: true,
          status: true,
          displayOrder: true,
          photoUrl: true,
          photoAltEn: true,
          photoAltAr: true,
          facebookUrl: true,
          instagramUrl: true,
          twitterUrl: true,
          linkedinUrl: true,
          youtubeUrl: true,
          tiktokUrl: true,
          snapchatUrl: true,
          otherLinks: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              clerkId: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              isActive: true,
              role: true,
            },
          },
        },
      }),
    ]);

    let nextCursor: string | null = null;
    if (rawProfiles.length > take) nextCursor = rawProfiles.pop()!.id;

    return {
      success: true,
      data: { employees: rawProfiles as EmployeeProfileListItem[], nextCursor, total },
    };
  } catch (error) {
    console.error('[getEmployees]', error);
    return { success: false, error: 'Failed to fetch employees' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET SINGLE EMPLOYEE PROFILE (by EmployeeProfile.id)
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployeeById(
  rawParams: { id: string }
): Promise<ActionResult<{ employee: EmployeeProfileDetail }>> {
  try {
    await requireAdmin();

    const { id } = getEmployeeByIdSchema.parse(rawParams);

    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        positionEn: true,
        positionAr: true,
        bioEn: true,
        bioAr: true,
        shortBioEn: true,
        shortBioAr: true,
        slug: true,
        status: true,
        displayOrder: true,
        photoUrl: true,
        photoAltEn: true,
        photoAltAr: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
        tiktokUrl: true,
        snapchatUrl: true,
        otherLinks: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            clerkId: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            isEmployee: true,
            createdAt: true,
            _count: {
              select: {
                requests: true,
                clientBookings: true,
                uploadedFiles: true,
                notifications: true,
                chatSessions: true,
              },
            },
            subscription: {
              select: {
                id: true,
                items: {
                  select: {
                    status: true,
                    plan: {
                      select: { name: true, amount: true, currency: true, interval: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) return { success: false, error: 'Employee profile not found' };
    if (profile.user.isDeleted) return { success: false, error: 'User has been deleted' };

    const employee: EmployeeProfileDetail = {
      ...profile,
      user: {
        ...profile.user,
        subscription: profile.user.subscription
          ? {
            ...profile.user.subscription,
            items: profile.user.subscription.items.map((item) => ({
              ...item,
              plan: item.plan ? { ...item.plan, amount: Number(item.plan.amount) } : null,
            })),
          }
          : null,
      },
    };

    return { success: true, data: { employee } };
  } catch (error) {
    console.error('[getEmployeeById]', error);
    return { success: false, error: 'Failed to fetch employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET EMPLOYEE PROFILE BY USER ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployeeByUserId(
  rawParams: { userId: string }
): Promise<ActionResult<{ employee: EmployeeProfileDetail }>> {
  try {
    await requireAdmin();

    const { userId } = getEmployeeByUserIdSchema.parse(rawParams);

    const profile = await prisma.employeeProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        positionEn: true,
        positionAr: true,
        bioEn: true,
        bioAr: true,
        shortBioEn: true,
        shortBioAr: true,
        slug: true,
        status: true,
        displayOrder: true,
        photoUrl: true,
        photoAltEn: true,
        photoAltAr: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
        tiktokUrl: true,
        snapchatUrl: true,
        otherLinks: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            clerkId: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            isEmployee: true,
            createdAt: true,
            _count: {
              select: {
                requests: true,
                clientBookings: true,
                uploadedFiles: true,
                notifications: true,
                chatSessions: true,
              },
            },
            subscription: {
              select: {
                id: true,
                items: {
                  select: {
                    status: true,
                    plan: {
                      select: { name: true, amount: true, currency: true, interval: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) return { success: false, error: 'Employee profile not found' };

    const employee: EmployeeProfileDetail = {
      ...profile,
      user: {
        ...profile.user,
        subscription: profile.user.subscription
          ? {
            ...profile.user.subscription,
            items: profile.user.subscription.items.map((item) => ({
              ...item,
              plan: item.plan ? { ...item.plan, amount: Number(item.plan.amount) } : null,
            })),
          }
          : null,
      },
    };

    return { success: true, data: { employee } };
  } catch (error) {
    console.error('[getEmployeeByUserId]', error);
    return { success: false, error: 'Failed to fetch employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PROMOTE USER → EMPLOYEE  (creates User.isEmployee + EmployeeProfile)
// ─────────────────────────────────────────────────────────────────────────────

export async function promoteToEmployee(
  rawParams: z.infer<typeof promoteToEmployeeSchema>
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const { userId } = promoteToEmployeeSchema.parse(rawParams);

    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, clerkId: true, isEmployee: true, employeeProfile: { select: { id: true } } },
    });

    if (!user) return { success: false, error: 'User not found' };
    if (user.isEmployee || user.employeeProfile)
      return { success: false, error: 'User is already an employee' };

    const [, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isEmployee: true },
      }),
      prisma.employeeProfile.create({
        data: { userId, status: 'DRAFT' },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'PROMOTE_TO_EMPLOYEE',
        entity: 'User',
        entityId: userId,
        changes: { profileId: profile.id } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: profile.id } };
  } catch (error) {
    console.error('[promoteToEmployee]', error);
    return { success: false, error: 'Failed to promote user to employee' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DEMOTE EMPLOYEE → USER  (sets isEmployee false, keeps profile in DB)
// ─────────────────────────────────────────────────────────────────────────────

export async function demoteFromEmployee(
  rawParams: z.infer<typeof demoteFromEmployeeSchema>
): Promise<ActionResult<{ userId: string }>> {
  try {
    const adminId = await requireAdmin();

    const { userId, reason } = demoteFromEmployeeSchema.parse(rawParams);

    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, isEmployee: true, employeeProfile: { select: { id: true } } },
    });

    if (!user) return { success: false, error: 'User not found' };
    if (!user.isEmployee) return { success: false, error: 'User is not an employee' };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isEmployee: false },
      }),
      // Unpublish profile so it's hidden on the front-end
      ...(user.employeeProfile
        ? [
          prisma.employeeProfile.update({
            where: { id: user.employeeProfile.id },
            data: { status: 'DRAFT' },
          }),
        ]
        : []),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'DEMOTE_FROM_EMPLOYEE',
        entity: 'User',
        entityId: userId,
        changes: { reason: reason ?? 'No reason provided' } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { userId } };
  } catch (error) {
    console.error('[demoteFromEmployee]', error);
    return { success: false, error: 'Failed to demote employee' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CREATE EMPLOYEE PROFILE  (for users already promoted)
// ─────────────────────────────────────────────────────────────────────────────

export async function createEmployeeProfile(
  rawParams: z.infer<typeof createEmployeeProfileSchema>
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const parsed = createEmployeeProfileSchema.parse(rawParams);
    const { userId, slug, otherLinks, ...rest } = parsed;

    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, isEmployee: true, employeeProfile: { select: { id: true } } },
    });

    if (!user) return { success: false, error: 'User not found' };
    if (!user.isEmployee)
      return { success: false, error: 'User must be promoted to employee first' };
    if (user.employeeProfile)
      return { success: false, error: 'Employee profile already exists' };

    // Slug uniqueness check
    if (slug) {
      const existing = await prisma.employeeProfile.findUnique({ where: { slug } });
      if (existing) return { success: false, error: 'Slug is already in use' };
    }

    const profile = await prisma.employeeProfile.create({
      data: {
        userId,
        slug,
        otherLinks: (otherLinks ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ...rest,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: profile.id,
        changes: { userId, slug } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: profile.id } };
  } catch (error) {
    console.error('[createEmployeeProfile]', error);
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: 'Failed to create employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. UPDATE EMPLOYEE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateEmployeeProfile(
  rawParams: z.infer<typeof updateEmployeeProfileSchema>
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const { id, slug, otherLinks, ...rest } = updateEmployeeProfileSchema.parse(rawParams);

    const existing = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, slug: true },
    });
    if (!existing) return { success: false, error: 'Employee profile not found' };

    // Slug uniqueness — only check if slug changed
    if (slug && slug !== existing.slug) {
      const conflict = await prisma.employeeProfile.findUnique({ where: { slug } });
      if (conflict) return { success: false, error: 'Slug is already in use' };
    }

    const data: Prisma.EmployeeProfileUpdateInput = {
      ...rest,
      ...(slug !== undefined && { slug }),
      ...(otherLinks !== undefined && {
        otherLinks: otherLinks === null ? Prisma.JsonNull : (otherLinks as Prisma.InputJsonValue),
      }),
    };

    const updated = await prisma.employeeProfile.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: id,
        changes: data as Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: updated.id } };
  } catch (error) {
    console.error('[updateEmployeeProfile]', error);
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: 'Failed to update employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PUBLISH EMPLOYEE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function publishEmployeeProfile(
  rawParams: { id: string }
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const { id } = publishEmployeeSchema.parse(rawParams);

    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { id: true, status: true, user: { select: { isEmployee: true, isDeleted: true } } },
    });

    if (!profile) return { success: false, error: 'Employee profile not found' };
    if (profile.user.isDeleted) return { success: false, error: 'User has been deleted' };
    if (!profile.user.isEmployee)
      return { success: false, error: 'User is no longer an employee' };
    if (profile.status === 'PUBLISHED')
      return { success: false, error: 'Profile is already published' };

    await prisma.employeeProfile.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'PUBLISH_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: id,
        changes: { status: 'PUBLISHED' } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: id } };
  } catch (error) {
    console.error('[publishEmployeeProfile]', error);
    return { success: false, error: 'Failed to publish employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. UNPUBLISH EMPLOYEE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function unpublishEmployeeProfile(
  rawParams: { id: string; reason?: string }
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const { id, reason } = unpublishEmployeeSchema.parse(rawParams);

    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!profile) return { success: false, error: 'Employee profile not found' };
    if (profile.status === 'DRAFT')
      return { success: false, error: 'Profile is already unpublished' };

    await prisma.employeeProfile.update({
      where: { id },
      data: { status: 'DRAFT' },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UNPUBLISH_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: id,
        changes: { status: 'DRAFT', reason: reason ?? 'No reason provided' } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: id } };
  } catch (error) {
    console.error('[unpublishEmployeeProfile]', error);
    return { success: false, error: 'Failed to unpublish employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. BULK REORDER EMPLOYEES (drag-and-drop displayOrder update)
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderEmployees(
  rawParams: z.infer<typeof reorderEmployeesSchema>
): Promise<ActionResult<{ updated: number }>> {
  try {
    const adminId = await requireAdmin();

    const { items } = reorderEmployeesSchema.parse(rawParams);

    await prisma.$transaction(
      items.map(({ id, displayOrder }) =>
        prisma.employeeProfile.update({
          where: { id },
          data: { displayOrder },
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'REORDER_EMPLOYEES',
        entity: 'EmployeeProfile',
        entityId: null,
        changes: { items } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { updated: items.length } };
  } catch (error) {
    console.error('[reorderEmployees]', error);
    return { success: false, error: 'Failed to reorder employees' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. DELETE EMPLOYEE PROFILE  (hard delete — profile only, user is unaffected)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteEmployeeProfile(
  rawParams: { id: string }
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const { id } = getEmployeeByIdSchema.parse(rawParams);

    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!profile) return { success: false, error: 'Employee profile not found' };

    // Drop isEmployee flag on the user in the same transaction
    await prisma.$transaction([
      prisma.employeeProfile.delete({ where: { id } }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { isEmployee: false },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: id,
        changes: { userId: profile.userId } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: id } };
  } catch (error) {
    console.error('[deleteEmployeeProfile]', error);
    return { success: false, error: 'Failed to delete employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. GET ELIGIBLE USERS (users without an employee profile, for the picker)
// ─────────────────────────────────────────────────────────────────────────────

export type EligibleUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

export async function getEligibleUsersForEmployeePromotion(rawParams: {
  search?: string;
  take?: number;
}): Promise<ActionResult<{ users: EligibleUser[]; total: number }>> {
  try {
    await requireAdmin();

    const take = Math.min(rawParams.take ?? 20, 100);
    const search = rawParams.search?.trim();

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      isEmployee: false,
      employeeProfile: null,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        take,
        orderBy: { fullName: 'asc' },
        select: { id: true, email: true, fullName: true, avatarUrl: true, role: true },
      }),
    ]);

    return { success: true, data: { users, total } };
  } catch (error) {
    console.error('[getEligibleUsersForEmployeePromotion]', error);
    return { success: false, error: 'Failed to fetch eligible users' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. EMPLOYEE PROFILE AUDIT HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileAuditEntry = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  changes: unknown;
  createdAt: Date;
  admin: { id: string; fullName: string | null; email: string } | null;
};

export async function getEmployeeProfileAuditLogs(rawParams: {
  profileId: string;
  take?: number;
}): Promise<ActionResult<{ logs: ProfileAuditEntry[] }>> {
  try {
    await requireAdmin();

    const profileId = z.string().min(1).parse(rawParams.profileId);
    const take = Math.min(rawParams.take ?? 30, 100);

    const logs = await prisma.auditLog.findMany({
      where: {
        entity: 'EmployeeProfile',
        entityId: profileId,
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        changes: true,
        createdAt: true,
        admin: { select: { id: true, fullName: true, email: true } },
      },
    });

    return { success: true, data: { logs } };
  } catch (error) {
    console.error('[getEmployeeProfileAuditLogs]', error);
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. SLUG AVAILABILITY CHECK  (lightweight — useful for live form validation)
// ─────────────────────────────────────────────────────────────────────────────

export async function checkSlugAvailability(rawParams: {
  slug: string;
  excludeProfileId?: string;
}): Promise<ActionResult<{ available: boolean }>> {
  try {
    await requireAdmin();

    const slug = z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
      .min(2)
      .max(100)
      .parse(rawParams.slug);

    const existing = await prisma.employeeProfile.findUnique({
      where: { slug },
      select: { id: true },
    });

    const available =
      !existing || (!!rawParams.excludeProfileId && existing.id === rawParams.excludeProfileId);

    return { success: true, data: { available } };
  } catch (error) {
    console.error('[checkSlugAvailability]', error);
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: 'Failed to check slug availability' };
  }
}