"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRequestById } from "../actions";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FileIcon, Download, Package, MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface RequestDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | number;
}

export function RequestDetailsDrawer({ open, onOpenChange, requestId }: RequestDetailsDrawerProps) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && requestId) {
      setLoading(true);
      getRequestById(String(requestId))
        .then(setRequest)
        .finally(() => setLoading(false));
    }
  }, [open, requestId]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Request Details</DrawerTitle>
          <DrawerDescription>Full request information.</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              Loading...
            </div>
          ) : request ? (
            <div className="space-y-6 pb-6">
              {/* User info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.user.avatarUrl} />
                    <AvatarFallback>
                      {request.user.fullName?.charAt(0) ||
                        request.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {request.user.fullName || "No name"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {request.user.email}
                    </p>
                  </div>
                </div>
                <Badge>{request.status}</Badge>
              </div>
              <Separator />
              {/* Request fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Quantity: {request.quantity}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Shipping:{" "}
                    {request.shippingCountry}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Submitted:{" "}
                    {formatDate(request.createdAt)}
                  </div>
                  {request.quotedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Quoted:{" "}
                      {formatDate(request.quotedAt)}
                    </div>
                  )}
                </div>
                {request.productLink && (
                  <a
                    href={request.productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Product Link
                  </a>
                )}
              </div>
              {/* Description */}
              {request.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
              )}
              {/* Customer notes */}
              {request.customNotes && (
                <div>
                  <h4 className="font-medium">Customer Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {request.customNotes}
                  </p>
                </div>
              )}
              {/* Admin notes */}
              {request.adminNotes && (
                <div>
                  <h4 className="font-medium">Admin Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {request.adminNotes}
                  </p>
                </div>
              )}
              {/* Files */}
              {request.files?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attached Files</h4>
                  <div className="space-y-2">
                    {request.files.map((file: { id: string | number; fileName?: string; fileSize?: number; url: string }) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4" />
                          <span className="text-sm">
                            {file.fileName || "File"}
                          </span>
                          {file.fileSize && (
                            <span className="text-xs text-muted-foreground">
                              ({(file.fileSize / 1024).toFixed(2)} KB)
                            </span>
                          )}
                        </div>
                        <Link
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Quotes */}
              {request.quotes?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Quotes</h4>
                  <div className="space-y-3">
                    {request.quotes.map((quote: {
                      id: string | number;
                      price: number;
                      currency: string;
                      createdAt: string | Date;
                      adminNotes?: string;
                      quoteFileUrl?: string;
                    }) => (
                      <div key={quote.id} className="rounded-md border p-3">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">
                            {formatCurrency(quote.price, quote.currency)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(quote.createdAt)}
                          </span>
                        </div>
                        {quote.adminNotes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {quote.adminNotes}
                          </p>
                        )}
                        {quote.quoteFileUrl && (
                          <a
                            href={quote.quoteFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block"
                          >
                            <Button variant="outline" size="sm">
                              <FileIcon className="h-4 w-4 mr-2" /> View Quote
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">Request not found.</div>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
