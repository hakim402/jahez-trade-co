'use server';
// app/[locale]/admin/(routes)/manage-employees/actions.ts

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { z } from 'zod';
import { Prisma, UserRole } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
  .max(100);

const otherLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: z.string().url(),
});

const sharedProfileFields = {
  positionEn:   z.string().max(200).optional().nullable(),
  positionAr:   z.string().max(200).optional().nullable(),
  bioEn:        z.string().optional().nullable(),
  bioAr:        z.string().optional().nullable(),
  shortBioEn:   z.string().max(500).optional().nullable(),
  shortBioAr:   z.string().max(500).optional().nullable(),
  slug:         slugSchema.optional().nullable(),
  
  photoUrl:     z.string().url().optional().nullable(),
  photoAltEn:   z.string().max(200).optional().nullable(),
  photoAltAr:   z.string().max(200).optional().nullable(),
  facebookUrl:  z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  twitterUrl:   z.string().url().optional().nullable(),
  linkedinUrl:  z.string().url().optional().nullable(),
  youtubeUrl:   z.string().url().optional().nullable(),
  tiktokUrl:    z.string().url().optional().nullable(),
  snapchatUrl:  z.string().url().optional().nullable(),
  otherLinks:   z.array(otherLinkSchema).optional().nullable(),
};

const createProfileSchema = z.object({
  userId:       z.string().min(1),
  status:       z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  displayOrder: z.number().int().min(0).default(0),
  ...sharedProfileFields,
});

const updateProfileSchema = z.object({
  id: z.string().min(1),
  ...sharedProfileFields,
});

const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), displayOrder: z.number().int().min(0) }))
    .min(1),
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED PARAM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type GetEmployeesParams = {
  take?: number;
  cursor?: string;
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  isActive?: boolean;
  sortBy?: 'createdAt' | 'displayOrder' | 'fullName';
  sortOrder?: 'asc' | 'desc';
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SELECT FRAGMENTS  (typed via satisfies for full inference)
// ─────────────────────────────────────────────────────────────────────────────

const listSelect = {
  id: true, userId: true,
  positionEn: true, positionAr: true,
  shortBioEn: true, shortBioAr: true,
  slug: true, status: true, displayOrder: true,
  photoUrl: true, photoAltEn: true, photoAltAr: true,
  facebookUrl: true, instagramUrl: true, twitterUrl: true,
  linkedinUrl: true, youtubeUrl: true, tiktokUrl: true,
  snapchatUrl: true, otherLinks: true,
  createdAt: true, updatedAt: true,
  user: {
    select: {
      id: true, clerkId: true, email: true,
      fullName: true, avatarUrl: true, isActive: true, role: true,
    },
  },
} satisfies Prisma.EmployeeProfileSelect;

const detailSelect = {
  ...listSelect,
  bioEn: true, bioAr: true,
  user: {
    select: {
      id: true, clerkId: true, email: true,
      fullName: true, phone: true, avatarUrl: true,
      role: true, isActive: true, isEmployee: true, createdAt: true,
      _count: {
        select: {
          requests: true, clientBookings: true,
          uploadedFiles: true, notifications: true, chatSessions: true,
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
} satisfies Prisma.EmployeeProfileSelect;

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED RETURN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type EmployeeListItem   = Prisma.EmployeeProfileGetPayload<{ select: typeof listSelect }>;
export type EmployeeDetailRaw  = Prisma.EmployeeProfileGetPayload<{ select: typeof detailSelect }>;

// Subscription amounts arrive as Prisma.Decimal; we serialize to number at the boundary.
export type EmployeeDetail = Omit<EmployeeDetailRaw, 'user'> & {
  user: Omit<EmployeeDetailRaw['user'], 'subscription'> & {
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
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function serializeProfile(raw: EmployeeDetailRaw): EmployeeDetail {
  const { subscription } = raw.user;
  return {
    ...raw,
    user: {
      ...raw.user,
      subscription: subscription
        ? {
            ...subscription,
            items: subscription.items.map((item) => ({
              ...item,
              plan: item.plan ? { ...item.plan, amount: Number(item.plan.amount) } : null,
            })),
          }
        : null,
    },
  };
}

async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const hit = await prisma.employeeProfile.findUnique({
    where: { slug },
    select: { id: true },
  });
  return !hit || hit.id === excludeId;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIST EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployees(
  params: GetEmployeesParams = {}
): Promise<ActionResult<{ employees: EmployeeListItem[]; nextCursor: string | null; total: number }>> {
  try {
    await requireAdmin();

    const take      = Math.min(params.take ?? 20, 100);
    const sortBy    = params.sortBy    ?? 'displayOrder';
    const sortOrder = params.sortOrder ?? 'asc';
    const search    = params.search?.trim();

    const userFilter: Prisma.UserWhereInput = {
      isDeleted: false,
      isEmployee: true,
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    };

    const where: Prisma.EmployeeProfileWhereInput = {
      user: userFilter,
      ...(params.status && { status: params.status }),
      ...(search && {
        OR: [
          { positionEn: { contains: search, mode: 'insensitive' } },
          { positionAr: { contains: search, mode: 'insensitive' } },
          { slug:       { contains: search, mode: 'insensitive' } },
          { user: { email:    { contains: search, mode: 'insensitive' } } },
          { user: { fullName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const orderBy: Prisma.EmployeeProfileOrderByWithRelationInput =
      sortBy === 'fullName'
        ? { user: { fullName: sortOrder } }
        : { [sortBy]: sortOrder };

    const [total, rows] = await Promise.all([
      prisma.employeeProfile.count({ where }),
      prisma.employeeProfile.findMany({
        where,
        orderBy,
        take: take + 1,
        skip: params.cursor ? 1 : 0,
        cursor: params.cursor ? { id: params.cursor } : undefined,
        select: listSelect,
      }),
    ]);

    let nextCursor: string | null = null;
    if (rows.length > take) nextCursor = rows.pop()!.id;

    return { success: true, data: { employees: rows, nextCursor, total } };
  } catch (err) {
    console.error('[getEmployees]', err);
    return { success: false, error: 'Failed to fetch employees' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET BY PROFILE ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployeeById(
  id: string
): Promise<ActionResult<{ employee: EmployeeDetail }>> {
  try {
    await requireAdmin();

    const raw = await prisma.employeeProfile.findUnique({ where: { id }, select: detailSelect });
    if (!raw) return { success: false, error: 'Employee profile not found' };

    return { success: true, data: { employee: serializeProfile(raw) } };
  } catch (err) {
    console.error('[getEmployeeById]', err);
    return { success: false, error: 'Failed to fetch employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET BY USER ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployeeByUserId(
  userId: string
): Promise<ActionResult<{ employee: EmployeeDetail }>> {
  try {
    await requireAdmin();

    const raw = await prisma.employeeProfile.findUnique({ where: { userId }, select: detailSelect });
    if (!raw) return { success: false, error: 'Employee profile not found' };

    return { success: true, data: { employee: serializeProfile(raw) } };
  } catch (err) {
    console.error('[getEmployeeByUserId]', err);
    return { success: false, error: 'Failed to fetch employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PROMOTE USER → EMPLOYEE
// ─────────────────────────────────────────────────────────────────────────────

export async function promoteToEmployee(
  userId: string
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, isEmployee: true, employeeProfile: { select: { id: true } } },
    });

    if (!user)            return { success: false, error: 'User not found' };
    if (user.isEmployee)  return { success: false, error: 'User is already an employee' };
    if (user.employeeProfile) return { success: false, error: 'Employee profile already exists' };

    const [, profile] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { isEmployee: true } }),
      prisma.employeeProfile.create({ data: { userId, status: 'DRAFT', displayOrder: 0 } }),
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
  } catch (err) {
    console.error('[promoteToEmployee]', err);
    return { success: false, error: 'Failed to promote user to employee' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DEMOTE EMPLOYEE → USER
// ─────────────────────────────────────────────────────────────────────────────

export async function demoteFromEmployee(
  userId: string,
  reason?: string
): Promise<ActionResult<{ userId: string }>> {
  try {
    const adminId = await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, isEmployee: true, employeeProfile: { select: { id: true } } },
    });

    if (!user)            return { success: false, error: 'User not found' };
    if (!user.isEmployee) return { success: false, error: 'User is not an employee' };

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { isEmployee: false } }),
      ...(user.employeeProfile
        ? [prisma.employeeProfile.update({
            where: { id: user.employeeProfile.id },
            data: { status: 'DRAFT' },
          })]
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
  } catch (err) {
    console.error('[demoteFromEmployee]', err);
    return { success: false, error: 'Failed to demote employee' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CREATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function createEmployeeProfile(
  rawParams: z.infer<typeof createProfileSchema>
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();
    const { userId, slug, otherLinks, ...rest } = createProfileSchema.parse(rawParams);

    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      select: { id: true, isEmployee: true, employeeProfile: { select: { id: true } } },
    });

    if (!user)                return { success: false, error: 'User not found' };
    if (!user.isEmployee)     return { success: false, error: 'Promote user to employee first' };
    if (user.employeeProfile) return { success: false, error: 'Profile already exists' };

    if (slug && !(await isSlugAvailable(slug))) {
      return { success: false, error: 'Slug is already in use' };
    }

    const profile = await prisma.employeeProfile.create({
      data: {
        userId,
        ...rest,
        slug: slug ?? null,
        otherLinks: otherLinks ? (otherLinks as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'CREATE_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: profile.id,
        changes: { userId } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: profile.id } };
  } catch (err) {
    console.error('[createEmployeeProfile]', err);
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message };
    return { success: false, error: 'Failed to create employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateEmployeeProfile(
  rawParams: z.infer<typeof updateProfileSchema>
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();
    const { id, slug, otherLinks, ...rest } = updateProfileSchema.parse(rawParams);

    const existing = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existing) return { success: false, error: 'Employee profile not found' };

    if (slug && slug !== existing.slug && !(await isSlugAvailable(slug, id))) {
      return { success: false, error: 'Slug is already in use' };
    }

    const data: Prisma.EmployeeProfileUpdateInput = {
      ...rest,
      ...(slug !== undefined && { slug }),
      ...(otherLinks !== undefined && {
        otherLinks: otherLinks ? (otherLinks as Prisma.InputJsonValue) : Prisma.JsonNull,
      }),
    };

    await prisma.employeeProfile.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: id,
        changes: data as Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: id } };
  } catch (err) {
    console.error('[updateEmployeeProfile]', err);
    if (err instanceof z.ZodError) return { success: false, error: err.issues[0].message };
    return { success: false, error: 'Failed to update employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PUBLISH
// ─────────────────────────────────────────────────────────────────────────────

export async function publishEmployeeProfile(
  id: string
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      select: {
        id: true, status: true,
        user: { select: { isEmployee: true, isDeleted: true } },
      },
    });

    if (!profile)                       return { success: false, error: 'Profile not found' };
    if (profile.user.isDeleted)         return { success: false, error: 'User has been deleted' };
    if (!profile.user.isEmployee)       return { success: false, error: 'User is no longer an employee' };
    if (profile.status === 'PUBLISHED') return { success: false, error: 'Profile is already published' };

    await prisma.employeeProfile.update({ where: { id }, data: { status: 'PUBLISHED' } });

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
  } catch (err) {
    console.error('[publishEmployeeProfile]', err);
    return { success: false, error: 'Failed to publish employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. UNPUBLISH
// ─────────────────────────────────────────────────────────────────────────────

export async function unpublishEmployeeProfile(
  id: string,
  reason?: string
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!profile)                  return { success: false, error: 'Profile not found' };
    if (profile.status === 'DRAFT') return { success: false, error: 'Profile is already unpublished' };

    await prisma.employeeProfile.update({ where: { id }, data: { status: 'DRAFT' } });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'UNPUBLISH_EMPLOYEE_PROFILE',
        entity: 'EmployeeProfile',
        entityId: id,
        changes: { reason: reason ?? 'No reason provided' } satisfies Prisma.InputJsonValue,
      },
    });

    return { success: true, data: { profileId: id } };
  } catch (err) {
    console.error('[unpublishEmployeeProfile]', err);
    return { success: false, error: 'Failed to unpublish employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. BULK REORDER (drag-and-drop)
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderEmployees(
  rawParams: z.infer<typeof reorderSchema>
): Promise<ActionResult<{ updated: number }>> {
  try {
    const adminId = await requireAdmin();
    const { items } = reorderSchema.parse(rawParams);

    await prisma.$transaction(
      items.map(({ id, displayOrder }) =>
        prisma.employeeProfile.update({ where: { id }, data: { displayOrder } })
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
  } catch (err) {
    console.error('[reorderEmployees]', err);
    return { success: false, error: 'Failed to reorder employees' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. DELETE PROFILE  (hard delete + resets isEmployee on user)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteEmployeeProfile(
  id: string
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const adminId = await requireAdmin();

    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!profile) return { success: false, error: 'Profile not found' };

    await prisma.$transaction([
      prisma.employeeProfile.delete({ where: { id } }),
      prisma.user.update({ where: { id: profile.userId }, data: { isEmployee: false } }),
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
  } catch (err) {
    console.error('[deleteEmployeeProfile]', err);
    return { success: false, error: 'Failed to delete employee profile' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. ELIGIBLE USERS  (no profile yet — for the promote picker)
// ─────────────────────────────────────────────────────────────────────────────

export type EligibleUser = {
  id: string; email: string; fullName: string | null;
  avatarUrl: string | null; role: UserRole;
};

export async function getEligibleUsers(
  params: { search?: string; take?: number } = {}
): Promise<ActionResult<{ users: EligibleUser[]; total: number }>> {
  try {
    await requireAdmin();

    const take   = Math.min(params.take ?? 20, 100);
    const search = params.search?.trim();

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      isEmployee: false,
      employeeProfile: null,
      ...(search && {
        OR: [
          { email:    { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

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
  } catch (err) {
    console.error('[getEligibleUsers]', err);
    return { success: false, error: 'Failed to fetch eligible users' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. AUDIT LOGS FOR A PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileAuditEntry = {
  id: string; action: string; entity: string; entityId: string | null;
  changes: unknown; createdAt: Date;
  admin: { id: string; fullName: string | null; email: string } | null;
};

export async function getEmployeeProfileAuditLogs(
  profileId: string,
  take = 30
): Promise<ActionResult<{ logs: ProfileAuditEntry[] }>> {
  try {
    await requireAdmin();

    const logs = await prisma.auditLog.findMany({
      where: { entity: 'EmployeeProfile', entityId: profileId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
      select: {
        id: true, action: true, entity: true, entityId: true,
        changes: true, createdAt: true,
        admin: { select: { id: true, fullName: true, email: true } },
      },
    });

    return { success: true, data: { logs } };
  } catch (err) {
    console.error('[getEmployeeProfileAuditLogs]', err);
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. SLUG AVAILABILITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

export async function checkSlugAvailability(
  slug: string,
  excludeProfileId?: string
): Promise<ActionResult<{ available: boolean }>> {
  try {
    await requireAdmin();

    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const available = await isSlugAvailable(parsed.data, excludeProfileId);
    return { success: true, data: { available } };
  } catch (err) {
    console.error('[checkSlugAvailability]', err);
    return { success: false, error: 'Failed to check slug availability' };
  }
}