// app/[locale]/(pages)/track/_components/TrackSearchForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ScanBarcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TrackSearchForm({ locale }: { locale: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isAr = locale === "ar";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError(isAr ? "أدخل رمز التتبع أولاً" : "Enter a tracking code first");
      return;
    }
    setError(null);
    startTransition(() => {
      router.push(`/${locale}/track/${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <ScanBarcode className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(null); }}
            placeholder={isAr ? "مثال: JHZ-7K3P9Q2A" : "e.g. JHZ-7K3P9Q2A"}
            className="h-12 ps-9 text-center font-mono tracking-wide sm:text-start"
            dir="ltr"
          />
        </div>
        <Button type="submit" disabled={isPending} className="h-12 bg-[#7b57fc] px-6 hover:bg-[#6845e8]">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ms-2">{isAr ? "تتبع" : "Track"}</span>
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
