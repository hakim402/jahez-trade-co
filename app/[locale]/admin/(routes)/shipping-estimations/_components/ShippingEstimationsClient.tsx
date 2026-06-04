"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit,
  Filter,
  Globe,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  Ship,
  Trash2,
  Truck,
  X,
  XCircle,
   Plane,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createShippingRate,
  deleteShippingEstimate,
  deleteShippingRate,
  toggleShippingRateStatus,
  updateShippingRate,
  type CalculationMode,
} from "../actions";

type Rate = {
  id: string;
  originCountry: string;
  destinationCountry: string;
  freightType: string;
  calculationMode: CalculationMode;
  goodsType: string | null;
  baseFee: number;
  ratePerKg: number | null;
  ratePerCbm: number | null;
  minCharge: number;
  transitDaysMin: number | null;
  transitDaysMax: number | null;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Estimate = {
  id: string;
  userId: string | null;
  originCountry: string;
  destinationCountry: string;
  freightType: string;
  calculationMode: string;
  goodsType: string | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  quantity: number;
  volumeCbm: number | null;
  chargeableWeightKg: number | null;
  baseFee: number;
  ratePerKg: number | null;
  ratePerCbm: number | null;
  estimatedCost: number;
  currency: string;
  transitDays: number | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
};

type Props = {
  initialRates: Rate[];
  initialEstimates: Estimate[];
};

const emptyForm = {
  originCountry: "",
  destinationCountry: "",
  freightType: "AIR",
  calculationMode: "PER_KG" as CalculationMode,
  goodsType: "",
  baseFee: "0",
  ratePerKg: "",
  ratePerCbm: "",
  minCharge: "0",
  transitDaysMin: "",
  transitDaysMax: "",
  currency: "USD",
  isActive: true,
};

function money(value: number, currency = "USD") {
  return `${Number(value || 0).toLocaleString()} ${currency}`;
}

const COUNTRY_OPTIONS = [
  { code: "US", label: "United States", Flag: US },
  { code: "SA", label: "Saudi Arabia", Flag: SA },
  { code: "YE", label: "Yemen", Flag: YE },
  { code: "AE", label: "Dubai / UAE", Flag: AE },
];

const FREIGHT_OPTIONS = [
  { value: "AIR", label: "AIR", Icon: Plane },
  { value: "SEA", label: "SEA", Icon: Ship },
  { value: "LAND", label: "LAND", Icon: Truck },
];

function CountryOption({
  code,
  label,
  Flag,
}: {
  code: string;
  label: string;
  Flag: React.ElementType;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Flag className="w-4 h-4 shrink-0 rounded-sm" />
      <span>{label}</span>
      <span className="text-[10px] text-muted-foreground font-mono">
        {code}
      </span>
    </span>
  );
}

function ModeBadge({ mode }: { mode: string }) {
  const isKg = mode === "PER_KG";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border",
        isKg
          ? "bg-[#7b57fc]/10 border-[#7b57fc]/20 text-[#7b57fc]"
          : "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
      )}
    >
      {isKg ? "Per KG" : "Per CBM"}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
        active
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 border-red-500/20 text-red-500",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-red-500",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatsStrip({
  rates,
  estimates,
}: {
  rates: Rate[];
  estimates: Estimate[];
}) {
  const activeRates = rates.filter((r) => r.isActive).length;
  const totalEstimates = estimates.length;
  const airRates = rates.filter((r) => r.freightType === "AIR").length;
  const seaRates = rates.filter((r) => r.freightType === "SEA").length;

  const cards = [
    {
      label: "Active Rates",
      value: activeRates,
      icon: CheckCircle2,
      grad: "from-[#7b57fc] to-[#2b1cff]",
      sh: "shadow-[#7b57fc]/20",
    },
    {
      label: "Estimates",
      value: totalEstimates,
      icon: DollarSign,
      grad: "from-emerald-400 to-teal-500",
      sh: "shadow-emerald-500/20",
    },
    {
      label: "Air Rates",
      value: airRates,
      icon: Truck,
      grad: "from-sky-400 to-blue-500",
      sh: "shadow-sky-500/20",
    },
    {
      label: "Sea Rates",
      value: seaRates,
      icon: Ship,
      grad: "from-amber-400 to-orange-500",
      sh: "shadow-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, grad, sh }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5"
        >
          <div
            className={cn(
              "absolute -top-4 -right-4 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-linear-to-br",
              grad,
            )}
          />
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
              grad,
              sh,
            )}
          >
            <Icon size={17} className="text-white" />
          </div>
          <div className="relative">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {value.toLocaleString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RateDialog({
  open,
  onClose,
  rate,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  rate: Rate | null;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();

  const [form, setForm] = useState(() =>
    rate
      ? {
          originCountry: "CN",
          destinationCountry: rate.destinationCountry,
          freightType: rate.freightType,
          calculationMode: rate.calculationMode,
          goodsType: rate.goodsType ?? "",
          baseFee: String(rate.baseFee),
          ratePerKg: rate.ratePerKg ? String(rate.ratePerKg) : "",
          ratePerCbm: rate.ratePerCbm ? String(rate.ratePerCbm) : "",
          minCharge: String(rate.minCharge),
          transitDaysMin: rate.transitDaysMin
            ? String(rate.transitDaysMin)
            : "",
          transitDaysMax: rate.transitDaysMax
            ? String(rate.transitDaysMax)
            : "",
          currency: rate.currency,
          isActive: rate.isActive,
        }
      : {
          ...emptyForm,
          originCountry: "CN",
        },
  );

  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";

  const submit = () => {
    start(async () => {
      const payload = {
        ...form,
        originCountry: "CN",
        destinationCountry: form.destinationCountry.toUpperCase(),
        freightType: form.freightType.toUpperCase(),
        goodsType: form.goodsType || null,
      };

      const res = rate
        ? await updateShippingRate(rate.id, payload)
        : await createShippingRate(payload);

      if (res.success) {
        toast.success(rate ? "Shipping rate updated" : "Shipping rate created");
        onDone();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-2xl border border-border/50 bg-card p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/10">
          <DialogTitle className="text-sm font-bold">
            {rate ? "Edit Shipping Rate" : "Create Shipping Rate"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    originCountry: "CN",
                    destinationCountry: v,
                  }))
                }
              >
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map(({ code, label, Flag }) => (
                    <SelectItem key={code} value={code}>
                      <CountryOption code={code} label={label} Flag={Flag} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Freight Type</Label>
              <Select
                value={form.freightType}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    freightType: v,
                  }))
                }
              >
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREIGHT_OPTIONS.map(({ value, label, Icon }) => (
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
              <Label className={labelCls}>Calculation</Label>
              <Select
                value={form.calculationMode}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    calculationMode: v as CalculationMode,
                    ratePerKg: v === "PER_KG" ? p.ratePerKg : "",
                    ratePerCbm: v === "PER_CBM" ? p.ratePerCbm : "",
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Base Fee</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.baseFee}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    baseFee: e.target.value,
                  }))
                }
                className={inputCls}
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>
                {form.calculationMode === "PER_KG" ? "Rate / KG" : "Rate / CBM"}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.calculationMode === "PER_KG"
                    ? form.ratePerKg
                    : form.ratePerCbm
                }
                onChange={(e) =>
                  setForm((p) =>
                    form.calculationMode === "PER_KG"
                      ? {
                          ...p,
                          ratePerKg: e.target.value,
                        }
                      : {
                          ...p,
                          ratePerCbm: e.target.value,
                        },
                  )
                }
                placeholder="0.00"
                className={inputCls}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Min Charge</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.minCharge}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    minCharge: e.target.value,
                  }))
                }
                className={inputCls}
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Transit Min</Label>
              <Input
                type="number"
                min="0"
                value={form.transitDaysMin}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    transitDaysMin: e.target.value,
                  }))
                }
                placeholder="7"
                className={inputCls}
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Transit Max</Label>
              <Input
                type="number"
                min="0"
                value={form.transitDaysMax}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    transitDaysMax: e.target.value,
                  }))
                }
                placeholder="14"
                className={inputCls}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Goods Type</Label>
              <Input
                value={form.goodsType}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    goodsType: e.target.value,
                  }))
                }
                placeholder="General"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    currency: v,
                  }))
                }
              >
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "AED", "SAR", "EUR", "GBP"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              disabled={
                isPending ||
                !form.destinationCountry ||
                !form.freightType ||
                (form.calculationMode === "PER_KG" && !form.ratePerKg) ||
                (form.calculationMode === "PER_CBM" && !form.ratePerCbm)
              }
              onClick={submit}
              className="h-9 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {rate ? "Save Changes" : "Create Rate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ShippingEstimationsClient({
  initialRates,
  initialEstimates,
}: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [tab, setTab] = useState<"rates" | "estimates">("rates");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"ALL" | CalculationMode>("ALL");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);

  const filteredRates = useMemo(() => {
    const q = search.toLowerCase();

    return initialRates.filter((r) => {
      const matchesSearch =
        !q ||
        [
          r.originCountry,
          r.destinationCountry,
          r.freightType,
          r.calculationMode,
          r.goodsType ?? "",
          r.currency,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesMode = mode === "ALL" || r.calculationMode === mode;
      const matchesStatus =
        status === "ALL" || (status === "ACTIVE" ? r.isActive : !r.isActive);

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [initialRates, search, mode, status]);

  const filteredEstimates = useMemo(() => {
    const q = search.toLowerCase();

    return initialEstimates.filter((e) =>
      !q
        ? true
        : [
            e.originCountry,
            e.destinationCountry,
            e.freightType,
            e.calculationMode,
            e.currency,
            e.user?.email ?? "",
            e.user?.fullName ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
    );
  }, [initialEstimates, search]);

  const refresh = () => router.refresh();

  const handleToggle = (id: string) => {
    start(async () => {
      const r = await toggleShippingRateStatus(id);
      if (r.success) {
        toast.success("Rate status updated");
        refresh();
      }
    });
  };

  const handleDeleteRate = (id: string) => {
    start(async () => {
      const r = await deleteShippingRate(id);
      if (r.success) {
        toast.success("Shipping rate deleted");
        refresh();
      }
    });
  };

  const handleDeleteEstimate = (id: string) => {
    start(async () => {
      const r = await deleteShippingEstimate(id);
      if (r.success) {
        toast.success("Shipping estimate deleted");
        refresh();
      }
    });
  };

  const openCreate = () => {
    setEditingRate(null);
    setDialogOpen(true);
  };

  const openEdit = (rate: Rate) => {
    setEditingRate(rate);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <StatsStrip rates={initialRates} estimates={initialEstimates} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-56 max-w-sm">
              {isPending ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              )}
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search route, type, customer…"
                className="pl-9 h-9 rounded-xl text-sm border-border/60"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearch("")}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <Button
              variant={tab === "rates" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("rates")}
              className={cn(
                "h-9 rounded-xl text-xs",
                tab === "rates" && "bg-[#7b57fc] hover:bg-[#6a48eb] text-white",
              )}
            >
              Rates
            </Button>

            <Button
              variant={tab === "estimates" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("estimates")}
              className={cn(
                "h-9 rounded-xl text-xs",
                tab === "estimates" &&
                  "bg-[#7b57fc] hover:bg-[#6a48eb] text-white",
              )}
            >
              Estimates
            </Button>

            {tab === "rates" && (
              <>
                <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                  <SelectTrigger className="h-9 w-32 rounded-xl text-xs border-border/60">
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Modes</SelectItem>
                    <SelectItem value="PER_KG">Per KG</SelectItem>
                    <SelectItem value="PER_CBM">Per CBM</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as any)}
                >
                  <SelectTrigger className="h-9 w-32 rounded-xl text-xs border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="h-9 rounded-xl text-xs border-border/60 ml-auto gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>

            {tab === "rates" && (
              <Button
                size="sm"
                onClick={openCreate}
                className="h-9 rounded-xl text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Rate
              </Button>
            )}
          </div>
        </div>

        {tab === "rates" ? (
          <>
            <div className="hidden md:block rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-220">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      {[
                        "Route",
                        "Freight",
                        "Mode",
                        "Rate",
                        "Base / Min",
                        "Transit",
                        "Status",
                        "Created",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <AnimatePresence initial={false}>
                      {filteredRates.map((rate) => (
                        <motion.tr
                          key={rate.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group border-b border-border/30 hover:bg-muted/10 transition-colors last:border-0"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-[#7b57fc]" />
                              </div>
                              <div>
                                <p className="text-xs font-bold">
                                  {rate.originCountry} →{" "}
                                  {rate.destinationCountry}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {rate.goodsType ?? "General goods"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-xs font-semibold">
                            {rate.freightType}
                          </td>

                          <td className="px-4 py-3.5">
                            <ModeBadge mode={rate.calculationMode} />
                          </td>

                          <td className="px-4 py-3.5 text-xs">
                            {rate.calculationMode === "PER_KG"
                              ? `${money(rate.ratePerKg ?? 0, rate.currency)} / kg`
                              : `${money(rate.ratePerCbm ?? 0, rate.currency)} / cbm`}
                          </td>

                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            Base {money(rate.baseFee, rate.currency)}
                            <br />
                            Min {money(rate.minCharge, rate.currency)}
                          </td>

                          <td className="px-4 py-3.5 text-xs">
                            {rate.transitDaysMin || rate.transitDaysMax
                              ? `${rate.transitDaysMin ?? "?"}–${rate.transitDaysMax ?? "?"} days`
                              : "—"}
                          </td>

                          <td className="px-4 py-3.5">
                            <StatusBadge active={rate.isActive} />
                          </td>

                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {format(new Date(rate.createdAt), "MMM d, yyyy")}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => openEdit(rate)}
                                  className="text-xs gap-2"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggle(rate.id)}
                                  className="text-xs gap-2"
                                >
                                  {rate.isActive ? (
                                    <XCircle className="w-3 h-3" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  {rate.isActive ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteRate(rate.id)}
                                  className="text-xs text-red-500 focus:text-red-500 gap-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden flex flex-col gap-3">
              {filteredRates.map((rate) => (
                <div
                  key={rate.id}
                  className="rounded-2xl border border-border/50 bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">
                        {rate.originCountry} → {rate.destinationCountry}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rate.freightType} · {rate.goodsType ?? "General goods"}
                      </p>
                    </div>
                    <StatusBadge active={rate.isActive} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ModeBadge mode={rate.calculationMode} />
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-muted/50">
                      {rate.calculationMode === "PER_KG"
                        ? `${money(rate.ratePerKg ?? 0, rate.currency)} / kg`
                        : `${money(rate.ratePerCbm ?? 0, rate.currency)} / cbm`}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(rate)}
                      className="h-8 rounded-xl text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(rate.id)}
                      className="h-8 rounded-xl text-xs"
                    >
                      {rate.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRate(rate.id)}
                      className="h-8 w-8 rounded-xl text-red-500 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-200">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {[
                      "Customer",
                      "Route",
                      "Type",
                      "Weight / Volume",
                      "Cost",
                      "Transit",
                      "Created",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredEstimates.map((estimate) => (
                    <tr
                      key={estimate.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/10"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold">
                          {estimate.user?.fullName ??
                            estimate.user?.email ??
                            "Guest"}
                        </p>
                        {estimate.user?.email && (
                          <p className="text-[10px] text-muted-foreground">
                            {estimate.user.email}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold">
                        {estimate.originCountry} → {estimate.destinationCountry}
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        {estimate.freightType}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {estimate.weightKg ?? "—"} kg
                        <br />
                        {estimate.volumeCbm ?? "—"} cbm
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold text-[#7b57fc]">
                        {money(estimate.estimatedCost, estimate.currency)}
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        {estimate.transitDays
                          ? `${estimate.transitDays} days`
                          : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {format(new Date(estimate.createdAt), "MMM d, yyyy")}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEstimate(estimate.id)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {((tab === "rates" && filteredRates.length === 0) ||
          (tab === "estimates" && filteredEstimates.length === 0)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-border/50 bg-card"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Package className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground/70">
                No shipping records found
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Try adjusting your filters
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {dialogOpen && (
        <RateDialog
          open={dialogOpen}
          rate={editingRate}
          onClose={() => setDialogOpen(false)}
          onDone={refresh}
        />
      )}
    </>
  );
}
