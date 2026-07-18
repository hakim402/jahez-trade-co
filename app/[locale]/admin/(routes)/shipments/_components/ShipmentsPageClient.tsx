// app/[locale]/admin/(routes)/shipments/_components/ShipmentsPageClient.tsx
"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Settings2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { softDeleteShipment } from "../actions";
import { ShipmentFormDialog } from "./ShipmentFormDialog";
import { StatusBadge } from "./StatusBadge";
import type { ShipmentRow, ShipmentStats } from "./types";
import type { ShipmentPagination, ShipmentFilters } from "../actions";

function ClientAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#7b57fc]/10 flex items-center justify-center text-[11px] font-bold text-[#7b57fc] shrink-0 select-none">
      {initials || "?"}
    </div>
  );
}

function StatsStrip({ stats }: { stats: ShipmentStats }) {
  const cards = [
    { label: "Total Shipments", value: stats.total, icon: Package, grad: "from-[#7b57fc] to-[#2b1cff]" },
    { label: "In Transit", value: stats.inTransit, icon: Truck, grad: "from-blue-400 to-blue-600" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2, grad: "from-emerald-400 to-teal-500" },
    { label: "Delayed / Exception", value: stats.delayed, icon: AlertTriangle, grad: "from-amber-400 to-orange-500" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, grad }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5"
        >
          <div className={cn("absolute -top-4 -right-4 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-linear-to-br", grad)} />
          <div className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md", grad)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="relative">
            <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function ShipmentsPageClient({
  initialShipments,
  initialPagination,
  stats,
  filters,
  loadError,
}: {
  initialShipments: ShipmentRow[];
  initialPagination: ShipmentPagination;
  stats: ShipmentStats;
  filters: ShipmentFilters;
  loadError?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShipmentRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      startTransition(() => {
        const merged: Record<string, string | undefined> = {
          page: String(filters.page ?? 1),
          status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
          search: filters.search,
          ...patch,
        };
        const qs = new URLSearchParams();
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== "") qs.set(k, v);
        });
        router.push(pathname + "?" + qs.toString());
      });
    },
    [filters, router, pathname],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ search: searchInput || undefined, page: "1" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shipment? This can't be undone.")) return;
    setDeletingId(id);
    const res = await softDeleteShipment(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Shipment deleted");
      refresh();
    } else {
      toast.error(res.error);
    }
  }

  const { page, pageSize, totalCount, totalPages } = initialPagination;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shipments &amp; Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Register clients, book shipments, and track them in real time from China to Yemen, UAE, and the USA.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/integrations">
            <Button variant="outline">
              <Settings2 className="mr-2 h-4 w-4" /> API Integrations
            </Button>
          </Link>
          <Button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="bg-[#7b57fc] hover:bg-[#6845e8]"
          >
            <Plus className="mr-2 h-4 w-4" /> New Shipment
          </Button>
        </div>
      </div>

      <StatsStrip stats={stats} />

      {loadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Couldn&apos;t load shipments: {loadError}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tracking code, client, or product…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          value={filters.status ?? "ALL"}
          onValueChange={(v) => applyFilters({ status: v === "ALL" ? undefined : v, page: "1" })}
        >
          <SelectTrigger className="w-50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="PICKED_UP">Picked Up</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="ARRIVED_ORIGIN_PORT">Arrived Origin Port</SelectItem>
            <SelectItem value="CUSTOMS_ORIGIN">Customs (Origin)</SelectItem>
            <SelectItem value="DEPARTED">Departed</SelectItem>
            <SelectItem value="ARRIVED_DESTINATION">Arrived Destination</SelectItem>
            <SelectItem value="CUSTOMS_DESTINATION">Customs (Destination)</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="DELAYED">Delayed</SelectItem>
            <SelectItem value="EXCEPTION">Exception</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={cn("rounded-2xl border border-border/50 bg-card overflow-hidden transition-opacity", isPending && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Code</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialShipments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-muted-foreground">
                  {loadError ? "Unable to load shipments." : "No shipments found. Click \"New Shipment\" to create your first one."}
                </TableCell>
              </TableRow>
            )}
            {initialShipments.map((s, idx) => {
              const clientName = s.client?.fullName || s.client?.email || s.guestClient?.fullName || "—";
              const totalCost = s.productCost + s.shippingCost + s.customsFees + s.otherFees;
              return (
                <TableRow key={s.id ?? "shipment-" + idx}>
                  <TableCell>
                    <Link href={"/admin/shipments/" + s.id} className="font-mono text-sm font-semibold text-[#7b57fc] hover:underline">
                      {s.trackingCode}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <ClientAvatar name={clientName} />
                      <div>
                        <p className="text-sm font-medium">{clientName}</p>
                        <p className="text-xs text-muted-foreground">{s.guestClient ? "Guest" : "Registered"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{s.originCountry} → {s.destinationCountry}</TableCell>
                  <TableCell className="min-w-60 truncate text-sm">{s.productDescription}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">{totalCost.toFixed(2)} {s.currency}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={"/admin/shipments/" + s.id}><Eye className="mr-2 h-4 w-4" /> View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(s); setFormOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="text-red-600 focus:text-red-600"
                        >
                          {deletingId === s.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground tabular-nums">{(page - 1) * pageSize + 1}</span>
            {"\u2013"}
            <span className="font-semibold text-foreground tabular-nums">{Math.min(page * pageSize, totalCount)}</span>
            {" of "}
            <span className="font-semibold text-foreground tabular-nums">{totalCount.toLocaleString()}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => applyFilters({ page: String(page - 1) })}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 text-xs text-muted-foreground tabular-nums">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => applyFilters({ page: String(page + 1) })}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ShipmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        shipment={editing}
        onSaved={refresh}
      />
    </div>
  );
}
