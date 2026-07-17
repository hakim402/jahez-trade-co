"use server";

import { prisma } from "@/lib/prisma";

export type CalculationMode = "PER_KG" | "PER_CBM";

export type PublicShippingEstimateInput = {
  destinationCountry: string;
  freightType: string;
  calculationMode: CalculationMode;
  goodsType?: string | null;

  weightKg?: number | string | null;
  lengthCm?: number | string | null;
  widthCm?: number | string | null;
  heightCm?: number | string | null;
  quantity?: number | string | null;
};

const ORIGIN_COUNTRY_ALIASES = ["CN", "CHINA"];
const SUPPORTED_DESTINATIONS = ["US", "SA", "YE", "AE"] as const;

function cleanText(value: string) {
  return value.trim().toUpperCase();
}

function nullableCleanText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.toUpperCase() : null;
}

function toNumber(value?: number | string | null, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;

  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;

  return num;
}

function toPositiveInt(value?: number | string | null, fallback = 1) {
  const num = Number(value);

  if (!Number.isInteger(num) || num <= 0) return fallback;

  return num;
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function validateInput(input: PublicShippingEstimateInput) {
  const destinationCountry = cleanText(input.destinationCountry || "");
  const freightType = cleanText(input.freightType || "");

  if (!destinationCountry) {
    throw new Error("Destination country is required.");
  }

  if (!SUPPORTED_DESTINATIONS.includes(destinationCountry as any)) {
    throw new Error("This destination is not supported yet.");
  }

  if (!freightType) {
    throw new Error("Freight type is required.");
  }

  if (!["AIR", "SEA", "LAND"].includes(freightType)) {
    throw new Error("Invalid freight type.");
  }

  if (!["PER_KG", "PER_CBM"].includes(input.calculationMode)) {
    throw new Error("Invalid calculation mode.");
  }

  if (input.calculationMode === "PER_KG") {
    const weightKg = toNumber(input.weightKg);

    if (weightKg <= 0) {
      throw new Error("Weight is required for KG calculation.");
    }
  }

  if (input.calculationMode === "PER_CBM") {
    const lengthCm = toNumber(input.lengthCm);
    const widthCm = toNumber(input.widthCm);
    const heightCm = toNumber(input.heightCm);

    if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
      throw new Error(
        "Length, width, and height are required for CBM calculation.",
      );
    }
  }
}

export async function calculatePublicShippingEstimate(
  input: PublicShippingEstimateInput,
) {
  try {
    validateInput(input);

    const destinationCountry = cleanText(input.destinationCountry);
    const freightType = cleanText(input.freightType);
    const calculationMode = input.calculationMode;
    const goodsType = nullableCleanText(input.goodsType);

    const quantity = toPositiveInt(input.quantity, 1);

    const weightKg = toNumber(input.weightKg);
    const totalWeightKg = round(weightKg * quantity, 3);

    const lengthCm = toNumber(input.lengthCm);
    const widthCm = toNumber(input.widthCm);
    const heightCm = toNumber(input.heightCm);

    const volumeCbm =
      lengthCm > 0 && widthCm > 0 && heightCm > 0
        ? round(((lengthCm * widthCm * heightCm) / 1_000_000) * quantity, 4)
        : null;

    const rate = await prisma.shippingRate.findFirst({
      where: {
        originCountry: {
          in: ORIGIN_COUNTRY_ALIASES,
        },
        destinationCountry,
        freightType,
        calculationMode,
        isActive: true,
        OR: [{ goodsType }, { goodsType: null }],
      },
      orderBy: [{ goodsType: "desc" }, { createdAt: "desc" }],
    });

    if (!rate) {
      return {
        success: false,
        error: "No active shipping rate found for this route.",
      };
    }

    const baseFee = Number(rate.baseFee);
    const ratePerKg = rate.ratePerKg === null ? null : Number(rate.ratePerKg);
    const ratePerCbm = rate.ratePerCbm === null ? null : Number(rate.ratePerCbm);
    const minCharge = Number(rate.minCharge);

    let shippingCost = baseFee;
    let chargeableWeightKg: number | null = null;

    if (calculationMode === "PER_KG") {
      if (!ratePerKg || ratePerKg <= 0) {
        return {
          success: false,
          error: "Invalid KG rate configuration.",
        };
      }

      chargeableWeightKg = totalWeightKg;
      shippingCost += totalWeightKg * ratePerKg;
    }

    if (calculationMode === "PER_CBM") {
      if (!ratePerCbm || ratePerCbm <= 0) {
        return {
          success: false,
          error: "Invalid CBM rate configuration.",
        };
      }

      if (!volumeCbm || volumeCbm <= 0) {
        return {
          success: false,
          error: "Volume is required for CBM calculation.",
        };
      }

      shippingCost += volumeCbm * ratePerCbm;
    }

    const estimatedCost = round(Math.max(shippingCost, minCharge), 2);

    const transitDays =
      rate.transitDaysMin && rate.transitDaysMax
        ? Math.ceil((rate.transitDaysMin + rate.transitDaysMax) / 2)
        : rate.transitDaysMin || rate.transitDaysMax || null;

    const estimate = await prisma.shippingEstimate.create({
      data: {
        originCountry: rate.originCountry,
        destinationCountry,
        freightType,
        calculationMode,
        goodsType,

        weightKg: totalWeightKg || null,
        lengthCm: lengthCm || null,
        widthCm: widthCm || null,
        heightCm: heightCm || null,
        quantity,

        volumeCbm,
        chargeableWeightKg,

        baseFee,
        ratePerKg,
        ratePerCbm,

        estimatedCost,
        currency: rate.currency,
        transitDays,

        notes: `Calculated from active rate: ${rate.id}`,
      },
    });

    return {
      success: true,
      data: {
        id: estimate.id,
        originCountry: estimate.originCountry,
        destinationCountry: estimate.destinationCountry,
        freightType: estimate.freightType,
        calculationMode: estimate.calculationMode,
        goodsType: estimate.goodsType,

        weightKg: estimate.weightKg === null ? null : Number(estimate.weightKg),
        lengthCm: estimate.lengthCm === null ? null : Number(estimate.lengthCm),
        widthCm: estimate.widthCm === null ? null : Number(estimate.widthCm),
        heightCm: estimate.heightCm === null ? null : Number(estimate.heightCm),
        quantity: estimate.quantity,

        volumeCbm:
          estimate.volumeCbm === null ? null : Number(estimate.volumeCbm),

        chargeableWeightKg:
          estimate.chargeableWeightKg === null
            ? null
            : Number(estimate.chargeableWeightKg),

        baseFee: Number(estimate.baseFee),
        ratePerKg:
          estimate.ratePerKg === null ? null : Number(estimate.ratePerKg),
        ratePerCbm:
          estimate.ratePerCbm === null ? null : Number(estimate.ratePerCbm),

        estimatedCost: Number(estimate.estimatedCost),
        currency: estimate.currency,
        transitDays: estimate.transitDays,
        createdAt: estimate.createdAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate shipping estimate.",
    };
  }
}

export async function getPublicShippingDestinations() {
  return [
    {
      code: "US",
      label: "United States",
    },
    {
      code: "SA",
      label: "Saudi Arabia",
    },
    {
      code: "YE",
      label: "Yemen",
    },
    {
      code: "AE",
      label: "Dubai / UAE",
    },
  ];
}