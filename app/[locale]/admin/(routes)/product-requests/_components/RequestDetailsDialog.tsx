// app/[locale]/admin/product-requests/_components/RequestDetailsDialog.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  Package,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  UserMinus,
  PenLine,
} from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  getProductRequestById,
  updateRequestStatus,
  assignStaff,
  addAdminNotes,
  type GetRequestByIdReturn,
} from "../actions";
import { RequestStatus } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusColorMap: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  QUOTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ACCEPTED: "bg-green-500/10 text-green-600 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

interface RequestDetailsDialogProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Placeholder for staff list – in real app, fetch from API
const STAFF_OPTIONS = [
  { id: "staff1", fullName: "John Doe", email: "john@example.com" },
  { id: "staff2", fullName: "Jane Smith", email: "jane@example.com" },
];

export function RequestDetailsDialog({
  requestId,
  open,
  onOpenChange,
}: RequestDetailsDialogProps) {
  const [request, setRequest] = useState<
    GetRequestByIdReturn["request"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states for actions
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus | "">("");
  const [statusNotes, setStatusNotes] = useState("");

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const [showNotesForm, setShowNotesForm] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Confirmation states
  const [showConfirmStatus, setShowConfirmStatus] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    status: RequestStatus;
    notes?: string;
  } | null>(null);

  useEffect(() => {
    if (open && requestId) {
      setLoading(true);
      getProductRequestById({ id: requestId })
        .then((data) => {
          setRequest(data.request);
          // Initialize notes field with existing adminNotes
          setAdminNotes(data.request.adminNotes || "");
        })
        .catch((error) => {
          toast.error("Failed to load request details");
          console.error(error);
        })
        .finally(() => setLoading(false));
    } else {
      setRequest(null);
      // Reset forms
      setShowStatusForm(false);
      setShowAssignForm(false);
      setShowNotesForm(false);
      setNewStatus("");
      setStatusNotes("");
      setSelectedStaffId("");
      setAdminNotes("");
    }
  }, [requestId, open]);

  const getInitials = (name: string | null, email: string) => {
    if (name)
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    return email.substring(0, 2).toUpperCase();
  };

  const handleStatusUpdate = () => {
    if (!newStatus || !request) return;
    setPendingStatusUpdate({
      status: newStatus as RequestStatus,
      notes: statusNotes,
    });
    setShowConfirmStatus(true);
  };

  const confirmStatusUpdate = () => {
    if (!pendingStatusUpdate || !request) return;
    startTransition(async () => {
      try {
        await updateRequestStatus({
          requestId: request.id,
          status: pendingStatusUpdate.status,
          adminNotes: pendingStatusUpdate.notes,
        });
        toast.success(`Status updated to ${pendingStatusUpdate.status}`);
        // Refresh data
        const updated = await getProductRequestById({ id: request.id });
        setRequest(updated.request);
        setShowStatusForm(false);
        setNewStatus("");
        setStatusNotes("");
      } catch (error) {
        toast.error("Failed to update status", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setShowConfirmStatus(false);
        setPendingStatusUpdate(null);
      }
    });
  };

  const handleAddNotes = () => {
    if (!request) return;
    startTransition(async () => {
      try {
        await addAdminNotes({
          requestId: request.id,
          adminNotes,
        });
        toast.success("Admin notes updated");
        const updated = await getProductRequestById({ id: request.id });
        setRequest(updated.request);
        setShowNotesForm(false);
      } catch (error) {
        toast.error("Failed to update notes", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!request) return null;

  return (
    <>
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
            <DialogTitle className="flex items-center gap-2">
              Request #{request.id.slice(0, 8)}
              <Badge
                variant="outline"
                className={statusColorMap[request.status]}
              >
                {request.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Created on {new Date(request.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer bg-indigo-400 dark:bg-indigo-400 text-white"
                  onClick={() => setShowStatusForm(!showStatusForm)}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer bg-indigo-400 dark:bg-indigo-400 text-white"
                  onClick={() => setShowNotesForm(!showNotesForm)}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Edit Notes
                </Button>
              </div>

              {/* Status Update Form */}
              {showStatusForm && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={newStatus}
                      onValueChange={(value) =>
                        setNewStatus(value as RequestStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(RequestStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Add admin notes (optional)"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStatusForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleStatusUpdate}
                        disabled={!newStatus || isPending}
                      >
                        {isPending ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


              {/* Admin Notes Form */}
              {showNotesForm && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Enter admin notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotesForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddNotes}
                        disabled={isPending}
                      >
                        {isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="quotes">
                    Quotes ({request.quotes.length})
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    Files ({request.files.length})
                  </TabsTrigger>
                  <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          Request Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Product Link</p>
                            {request.productLink ? (
                              <a
                                href={request.productLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm break-all"
                              >
                                {request.productLink}
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground">—</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {request.description || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium min-w-20">
                            Quantity:
                          </span>
                          <span className="text-sm">{request.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium min-w-20">
                            Shipping Country:
                          </span>
                          <span className="text-sm">
                            {request.shippingCountry}
                          </span>
                        </div>
                        {request.customNotes && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium min-w-20">
                              Custom Notes:
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {request.customNotes}
                            </span>
                          </div>
                        )}
                        {request.adminNotes && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium min-w-20">
                              Admin Notes:
                            </span>
                            <span className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {request.adminNotes}
                            </span>
                          </div>
                        )}
                        {request.quotedAt && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium min-w-20">
                              Quoted At:
                            </span>
                            <span className="text-sm">
                              {new Date(request.quotedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          User Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(
                                request.user.fullName,
                                request.user.email,
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {request.user.fullName || "No name"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.user.email}</span>
                        </div>
                        {request.user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {request.user.phone}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {request.assignedStaff && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            Assigned Staff
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(
                                  request.assignedStaff.fullName,
                                  request.assignedStaff.email,
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {request.assignedStaff.fullName ||
                                request.assignedStaff.email}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {request.aiDetectedCategory && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          AI Detected Category
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">
                          {request.aiDetectedCategory}
                        </Badge>
                      </CardContent>
                    </Card>
                  )}

                  {request.aiEstimatedPrice && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          AI Estimated Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-semibold">
                          ${request.aiEstimatedPrice.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Quotes Tab */}
                <TabsContent value="quotes" className="space-y-4">
                  {request.quotes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No quotes yet
                    </p>
                  ) : (
                    request.quotes.map((quote) => (
                      <Card key={quote.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {quote.supplier?.name || "Unknown Supplier"}
                              </p>
                              <p className="text-2xl font-bold">
                                {quote.currency} {quote.price.toFixed(2)}
                              </p>
                            </div>
                            <Badge variant="outline">{quote.status}</Badge>
                          </div>
                          {quote.adminNotes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {quote.adminNotes}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-muted-foreground">
                              {new Date(quote.createdAt).toLocaleString()}
                            </span>
                            {quote.quoteFileUrl && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={quote.quoteFileUrl} download>
                                  <Download className="mr-2 h-4 w-4" />
                                  Quote File
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4">
                  {request.files.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No files attached
                    </p>
                  ) : (
                    request.files.map((file) => (
                      <Card key={file.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {file.fileName || "Unnamed file"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {file.fileType} •{" "}
                                  {file.fileSize
                                    ? `${(file.fileSize / 1024).toFixed(2)} KB`
                                    : "Unknown size"}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* AI Suggestions Tab */}
                <TabsContent value="ai" className="space-y-4">
                  {request.aiSuggestions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No AI suggestions available
                    </p>
                  ) : (
                    request.aiSuggestions.map((suggestion) => (
                      <Card key={suggestion.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  suggestion.createdAt,
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-2xl font-bold mt-1">
                                {suggestion.currency}{" "}
                                {suggestion.estimatedPrice.toFixed(2)}
                              </p>
                              {suggestion.confidence && (
                                <p className="text-xs">
                                  Confidence:{" "}
                                  {(suggestion.confidence * 100).toFixed(0)}%
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">AI Generated</Badge>
                          </div>
                          {suggestion.suggestedSupplierIds && (
                            <div className="mt-2">
                              <p className="text-xs font-medium">
                                Suggested Suppliers:
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {JSON.stringify(
                                  suggestion.suggestedSupplierIds,
                                )}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Status Update */}
      <ConfirmDialog
        open={showConfirmStatus}
        onOpenChange={setShowConfirmStatus}
        title="Update Status"
        description={`Are you sure you want to change the status to ${pendingStatusUpdate?.status}?`}
        onConfirm={confirmStatusUpdate}
        loading={isPending}
      />
    </>
  );
}
