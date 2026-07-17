"use client";

// app/[locale]/admin/(routes)/manage-users/_components/SendNotificationDialog.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  Loader2,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Monitor,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendNotificationToUser } from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — same as original
// ─────────────────────────────────────────────────────────────────────────────

interface SendNotificationDialogProps {
  userId: string;
  userName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Notification types — same values as original ──────────────────────────

const NOTIFICATION_TYPES = [
  {
    value: "INFO",
    label: "Info",
    icon: Info,
    color: "text-blue-500    bg-blue-500/10    ring-blue-400/30",
  },
  {
    value: "WARNING",
    label: "Warning",
    icon: AlertTriangle,
    color: "text-amber-500   bg-amber-500/10   ring-amber-400/30",
  },
  {
    value: "SUCCESS",
    label: "Success",
    icon: CheckCircle2,
    color: "text-emerald-500 bg-emerald-500/10 ring-emerald-400/30",
  },
  {
    value: "ERROR",
    label: "Error",
    icon: XCircle,
    color: "text-red-500     bg-red-500/10     ring-red-400/30",
  },
  {
    value: "SYSTEM",
    label: "System",
    icon: Monitor,
    color: "text-[#7b57fc]   bg-[#7b57fc]/10   ring-[#7b57fc]/30",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function SendNotificationDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: SendNotificationDialogProps) {
  // ── STATE — identical to original ────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<string>("INFO");
  const [isLoading, setIsLoading] = useState(false);

  // ── HANDLER — identical to original ──────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setIsLoading(true);
    try {
      const result = await sendNotificationToUser({
        userId,
        title,
        message,
        type,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Notification sent", {
        description: `Sent to ${userName || "user"} successfully.`,
      });
      setTitle("");
      setMessage("");
      setType("INFO");
      onOpenChange(false);
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType =
    NOTIFICATION_TYPES.find((t) => t.value === type) ?? NOTIFICATION_TYPES[0];
  const canSend =
    title.trim().length > 0 && message.trim().length > 0 && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[92vw] sm:max-w-md p-0 overflow-hidden",
          "bg-card border border-border/60 shadow-2xl rounded-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
          "duration-200",
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden px-5 pt-5 pb-4 border-b border-border/40">
          {/* Subtle background glow */}
          <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-[#7b57fc]/10 blur-2xl pointer-events-none" />

          <div className="relative flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7b57fc]/12 ring-1 ring-[#7b57fc]/25">
              <Bell size={17} className="text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground leading-tight">
                Send notification
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                To{" "}
                <span className="font-medium text-foreground">
                  {userName || "this user"}
                </span>
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 space-y-4">
          {/* Type selector — visual pill row */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type
            </Label>
            <div className="grid grid-cols-5 gap-1.5">
              {NOTIFICATION_TYPES.map((t) => {
                const Icon = t.icon;
                const isActive = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-center transition-all duration-150",
                      isActive
                        ? `${t.color} ring-1 border-transparent`
                        : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/40",
                    )}
                  >
                    <Icon size={14} className={isActive ? "" : "opacity-50"} />
                    <span className="text-[10px] font-semibold leading-none">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview badge */}
          {type && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg ring-1 text-xs font-medium",
                selectedType.color,
              )}
            >
              <selectedType.icon size={12} />
              <span>
                Preview: this will appear as a{" "}
                <strong>{selectedType.label}</strong> notification
              </span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="notif-title"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Title
            </Label>
            <Input
              id="notif-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title…"
              maxLength={200}
              className="h-9 text-sm bg-muted/40 border-border/50 rounded-xl focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
            />
            <p className="text-[10px] text-muted-foreground/50 text-right tabular-nums">
              {title.length}/200
            </p>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label
              htmlFor="notif-message"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Message
            </Label>
            <Textarea
              id="notif-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
              rows={4}
              maxLength={2000}
              className="resize-none text-sm bg-muted/40 border-border/50 rounded-xl focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground/50">
                Supports plain text only
              </p>
              <p
                className={cn(
                  "text-[10px] tabular-nums transition-colors",
                  message.length > 1800
                    ? "text-amber-500"
                    : "text-muted-foreground/50",
                )}
              >
                {message.length}/2000
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-9 text-sm rounded-xl text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="h-9 text-sm rounded-xl bg-[#7b57fc] hover:bg-[#6a48e8] text-white gap-2 disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Bell size={14} /> Send notification
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
