"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

import { ShippingEstimateDialog } from "./ShippingEstimateDialog";

export function ShippingEstimationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Shipping Estimation"
        className={cn(
          "fixed bottom-24 right-6 z-50",
          "flex items-center justify-center",
          "w-14 h-14 rounded-full",
          "bg-[#7b57fc] hover:bg-[#6a48eb]",
          "shadow-lg shadow-[#7b57fc]/30",
          "transition-all duration-300 hover:scale-110",
          "group cursor-pointer",
        )}
      >
        <Calculator className="w-6 h-6 text-white relative z-10" />

        {/* Pulse Ring */}
        <span className="absolute inset-0 rounded-full animate-ping bg-[#7b57fc]/40 opacity-75" />

        {/* Tooltip */}
        <div
          className={cn(
            "absolute right-16",
            "px-3 py-1.5 rounded-lg",
            "bg-black text-white text-xs font-medium whitespace-nowrap",
            "opacity-0 translate-x-2",
            "group-hover:opacity-100 group-hover:translate-x-0",
            "transition-all duration-200",
          )}
        >
          Shipping Cost
        </div>
      </button>

      <ShippingEstimateDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}