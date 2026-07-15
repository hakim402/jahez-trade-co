"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
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
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { getShipments, softDeleteShipment } from "../actions";
import { ShipmentFormDialog } from "./ShipmentFormDialog";
import { StatusBadge } from "./StatusBadge";
import type { ShipmentRow, ShipmentStats } from "./types";

export function ShipmentsPageClient({
  initialShipments,
  initialTotal,
  stats,
  error: initialError,
}: {
  initialShipments: ShipmentRow[];
  initialTotal: number;
  stats: ShipmentStats;
  error?: string | null;
}) {
  const [shipments, setShipments] = useState<ShipmentRow[]>(initialShipments);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShipmentRow | null>(null);
  const [error, setError] = useState<string | null>(initialError || null);

  const pageSize = 20;

  const reload = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const res = await getShipments({ search, status: statusFilter as any, page, pageSize });
      if (res.success) {
        setShipments(res.data.shipments);
        setTotal(res.data.total);
      } else {
        setError(res.error || "Failed to load shipments");
        toast.error(res.error || "Failed to load shipments");
      }
    });
  }, [search, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(reload, 250);
    return () => clearTimeout(t);
  }, [reload]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this shipment? This can't be undone.")) return;
    const res = await softDeleteShipment(id);
    if (res.success) {
      toast.success("Shipment deleted");
      reload();
    } else {
      toast.error(res.error || "Failed to delete");
    }
  }

  return (
    <div className="space-y-6 p-6">
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Package} label="Total Shipments" value={stats.total} color="text-[#7b57fc]" bg="bg-[#7b57fc]/10" />
        <StatCard icon={Truck} label="In Transit" value={stats.inTransit} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={CheckCircle2} label="Delivered" value={stats.delivered} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={AlertTriangle} label="Delayed / Exception" value={stats.delayed} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tracking code, client, or product…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="CUSTOMS_DESTINATION">Customs (Destination)</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="DELAYED">Delayed</SelectItem>
            <SelectItem value="EXCEPTION">Exception</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-red-700" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
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
            {isPending && shipments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}
            {!isPending && shipments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {error ? "Error loading shipments. See above." : "No shipments found."}
                </TableCell>
              </TableRow>
            )}
            {shipments.map((s, index) => {
              // fallback key
              const key = s.id || `shipment-${index}`;
              const clientName = s.client?.fullName || s.client?.email || s.guestClient?.fullName || "—";
              const totalCost = (s.productCost || 0) + (s.shippingCost || 0) + (s.customsFees || 0) + (s.otherFees || 0);
              return (
                <TableRow key={key}>
                  <TableCell>
                    <Link href={`/admin/shipments/${s.id}`} className="font-mono text-sm font-semibold text-[#7b57fc] hover:underline">
                      {s.trackingCode}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{clientName}</p>
                    <p className="text-xs text-muted-foreground">{s.guestClient ? "Guest" : "Registered"}</p>
                  </TableCell>
                  <TableCell className="text-sm">{s.originCountry} → {s.destinationCountry}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">{s.productDescription}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-sm font-medium">{totalCost.toFixed(2)} {s.currency}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/shipments/${s.id}`}><Eye className="mr-2 h-4 w-4" /> View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(s); setFormOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {total > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {Math.ceil(total / pageSize)}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <ShipmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        shipment={editing}
        onSaved={reload}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: number; color: string; bg: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}