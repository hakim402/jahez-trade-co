"use server";

// app/[locale]/(pages)/services/request/actions.ts

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { notifyAdminsOnNewSubmission } from "@/lib/notifications/notify";
import type { ConsultingServiceTopic } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Fetch active services for the dropdown
// ─────────────────────────────────────────────────────────────

export type ServiceOption = {
  id: string;
  title: string;
  titleAr: string | null;
  topic: ConsultingServiceTopic;
};

export async function getActiveConsultingServices(): Promise<ServiceOption[]> {
  try {
    const services = await prisma.consultingService.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true, title: true, titleAr: true, topic: true },
      orderBy: { sortOrder: "asc" },
    });
    return services;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const TOPICS = ["sourcing", "import", "logistics", "market_entry", "supplier", "other"] as const;

const consultingRequestSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  topic: z.enum(TOPICS),
  description: z.string().min(10, "Please describe your needs (min 10 chars)"),
  budget: z.string().optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

// Schema for guest users — phone is required
const guestSchema = consultingRequestSchema.extend({
  phone: z.string().min(6, "Phone number is required for guest submissions"),
});

export type ConsultingRequestInput = z.infer<typeof consultingRequestSchema>;

export type SubmitResult =
  | { success: true; requestId: string }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────
// Submit
// ─────────────────────────────────────────────────────────────

export async function submitGeneralConsultingRequest(
  raw: ConsultingRequestInput,
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
    const schema = clientId ? consultingRequestSchema : guestSchema;
    const data = schema.parse(raw);

    // Verify the service exists and is active
    const service = await prisma.consultingService.findUnique({
      where: { id: data.serviceId, isActive: true, isDeleted: false },
      select: { id: true, title: true, titleAr: true, topic: true },
    });

    if (!service) {
      return { success: false, error: "Service not found." };
    }

    // Create the consulting request
    const request = await prisma.consultingRequest.create({
      data: {
        userId: clientId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        topic: data.topic,
        description: data.description,
        budget: data.budget || null,
        status: "NEW",
      },
    });

    // Increment the service's request count
    prisma.consultingService
      .update({
        where: { id: service.id },
        data: { requestCount: { increment: 1 } },
      })
      .catch(() => {});

    // Notify admins
    const isAr = data.locale === "ar";
    const serviceName = isAr && service.titleAr ? service.titleAr : service.title;
    const detailsParts = [
      isAr ? `الخدمة: ${serviceName}` : `Service: ${serviceName}`,
      data.company
        ? isAr
          ? `الشركة: ${data.company}`
          : `Company: ${data.company}`
        : "",
      data.budget
        ? isAr
          ? `الميزانية: ${data.budget}`
          : `Budget: ${data.budget}`
        : "",
      isAr ? `الوصف: ${data.description}` : `Description: ${data.description}`,
    ].filter(Boolean);

    notifyAdminsOnNewSubmission(
      "consulting",
      {
        guestName: data.fullName,
        guestEmail: data.email,
        details: detailsParts.join(" | "),
        adminUrl: `/admin/consulting`,
        serviceTitle: serviceName,
        notes: data.description,
      },
      data.locale,
    ).catch(() => {});

    return { success: true, requestId: request.id };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return { success: false, error: first?.message || "Validation failed." };
    }
    console.error("[submitGeneralConsultingRequest]", err);
    return { success: false, error: "Failed to submit request. Please try again." };
  }
}

