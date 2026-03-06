"use client";

// app/[locale]/admin/(routes)/product-requests/_components/ConfirmDialog.tsx
// All original props (open, onOpenChange, title, description, onConfirm) are UNCHANGED.
// Added optional: variant, confirmLabel, cancelLabel, loading.

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  Trash2,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

type Variant = "warning" | "danger" | "info" | "success";

const VARIANT_CONFIG: Record<
  Variant,
  {
    strip: string;
    iconWrap: string;
    Icon: React.ElementType;
    iconColor: string;
    confirm: string;
  }
> = {
  warning: {
    strip: "bg-amber-500/6  border-b border-amber-400/15",
    iconWrap: "bg-amber-500/15",
    Icon: AlertTriangle,
    iconColor: "text-amber-500",
    confirm: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  danger: {
    strip: "bg-red-500/6    border-b border-red-400/15",
    iconWrap: "bg-red-500/15",
    Icon: Trash2,
    iconColor: "text-red-500",
    confirm: "bg-red-500 hover:bg-red-600 text-white",
  },
  info: {
    strip: "bg-blue-500/6   border-b border-blue-400/15",
    iconWrap: "bg-blue-500/15",
    Icon: Info,
    iconColor: "text-blue-500",
    confirm: "bg-[#7b57fc] hover:bg-[#6a48e8] text-white",
  },
  success: {
    strip: "bg-emerald-500/6 border-b border-emerald-400/15",
    iconWrap: "bg-emerald-500/15",
    Icon: CheckCircle2,
    iconColor: "text-emerald-500",
    confirm: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROPS  — original interface + optional extras
// ─────────────────────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  // Original (unchanged)
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  // Optional additions
  variant?: Variant; // default: 'warning'
  confirmLabel?: string; // default: 'Confirm'
  cancelLabel?: string; // default: 'Cancel'
  loading?: boolean; // shows spinner in confirm button
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  variant = "warning",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
}: ConfirmDialogProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.Icon;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) onOpenChange(v);
      }}
    >
      <AlertDialogContent
        className={cn(
          "w-[92vw] sm:max-w-sm p-0 overflow-hidden rounded-2xl",
          "border border-border/60 bg-card shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
          "duration-200",
        )}
      >
        {/* Coloured header strip */}
        <div
          className={cn("flex items-start gap-3.5 px-5 pt-5 pb-4", cfg.strip)}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              cfg.iconWrap,
            )}
          >
            <Icon size={18} className={cfg.iconColor} />
          </div>
          <AlertDialogHeader className="space-y-0.5 text-left p-0 flex-1 min-w-0">
            <AlertDialogTitle className="text-base font-semibold text-foreground leading-snug">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/40 bg-muted/20">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="inline-flex items-center justify-center h-8 px-3.5 text-xs font-medium rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 h-8 px-3.5 text-xs font-medium rounded-lg transition-colors",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              cfg.confirm,
            )}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
