"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createQuote } from "../actions";

interface CreateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: { id: string } | null;
  onSuccess: () => void;
}

export function CreateQuoteDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: CreateQuoteDialogProps) {
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [adminNotes, setAdminNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  // Replace with your actual upload function
  const uploadFile = async (file: File): Promise<string> => {
    // Example: upload to Vercel Blob, AWS S3, etc.
    await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate
    return `https://example.com/uploads/${file.name}`;
  };

  const handleSubmit = async () => {
    if (!request) return;
    if (!price || isNaN(parseFloat(price))) {
      toast.error("Invalid price");
      return;
    }
    setLoading(true);
    try {
      const quoteFileUrl = file ? await uploadFile(file) : undefined;
      await createQuote(request.id, {
        price: parseFloat(price),
        currency,
        adminNotes: adminNotes || undefined,
        quoteFileUrl,
      });
      toast.success("Quote created");
      onSuccess();
    } catch {
      toast.error("Failed to create quote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Quote</DialogTitle>
          <DialogDescription>Add a quote for this request.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Admin Notes</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Quote File (optional)</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
