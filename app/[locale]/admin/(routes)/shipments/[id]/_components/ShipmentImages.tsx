// app/[locale]/admin/(routes)/shipments/[id]/_components/ShipmentImages.tsx
"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadShipmentImage, deleteShipmentImage } from "../../actions";
import type { ShipmentImageRow } from "../../_components/types";

export function ShipmentImages({
  shipmentId,
  images,
  onChange,
}: {
  shipmentId: string;
  images: ShipmentImageRow[];
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startUpload(async () => {
      const res = await uploadShipmentImage(shipmentId, formData);
      if (res.success) { toast.success("Image uploaded"); onChange(); }
      else toast.error(res.error);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  async function handleDelete(imageId: string) {
    const res = await deleteShipmentImage(shipmentId, imageId);
    if (res.success) { toast.success("Image removed"); onChange(); }
    else toast.error(res.error);
  }

  return (
    <Card className="rounded-2xl border-border/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Product Photos</h3>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
          Upload
        </Button>
      </div>
      {images.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No photos added yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={img.url} alt={img.altText ?? "Shipment photo"} fill className="object-cover" />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
