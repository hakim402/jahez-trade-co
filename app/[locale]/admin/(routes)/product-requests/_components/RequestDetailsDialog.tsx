// app/[locale]/admin/(routes)/product-requests/_components/RequestDetailsDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { createQuote, updateQuoteStatus } from "../actions";
import { toast } from "sonner";
import {
  QuoteStatus,
  RequestStatus,
  User,
  Quote,
  RequestStatusHistory,
} from "@prisma/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

// Define the shape of a request with all relations we fetch in getAllProductRequests
type RequestWithRelations = {
  id: string;
  clientId: string;
  client: Pick<User, "id" | "email" | "fullName">;
  productLink: string | null;
  description: string | null;
  quantity: number;
  shippingCountry: string;
  customNotes: string | null;
  status: RequestStatus;
  priority: number;
  acceptedQuoteId: string | null;
  acceptedQuote: Quote | null;
  aiParsedData: any | null;
  aiEstimatedPrice: number | null;
  aiConfidence: number | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  quotes: (Quote & {
    createdBy: Pick<User, "id" | "email" | "fullName">;
  })[];
  files: any[];
  statusHistory: (RequestStatusHistory & {
    changedBy: Pick<User, "id" | "email" | "fullName">;
  })[];
  notifications?: any[];
};

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RequestWithRelations | null;
  onActionComplete: () => void;
}

export function RequestDetailsDialog({
  open,
  onOpenChange,
  request,
  onActionComplete,
}: RequestDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("details");

  if (!request) return null;

  const handleCreateQuote = async (formData: FormData) => {
    const price = parseFloat(formData.get("price") as string);
    const currency = formData.get("currency") as string;
    const validUntil = formData.get("validUntil")
      ? new Date(formData.get("validUntil") as string)
      : undefined;
    const adminNotes = formData.get("adminNotes") as string;

    const result = await createQuote({
      requestId: request.id,
      price,
      currency,
      validUntil,
      adminNotes,
    });

    if (result.success) {
      toast.success("Quote created", {
        description: "New quote has been added.",
      });
      onActionComplete();
      // Optionally refresh data in dialog
    } else {
      toast.error("Error", {
        description: result.error,
      });
    }
  };

  const handleQuoteStatusUpdate = async (
    quoteId: string,
    newStatus: QuoteStatus,
  ) => {
    const result = await updateQuoteStatus(quoteId, newStatus);
    if (result.success) {
      toast.success("Quote updated", {
        description: `Quote status changed to ${newStatus}.`,
      });
      onActionComplete();
    } else {
      toast.error("Error", {
        description: result.error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[95vw] sm:max-w-2xl lg:max-w-7xl",
          "max-h-[95vh] overflow-y-auto",
          "bg-background/95 backdrop-blur-xl",
          "border border-border/50 shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-2",
          "duration-300",
          // Custom scrollbar styling
          "[&::-webkit-scrollbar]:w-2",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30",
        )}
      >
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="quotes">
              Quotes ({request.quotes.length})
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client</Label>
                <p>
                  {request.client.fullName} ({request.client.email})
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <p>{request.status}</p>
              </div>
              <div>
                <Label>Product Link</Label>
                <p>
                  <a
                    href={request.productLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {request.productLink || "—"}
                  </a>
                </p>
              </div>
              <div>
                <Label>Quantity</Label>
                <p>{request.quantity}</p>
              </div>
              <div>
                <Label>Shipping Country</Label>
                <p>{request.shippingCountry}</p>
              </div>
              <div>
                <Label>Created At</Label>
                <p>{formatDate(request.createdAt)}</p>
              </div>
            </div>
            {request.description && (
              <div>
                <Label>Description</Label>
                <p className="whitespace-pre-wrap">{request.description}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            {/* List existing quotes */}
            {request.quotes.map((quote) => (
              <div key={quote.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">
                      {formatCurrency(quote.price.toString(), quote.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({quote.status})
                    </span>
                  </div>
                  <div className="space-x-2">
                    {quote.status !== "ACCEPTED" &&
                      quote.status !== "REJECTED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleQuoteStatusUpdate(quote.id, "SENT")
                            }
                          >
                            Send
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleQuoteStatusUpdate(quote.id, "REJECTED")
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    {quote.status === "SENT" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleQuoteStatusUpdate(quote.id, "ACCEPTED")
                        }
                      >
                        Accept
                      </Button>
                    )}
                  </div>
                </div>
                {quote.adminNotes && (
                  <p className="text-sm italic">{quote.adminNotes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created by {quote.createdBy.fullName} on{" "}
                  {formatDate(quote.createdAt)}
                  {quote.validUntil &&
                    ` · Valid until ${formatDate(quote.validUntil)}`}
                </p>
              </div>
            ))}

            {/* Create new quote form */}
            <form
              action={handleCreateQuote}
              className="border-t pt-4 space-y-4"
            >
              <h4 className="font-medium">Create New Quote</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    name="price"
                    id="price"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    type="text"
                    name="currency"
                    id="currency"
                    defaultValue="USD"
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input type="date" name="validUntil" id="validUntil" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea name="adminNotes" id="adminNotes" rows={3} />
                </div>
              </div>
              <Button type="submit">Create Quote</Button>
            </form>
          </TabsContent>

          <TabsContent value="history">
            {/* Render status history */}
            <ul className="space-y-2">
              {request.statusHistory.map((entry) => (
                <li key={entry.id} className="text-sm border-l-2 pl-4 py-1">
                  <span className="font-medium">
                    {entry.oldStatus} → {entry.newStatus}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    by {entry.changedBy.fullName} on{" "}
                    {formatDate(entry.changedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
