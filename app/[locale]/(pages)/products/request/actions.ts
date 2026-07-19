"use server";

// app/[locale]/(pages)/products/request/actions.ts

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { notifyAdminsOnNewSubmission } from "@/lib/notifications/notify";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const productRequestSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  productLink: z.string().optional(),
  description: z.string().min(10, "Please describe the product (min 10 chars)"),
  quantity: z.number().int().min(1).default(1),
  shippingCountry: z.string().min(1, "Shipping country is required"),
  customNotes: z.string().optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

// Schema for guest users — phone is required
const guestSchema = productRequestSchema.extend({
  phone: z.string().min(6, "Phone number is required for guest submissions"),
});

export type ProductRequestInput = z.infer<typeof productRequestSchema>;

export type SubmitResult =
  | { success: true; requestId: string }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────
// Submit
// ─────────────────────────────────────────────────────────────

export async function submitProductRequest(
  raw: ProductRequestInput,
): Promise<SubmitResult> {
  try {
    // Detect auth state
    const { userId: clerkId } = await auth();
    let clientId: string | null = null;

    if (clerkId) {
      // Signed-in user — link to their account, phone optional
      const user = await prisma.user.findUnique({
        where: { clerkId, isDeleted: false, isActive: true },
        select: { id: true },
      });
      clientId = user?.id ?? null;
    }

    // Guest users must provide phone
    const schema = clientId ? productRequestSchema : guestSchema;
    const data = schema.parse(raw);

    // Create the product request
    const request = await prisma.productRequest.create({
      data: {
        clientId: clientId,
        guestFullName: data.fullName,
        guestEmail: data.email,
        guestPhone: data.phone || null,
        productLink: data.productLink || null,
        description: data.description,
        quantity: data.quantity,
        shippingCountry: data.shippingCountry,
        customNotes: data.customNotes || null,
        status: "SUBMITTED",
      },
    });

    // Notify admins
    const isAr = data.locale === "ar";
    const detailsParts = [
      isAr ? `المنتج: ${data.description}` : `Product: ${data.description}`,
      isAr ? `الكمية: ${data.quantity}` : `Quantity: ${data.quantity}`,
      isAr
        ? `بلد الشحن: ${data.shippingCountry}`
        : `Shipping to: ${data.shippingCountry}`,
      data.productLink ? `🔗 ${data.productLink}` : "",
      data.customNotes
        ? isAr
          ? `ملاحظات: ${data.customNotes}`
          : `Notes: ${data.customNotes}`
        : "",
    ].filter(Boolean);

    notifyAdminsOnNewSubmission(
      "product",
      {
        guestName: data.fullName,
        guestEmail: data.email,
        details: detailsParts.join(" | "),
        adminUrl: `/admin/requests`,
        productDesc: data.description,
        quantity: data.quantity,
        shippingCountry: data.shippingCountry,
        notes: data.customNotes,
      },
      data.locale,
    ).catch(() => {});

    return { success: true, requestId: request.id };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return { success: false, error: first?.message || "Validation failed." };
    }
    console.error("[submitProductRequest]", err);
    return { success: false, error: "Failed to submit request. Please try again." };
  }
}
