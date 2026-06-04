"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Calculator,
  Loader2,
  Plane,
  Ship,
  Truck,
  Package,
  Ruler,
  Weight,
  DollarSign,
} from "lucide-react";

import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import YE from "country-flag-icons/react/3x2/YE";
import AE from "country-flag-icons/react/3x2/AE";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  calculatePublicShippingEstimate,
  type CalculationMode,
} from "./actions";

const DESTINATIONS = [
  { code: "US", label: "United States", Flag: US },
  { code: "SA", label: "Saudi Arabia", Flag: SA },
  { code: "YE", label: "Yemen", Flag: YE },
  { code: "AE", label: "Dubai / UAE", Flag: AE },
];

const FREIGHT_TYPES = [
  { value: "AIR", label: "Air Freight", Icon: Plane },
  { value: "SEA", label: "Sea Freight", Icon: Ship },
  { value: "LAND", label: "Land Freight", Icon: Truck },
];

type EstimateResult = {
  id: string;
  estimatedCost: number;
  currency: string;
  transitDays: number | null;
  originCountry: string;
  destinationCountry: string;
  freightType: string;
  calculationMode: string;
  weightKg: number | null;
  volumeCbm: number | null;
  quantity: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShippingEstimateDialog({ open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EstimateResult | null>(null);

  const [form, setForm] = useState({
    destinationCountry: "",
    freightType: "AIR",
    calculationMode: "PER_KG" as CalculationMode,
    goodsType: "",
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    quantity: "1",
  });

  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  const inputCls =
    "h-10 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";

  const handleCalculate = () => {
    setResult(null);

    startTransition(async () => {
      const res = await calculatePublicShippingEstimate({
        destinationCountry: form.destinationCountry,
        freightType: form.freightType,
        calculationMode: form.calculationMode,
        goodsType: form.goodsType || null,
        weightKg: form.weightKg,
        lengthCm: form.lengthCm,
        widthCm: form.widthCm,
        heightCm: form.heightCm,
        quantity: form.quantity,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      setResult(res.data as EstimateResult);
      toast.success("Shipping estimate calculated");
    });
  };

  const selectedDestination = DESTINATIONS.find(
    (item) => item.code === form.destinationCountry,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl border border-border/50 bg-card p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/10">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#7b57fc]" />
            Shipping Estimation
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Origin</Label>
              <div
                className={cn(
                  inputCls,
                  "flex items-center gap-2 px-3 pointer-events-none",
                )}
              >
                <CN className="w-4 h-4 rounded-sm shrink-0" />
                <span className="text-sm font-medium">China</span>
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                  CN
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Destination</Label>
              <Select
                value={form.destinationCountry}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    destinationCountry: value,
                  }))
                }
              >
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATIONS.map(({ code, label, Flag }) => (
                    <SelectItem key={code} value={code}>
                      <span className="inline-flex items-center gap-2">
                        <Flag className="w-4 h-4 rounded-sm shrink-0" />
                        <span>{label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {code}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Freight Type</Label>
              <Select
                value={form.freightType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    freightType: value,
                  }))
                }
              >
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREIGHT_TYPES.map(({ value, label, Icon }) => (
                    <SelectItem key={value} value={value}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Calculation Mode</Label>
              <Select
                value={form.calculationMode}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    calculationMode: value as CalculationMode,
                    weightKg: value === "PER_KG" ? prev.weightKg : "",
                    lengthCm: value === "PER_CBM" ? prev.lengthCm : "",
                    widthCm: value === "PER_CBM" ? prev.widthCm : "",
                    heightCm: value === "PER_CBM" ? prev.heightCm : "",
                  }))
                }
              >
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_KG">Per KG</SelectItem>
                  <SelectItem value="PER_CBM">Per CBM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.calculationMode === "PER_KG" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelCls}>Weight KG</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.weightKg}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        weightKg: e.target.value,
                      }))
                    }
                    placeholder="10"
                    className={cn(inputCls, "pl-9")}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className={inputCls}
                  dir="ltr"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className={labelCls}>Length CM</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.lengthCm}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      lengthCm: e.target.value,
                    }))
                  }
                  placeholder="40"
                  className={inputCls}
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Width CM</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.widthCm}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      widthCm: e.target.value,
                    }))
                  }
                  placeholder="30"
                  className={inputCls}
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Height CM</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.heightCm}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      heightCm: e.target.value,
                    }))
                  }
                  placeholder="25"
                  className={inputCls}
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className={inputCls}
                  dir="ltr"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className={labelCls}>Goods Type</Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={form.goodsType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    goodsType: e.target.value,
                  }))
                }
                placeholder="General goods"
                className={cn(inputCls, "pl-9")}
              />
            </div>
          </div>

          {result && (
            <div className="rounded-2xl border border-[#7b57fc]/20 bg-[#7b57fc]/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Estimated Cost
                  </p>
                  <p className="text-2xl font-bold text-[#7b57fc]">
                    {result.estimatedCost.toLocaleString()} {result.currency}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-2xl bg-[#7b57fc]/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#7b57fc]" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-xl bg-background/70 border border-border/40 p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    Route
                  </p>
                  <p className="text-xs font-semibold flex items-center gap-1.5 mt-1">
                    <CN className="w-4 h-4 rounded-sm" />
                    →
                    {selectedDestination && (
                      <selectedDestination.Flag className="w-4 h-4 rounded-sm" />
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-background/70 border border-border/40 p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    Transit
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    {result.transitDays ? `${result.transitDays} days` : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-background/70 border border-border/40 p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    Weight
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    {result.weightKg ? `${result.weightKg} kg` : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-background/70 border border-border/40 p-2.5">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    Volume
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    {result.volumeCbm ? `${result.volumeCbm} CBM` : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            disabled={
              isPending ||
              !form.destinationCountry ||
              !form.freightType ||
              (form.calculationMode === "PER_KG" && !form.weightKg) ||
              (form.calculationMode === "PER_CBM" &&
                (!form.lengthCm || !form.widthCm || !form.heightCm))
            }
            onClick={handleCalculate}
            className="w-full h-10 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Calculate Shipping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}