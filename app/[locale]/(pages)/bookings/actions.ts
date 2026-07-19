"use server";

// app/[locale]/(pages)/bookings/actions.ts

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { notifyAdminsOnNewSubmission } from "@/lib/notifications/notify";
import { BookingType } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const videoBookingSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  bookingType: z.nativeEnum(BookingType),
  requestNotes: z.string().min(10, "Please describe your needs (min 10 chars)"),
  preferredDate: z.string().optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

// Schema for guest users — phone is required
const guestSchema = videoBookingSchema.extend({
  phone: z.string().min(6, "Phone number is required for guest submissions"),
});

export type VideoBookingInput = z.infer<typeof videoBookingSchema>;

export type SubmitResult =
  | { success: true; bookingId: string }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────
// Submit
// ─────────────────────────────────────────────────────────────

export async function submitVideoBooking(
  raw: VideoBookingInput,
): Promise<SubmitResult> {
  try {
    // Detect auth state
    const { userId: clerkId } = await auth();
    let clientId: string | null = null;

    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId, isDeleted: false, isActive: true },
        select: { id: true },
      });
      clientId = user?.id ?? null;
    }

    // Guest users must provide phone
    const schema = clientId ? videoBookingSchema : guestSchema;
    const data = schema.parse(raw);

    // Create the booking
    const booking = await prisma.videoBooking.create({
      data: {
        clientId: clientId,
        guestFullName: data.fullName,
        guestEmail: data.email,
        guestPhone: data.phone || null,
        type: data.bookingType,
        requestNotes: data.requestNotes,
        status: "REQUESTED",
        durationMinutes: 30,
      },
    });

    // Notify admins
    const isAr = data.locale === "ar";
    const bookingTypeLabels: Record<string, { ar: string; en: string }> = {
      MARKET: { ar: "جولة سوق", en: "Market Tour" },
      FACTORY: { ar: "زيارة مصنع", en: "Factory Visit" },
      CUSTOM: { ar: "استشارة مخصصة", en: "Custom Consultation" },
    };
    const label = bookingTypeLabels[data.bookingType] || { ar: data.bookingType, en: data.bookingType };
    const typeName = isAr ? label.ar : label.en;

    const detailsParts = [
      isAr ? `النوع: ${typeName}` : `Type: ${typeName}`,
      data.preferredDate
        ? isAr
          ? `التاريخ المفضل: ${data.preferredDate}`
          : `Preferred date: ${data.preferredDate}`
        : "",
      isAr ? `ملاحظات: ${data.requestNotes}` : `Notes: ${data.requestNotes}`,
    ].filter(Boolean);

    notifyAdminsOnNewSubmission(
      "booking",
      {
        guestName: data.fullName,
        guestEmail: data.email,
        details: detailsParts.join(" | "),
        adminUrl: `/admin/bookings`,
        bookingType: typeName,
        notes: data.requestNotes,
        preferredDate: data.preferredDate,
      },
      data.locale,
    ).catch(() => {});

    return { success: true, bookingId: booking.id };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return { success: false, error: first?.message || "Validation failed." };
    }
    console.error("[submitVideoBooking]", err);
    return { success: false, error: "Failed to submit booking. Please try again." };
  }
}
