"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhatsAppButton() {
  const [whatsappUrl, setWhatsappUrl] = useState("#");

  useEffect(() => {
    const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT;
    if (!rawNumber) {
      console.warn("Missing NEXT_PUBLIC_WHATSAPP_SUPPORT env variable");
      return;
    }
    // Remove spaces, keep the plus sign
    const cleanNumber = rawNumber.replace(/\s/g, "");
    const message = encodeURIComponent(
      "Hello, I need help with sourcing products."
    );
    setWhatsappUrl(`https://wa.me/${cleanNumber}?text=${message}`);
  }, []);

  // Don't render until URL is set (avoid hydration mismatch)
  if (whatsappUrl === "#") return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex items-center justify-center",
        "w-14 h-14 rounded-full",
        "bg-[#25D366] hover:bg-[#20b859]",
        "shadow-lg shadow-[#25D366]/30",
        "transition-all duration-300 hover:scale-110",
        "group"
      )}
    >
      <MessageCircle className="w-7 h-7 text-white" />
      {/* Optional pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/40 opacity-75" />
    </a>
  );
}