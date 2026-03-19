"use client"

// app/[locale]/admin/(routes)/products/_components/trend-score-dialog.tsx

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Flame, Loader2, TrendingUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { updateTrendScore } from "../actions"
import { cn } from "@/lib/utils"

interface TrendScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: {
    id: string
    name: string
    nameAr: string | null
    trendScore: number
  }
}

const PRESETS = [
  { score: 20,  label: "Low",     color: "text-muted-foreground",          activeBg: "bg-muted border-border"                      },
  { score: 40,  label: "Mild",    color: "text-amber-600 dark:text-amber-400",   activeBg: "bg-amber-500/10 border-amber-500/40"    },
  { score: 60,  label: "Rising",  color: "text-orange-600 dark:text-orange-400", activeBg: "bg-orange-500/10 border-orange-500/40"  },
  { score: 80,  label: "Hot",     color: "text-red-600 dark:text-red-400",       activeBg: "bg-red-500/10 border-red-500/40"        },
  { score: 100, label: "Viral 🔥", color: "text-red-600 dark:text-red-400",      activeBg: "bg-red-500/15 border-red-500/50"        },
] as const

export function TrendScoreDialog({
  open,
  onOpenChange,
  product,
}: TrendScoreDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [score, setScore] = useState(product.trendScore)

  const scoreLabel =
    score >= 80 ? "Hot 🔥"    :
    score >= 60 ? "Rising 📈" :
    score >= 40 ? "Mild"      : "Low"

  const scoreColor =
    score >= 80 ? "text-red-600 dark:text-red-400"         :
    score >= 60 ? "text-orange-600 dark:text-orange-400"   :
    score >= 40 ? "text-amber-600 dark:text-amber-400"     :
    "text-muted-foreground"

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateTrendScore(product.id, score)
        toast.success(`Trend score updated to ${score}`)
        onOpenChange(false)
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to update")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7b57fc]/10">
              <Flame className="h-4 w-4 text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Trend Score
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {product.name}
                {product.nameAr && (
                  <span className="ml-1 opacity-60">· {product.nameAr}</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Score display */}
          <div className="text-center py-2">
            <span className={cn("text-6xl font-bold tabular-nums leading-none", scoreColor)}>
              {score}
            </span>
            <p className={cn("text-sm mt-2 font-medium", scoreColor)}>{scoreLabel}</p>
          </div>

          {/* Slider */}
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full accent-[#7b57fc]"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1 px-0.5">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-5 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.score}
                type="button"
                onClick={() => setScore(preset.score)}
                className={cn(
                  "rounded-xl py-2.5 text-center transition-all border",
                  score === preset.score
                    ? cn(preset.activeBg, "ring-2 ring-[#7b57fc]/40")
                    : "border-border/50 bg-muted/30 hover:bg-muted",
                  preset.color
                )}
              >
                <span className="block text-base font-bold tabular-nums">{preset.score}</span>
                <span className="text-[9px] opacity-70 leading-tight">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || score === product.trendScore}
            className="flex-1 bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Save Score
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}