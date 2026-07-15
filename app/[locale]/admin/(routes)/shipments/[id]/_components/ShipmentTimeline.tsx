// app/[locale]/admin/(routes)/shipments/[id]/_components/ShipmentTimeline.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, RefreshCw, Loader2, Trash2, Bot, User, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addManualShipmentEvent, deleteShipmentEvent, syncShipmentTracking } from "../../actions";
import { StatusBadge, STATUS_LABELS, ALL_STATUSES } from "../../_components/StatusBadge";
import type { ShipmentEventRow, ShipmentStatusValue, TrackingSourceValue } from "../../_components/types";

export function ShipmentTimeline({
  shipmentId,
  events,
  trackingSource,
  onChange,
}: {
  shipmentId: string;
  events: ShipmentEventRow[];
  trackingSource: TrackingSourceValue;
  onChange: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [isSyncing, startSync] = useTransition();
  const [isSaving, startSave] = useTransition();

  const [status, setStatus] = useState<ShipmentStatusValue>("IN_TRANSIT");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));

  function handleSync() {
    startSync(async () => {
      const res = await syncShipmentTracking(shipmentId);
      if (res.success) {
        toast.success(res.data.newEvents > 0 ? `Synced — ${res.data.newEvents} new update(s)` : "Synced — no new updates yet");
        onChange();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleAdd() {
    if (!title.trim()) { toast.error("Add a title for this update"); return; }
    startSave(async () => {
      const res = await addManualShipmentEvent(shipmentId, {
        status,
        title: title.trim(),
        location: location.trim() || null,
        description: description.trim() || null,
        occurredAt: new Date(occurredAt).toISOString(),
      });
      if (res.success) {
        toast.success("Tracking update added");
        setAddOpen(false);
        setTitle(""); setLocation(""); setDescription("");
        onChange();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Remove this tracking update?")) return;
    const res = await deleteShipmentEvent(shipmentId, eventId);
    if (res.success) { toast.success("Update removed"); onChange(); }
    else toast.error(res.error);
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tracking Timeline</h3>
        <div className="flex gap-2">
          {trackingSource === "API_17TRACK" && (
            <Button size="sm" variant="outline" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Sync Now
            </Button>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-[#7b57fc] hover:bg-[#6845e8]">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Update
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No tracking updates yet.</p>
      ) : (
        <ol className="space-y-4 border-l-2 border-dashed border-border pl-4">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#7b57fc]" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge status={e.status} />
                    <SourceIcon source={e.source} />
                    <span className="text-xs text-muted-foreground">{format(new Date(e.occurredAt), "MMM d, yyyy · h:mm a")}</span>
                  </div>
                  <p className="text-sm font-medium">{e.title}</p>
                  {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                  {e.description && <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>}
                </div>
                {e.source === "MANUAL" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tracking Update</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ShipmentStatusValue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Departed Guangzhou warehouse" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Guangzhou, China" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date &amp; Time</Label>
              <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSaving} className="bg-[#7b57fc] hover:bg-[#6845e8]">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SourceIcon({ source }: { source: "MANUAL" | "API" | "SYSTEM" }) {
  if (source === "API") return <Bot className="h-3 w-3 text-[#7b57fc]" title="Synced from carrier API" />;
  if (source === "SYSTEM") return <Cog className="h-3 w-3 text-muted-foreground" title="System generated" />;
  return <User className="h-3 w-3 text-muted-foreground" title="Added manually" />;
}
