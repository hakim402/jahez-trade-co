// app/actions/public/employees.ts
"use server";

import { prisma } from "@/lib/prisma";
import { cache } from "react";

// ------------------------------------------------------------------
// 1. Type-safe return shapes (only what's safe to expose publicly)
// ------------------------------------------------------------------
export type PublicEmployee = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  slug: string | null;
  positionEn: string | null;
  positionAr: string | null;
  shortBioEn: string | null;
  shortBioAr: string | null;
  photoUrl: string | null;
  photoAltEn: string | null;
  photoAltAr: string | null;
};

export type PublicEmployeeDetail = PublicEmployee & {
  bioEn: string | null;
  bioAr: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  otherLinks: unknown; // JSON – optional typed version below
};

// ------------------------------------------------------------------
// 2. Core queries (reused & cached)
// ------------------------------------------------------------------

/**
 * Get all published, active employees ordered by displayOrder.
 * Safe to call from Client Components (Server Action).
 */
export async function getPublicEmployees(): Promise<PublicEmployee[]> {
  const employees = await prisma.employeeProfile.findMany({
    where: {
      status: "PUBLISHED",
      user: {
        isActive: true,
        isDeleted: false,
        isEmployee: true,
      },
    },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      slug: true,
      positionEn: true,
      positionAr: true,
      shortBioEn: true,
      shortBioAr: true,
      photoUrl: true,
      photoAltEn: true,
      photoAltAr: true,
      user: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Flatten the user relation into the top-level object
  return employees.map(({ user, ...rest }) => ({
    ...rest,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  }));
}

/**
 * Get a single employee by slug (for detail pages).
 * Returns null if not found / not publicly visible.
 */
export async function getPublicEmployeeBySlug(
  slug: string
): Promise<PublicEmployeeDetail | null> {
  const profile = await prisma.employeeProfile.findUnique({
    where: {
      slug,
      status: "PUBLISHED",
      user: {
        isActive: true,
        isDeleted: false,
        isEmployee: true,
      },
    },
    select: {
      id: true,
      slug: true,
      positionEn: true,
      positionAr: true,
      shortBioEn: true,
      shortBioAr: true,
      bioEn: true,
      bioAr: true,
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
      user: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!profile) return null;

  const { user, ...rest } = profile;
  return {
    ...rest,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  };
}

// ------------------------------------------------------------------
// 3. (Optional) Memoized server-side helpers
//    Use inside React Server Components to deduplicate fetches.
// ------------------------------------------------------------------
export const cachedGetPublicEmployees = cache(getPublicEmployees);
export const cachedGetPublicEmployeeBySlug = cache(getPublicEmployeeBySlug);