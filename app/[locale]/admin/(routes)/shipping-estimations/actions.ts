// app/[locale]/admin/(routes)/shipping-estimations/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CalculationMode = "PER_KG" | "PER_CBM";

export type ShippingRateInput = {
  originCountry: string;
  destinationCountry: string;
  freightType: string;
  calculationMode: CalculationMode;
  goodsType?: string | null;
  baseFee?: number | string | null;
  ratePerKg?: number | string | null;
  ratePerCbm?: number | string | null;
  minCharge?: number | string | null;
  transitDaysMin?: number | string | null;
  transitDaysMax?: number | string | null;
  currency?: string | null;
  isActive?: boolean;
};

const ADMIN_PATH = "/admin/shipping-estimations";

function cleanText(value: string) {
  return value.trim().toUpperCase();
}

function nullableCleanText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.toUpperCase() : null;
}

function toDecimalNumber(value?: number | string | null, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;

  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;

  return Number(num.toFixed(2));
}

function toNullableDecimalNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return null;

  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;

  return Number(num.toFixed(2));
}

function toNullableInt(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return null;

  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) return null;

  return num;
}

function validateRateInput(input: ShippingRateInput) {
  if (!input.originCountry?.trim()) {
    throw new Error("Origin country is required.");
  }

  if (!input.destinationCountry?.trim()) {
    throw new Error("Destination country is required.");
  }

  if (!input.freightType?.trim()) {
    throw new Error("Freight type is required.");
  }

  if (!["PER_KG", "PER_CBM"].includes(input.calculationMode)) {
    throw new Error("Invalid calculation mode.");
  }

  if (input.calculationMode === "PER_KG" && !toNullableDecimalNumber(input.ratePerKg)) {
    throw new Error("Rate per KG is required for PER_KG calculation.");
  }

  if (input.calculationMode === "PER_CBM" && !toNullableDecimalNumber(input.ratePerCbm)) {
    throw new Error("Rate per CBM is required for PER_CBM calculation.");
  }
}

function normalizeRateInput(input: ShippingRateInput) {
  validateRateInput(input);

  const calculationMode = input.calculationMode;

  return {
    originCountry: cleanText(input.originCountry),
    destinationCountry: cleanText(input.destinationCountry),
    freightType: cleanText(input.freightType),
    calculationMode,
    goodsType: nullableCleanText(input.goodsType),
    baseFee: toDecimalNumber(input.baseFee, 0),
    ratePerKg:
      calculationMode === "PER_KG"
        ? toNullableDecimalNumber(input.ratePerKg)
        : null,
    ratePerCbm:
      calculationMode === "PER_CBM"
        ? toNullableDecimalNumber(input.ratePerCbm)
        : null,
    minCharge: toDecimalNumber(input.minCharge, 0),
    transitDaysMin: toNullableInt(input.transitDaysMin),
    transitDaysMax: toNullableInt(input.transitDaysMax),
    currency: cleanText(input.currency || "USD"),
    isActive: input.isActive ?? true,
  };
}

export async function getShippingRates() {
  const rates = await prisma.shippingRate.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return rates.map((rate) => ({
    ...rate,
    baseFee: Number(rate.baseFee),
    ratePerKg: rate.ratePerKg === null ? null : Number(rate.ratePerKg),
    ratePerCbm: rate.ratePerCbm === null ? null : Number(rate.ratePerCbm),
    minCharge: Number(rate.minCharge),
  }));
}

export async function getShippingRateById(id: string) {
  if (!id) return null;

  const rate = await prisma.shippingRate.findUnique({
    where: { id },
  });

  if (!rate) return null;

  return {
    ...rate,
    baseFee: Number(rate.baseFee),
    ratePerKg: rate.ratePerKg === null ? null : Number(rate.ratePerKg),
    ratePerCbm: rate.ratePerCbm === null ? null : Number(rate.ratePerCbm),
    minCharge: Number(rate.minCharge),
  };
}

export async function createShippingRate(input: ShippingRateInput) {
  const data = normalizeRateInput(input);

  const rate = await prisma.shippingRate.create({
    data,
  });

  revalidatePath(ADMIN_PATH);

  return {
    success: true,
    rate,
  };
}

export async function updateShippingRate(id: string, input: ShippingRateInput) {
  if (!id) {
    throw new Error("Shipping rate ID is required.");
  }

  const data = normalizeRateInput(input);

  const rate = await prisma.shippingRate.update({
    where: { id },
    data,
  });

  revalidatePath(ADMIN_PATH);

  return {
    success: true,
    rate,
  };
}

export async function deleteShippingRate(id: string) {
  if (!id) {
    throw new Error("Shipping rate ID is required.");
  }

  await prisma.shippingRate.delete({
    where: { id },
  });

  revalidatePath(ADMIN_PATH);

  return {
    success: true,
  };
}

export async function toggleShippingRateStatus(id: string) {
  if (!id) {
    throw new Error("Shipping rate ID is required.");
  }

  const current = await prisma.shippingRate.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!current) {
    throw new Error("Shipping rate not found.");
  }

  const rate = await prisma.shippingRate.update({
    where: { id },
    data: {
      isActive: !current.isActive,
    },
  });

  revalidatePath(ADMIN_PATH);

  return {
    success: true,
    rate,
  };
}

export async function getShippingEstimates() {
  const estimates = await prisma.shippingEstimate.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return estimates.map((estimate) => ({
    ...estimate,
    weightKg: estimate.weightKg === null ? null : Number(estimate.weightKg),
    lengthCm: estimate.lengthCm === null ? null : Number(estimate.lengthCm),
    widthCm: estimate.widthCm === null ? null : Number(estimate.widthCm),
    heightCm: estimate.heightCm === null ? null : Number(estimate.heightCm),
    volumeCbm: estimate.volumeCbm === null ? null : Number(estimate.volumeCbm),
    chargeableWeightKg:
      estimate.chargeableWeightKg === null
        ? null
        : Number(estimate.chargeableWeightKg),
    baseFee: Number(estimate.baseFee),
    ratePerKg: estimate.ratePerKg === null ? null : Number(estimate.ratePerKg),
    ratePerCbm:
      estimate.ratePerCbm === null ? null : Number(estimate.ratePerCbm),
    estimatedCost: Number(estimate.estimatedCost),
  }));
}

export async function deleteShippingEstimate(id: string) {
  if (!id) {
    throw new Error("Shipping estimate ID is required.");
  }

  await prisma.shippingEstimate.delete({
    where: { id },
  });

  revalidatePath(ADMIN_PATH);

  return {
    success: true,
  };
}