'use client'

// app/[locale]/dashboard/(routes)/request/_components/ConfirmDialog.tsx
// Props are a strict superset of the original — all existing callsites still
// compile unchanged (open / onOpenChange / title / description / onConfirm).
// Added optional: variant, confirmLabel, cancelLabel, loading.

import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2, Info, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Variant config ───────────────────────────────────────────────────────

type Variant = 'warning' | 'danger' | 'info' | 'success'

const VARIANT_CONFIG: Record<Variant, {
  strip:      string
  iconWrap:   string
  icon:       React.ElementType
  iconColor:  string
  confirmBtn: string
}> = {
  warning: {
    strip:      'bg-amber-500/6 border-b border-amber-400/15',
    iconWrap:   'bg-amber-500/15',
    icon:       AlertTriangle,
    iconColor:  'text-amber-400',
    confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  danger: {
    strip:      'bg-red-500/6 border-b border-red-400/15',
    iconWrap:   'bg-red-500/15',
    icon:       Trash2,
    iconColor:  'text-red-400',
    confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
  },
  info: {
    strip:      'bg-color/6 border-b border-color/15',
    iconWrap:   'bg-color/15',
    icon:       Info,
    iconColor:  'text-color',
    confirmBtn: 'bg-color hover:bg-color/90 text-white',
  },
  success: {
    strip:      'bg-emerald-500/6 border-b border-emerald-400/15',
    iconWrap:   'bg-emerald-500/15',
    icon:       CheckCircle2,
    iconColor:  'text-emerald-400',
    confirmBtn: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  },
}

// ─── Props ────────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  // Original props (unchanged)
  open:         boolean
  onOpenChange: (open: boolean) => void
  title:        string
  description:  string
  onConfirm:    () => void
  // Optional additions
  variant?:      Variant   // defaults to 'warning'
  confirmLabel?: string    // overrides t('confirm')
  cancelLabel?:  string    // overrides t('cancel')
  loading?:      boolean
}

// ─── Component ────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  variant      = 'warning',
  confirmLabel,
  cancelLabel,
  loading      = false,
}: ConfirmDialogProps) {
  const t   = useTranslations('ConfirmDialog')
  const cfg  = VARIANT_CONFIG[variant]
  const Icon = cfg.icon

  return (
    <AlertDialog open={open} onOpenChange={v => { if (!loading) onOpenChange(v) }}>
      <AlertDialogContent className={cn(
        'w-[92vw] sm:max-w-sm p-0 overflow-hidden rounded-2xl',
        'border border-border/20 bg-card shadow-2xl',
      )}>

        {/* Coloured header strip */}
        <div className={cn('flex items-start gap-3.5 px-5 pt-5 pb-4', cfg.strip)}>
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            cfg.iconWrap,
          )}>
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
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/10 bg-muted/10">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="inline-flex items-center justify-center h-8 px-3.5 text-xs font-medium rounded-lg border border-border/30 bg-background/60 text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel ?? t('cancel')}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 h-8 px-3.5 text-xs font-medium rounded-lg transition-colors',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              cfg.confirmBtn,
            )}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel ?? t('confirm')}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}