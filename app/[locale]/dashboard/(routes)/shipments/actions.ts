"use server"

// app/[locale]/dashboard/(routes)/shipments/actions.ts

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

async function requireClient() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("UNAUTHORIZED")

  const user = await prisma.user.findUnique({
    where: { clerkId, isDeleted: false, isActive: true },
    select: { id: true },
  })
  if (!user) throw new Error("USER_NOT_FOUND")
  return user
}

function authError(err: unknown): ActionResult<never> {
  const msg = err instanceof Error ? err.message : ""
  if (msg === "UNAUTHORIZED") return { success: false, error: "Please sign in to continue." }
  if (msg === "USER_NOT_FOUND") return { success: false, error: "Account not found." }
  return { success: false, error: "An unexpected error occurred." }
}

export interface MyShipmentRow {
  id: string
  trackingCode: string
  productDescription: string
  originCountry: string
  destinationCountry: string
  freightType: string
  status: string
  estimatedDelivery: string | null
  createdAt: string
}

export async function getMyShipments(): Promise<ActionResult<MyShipmentRow[]>> {
  try {
    const user = await requireClient()
    const shipments = await prisma.shipment.findMany({
      where: { clientId: user.id, isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        trackingCode: true,
        productDescription: true,
        originCountry: true,
        destinationCountry: true,
        freightType: true,
        status: true,
        estimatedDelivery: true,
        createdAt: true,
      },
    })
    return {
      success: true,
      data: shipments.map((s) => ({
        ...s,
        estimatedDelivery: s.estimatedDelivery?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
    }
  } catch (err) {
    console.error("[getMyShipments]", err)
    return authError(err)
  }
}
