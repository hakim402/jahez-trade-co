// app/[locale]/admin/product-requests/_components/RequestsTable.tsx
"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  PlusCircle,
} from "lucide-react";
import { RequestFilters } from "./RequestFilters";
import { RequestPagination } from "./RequestPagination";
import { RequestDetailsDialog } from "./RequestDetailsDialog";
import {
  getProductRequests,
  type GetRequestsParams,
  type GetRequestsReturn,
} from "../actions";
import { AvatarImage } from "@radix-ui/react-avatar";
import { CreateEditQuoteDialog } from "../../product-quotes/_components/CreateEditQuoteDialog";

const statusColorMap: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  QUOTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ACCEPTED: "bg-green-500/10 text-green-600 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

interface RequestsTableProps {
  initialData: GetRequestsReturn;
}

export function RequestsTable({ initialData }: RequestsTableProps) {
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState<GetRequestsParams>({
    take: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isPending, startTransition] = useTransition();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);
  const [requestIdForQuote, setRequestIdForQuote] = useState<string | null>(
    null,
  );

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let isMounted = true;
    startTransition(async () => {
      try {
        const result = await getProductRequests(params);
        if (isMounted) setData(result);
      } catch (error) {
        if (isMounted) {
          toast.error("Failed to fetch requests", {
            description:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [params]);

  const handleSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, cursor: undefined }));
  }, []);

  const handleStatusFilter = useCallback(
    (status: GetRequestsParams["status"]) => {
      setParams((prev) => ({ ...prev, status, cursor: undefined }));
    },
    [],
  );

  const handleSort = useCallback((sortBy: GetRequestsParams["sortBy"]) => {
    setParams((prev) => {
      const sortOrder =
        prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc";
      return { ...prev, sortBy, sortOrder, cursor: undefined };
    });
  }, []);

  const handleNextPage = useCallback(() => {
    if (data.nextCursor) {
      setParams((prev) => ({ ...prev, cursor: data.nextCursor ?? undefined }));
    }
  }, [data.nextCursor]);

  const handlePreviousPage = useCallback(() => {
    setParams((prev) => ({ ...prev, cursor: undefined }));
  }, []);

  const handleViewDetails = useCallback((requestId: string) => {
    setSelectedRequestId(requestId);
    setIsDetailsOpen(true);
  }, []);

  const handleAddQuote = useCallback((requestId: string) => {
    setRequestIdForQuote(requestId);
    setIsCreateQuoteOpen(true);
  }, []);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <RequestFilters
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        isPending={isPending}
      />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-25">ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead className="text-center">Q/F</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleSort("createdAt")}
                >
                  Created
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-17.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              data.requests.map((request) => (
                <TableRow key={request.id} className="group">
                  <TableCell className="font-mono text-xs">
                    {request.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={request.user.avatarUrl || ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(
                            request.user.fullName,
                            request.user.email,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-30 text-sm">
                        {request.user.fullName || request.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-50">
                    <div className="truncate">
                      {request.productLink ? (
                        <a
                          href={request.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {request.productLink.length > 30
                            ? request.productLink.substring(0, 30) + "..."
                            : request.productLink}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>{request.shippingCountry}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColorMap[request.status]}
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.assignedStaff ? (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(
                              request.assignedStaff.fullName,
                              request.assignedStaff.email,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate max-w-20">
                          {request.assignedStaff.fullName ||
                            request.assignedStaff.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs">
                      {request._count.quotes}/{request._count.files}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(request.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAddQuote(request.id)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Quote
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RequestPagination
        hasNextPage={!!data.nextCursor}
        hasPreviousPage={!!params.cursor}
        onNext={handleNextPage}
        onPrevious={handlePreviousPage}
        isPending={isPending}
        total={data.total}
        currentPage={params.cursor ? "custom" : 1}
      />
      <CreateEditQuoteDialog
        quoteId={null}
        open={isCreateQuoteOpen}
        onOpenChange={setIsCreateQuoteOpen}
        mode="create"
        prefillRequestId={requestIdForQuote}
        onSuccess={() => {
          // refresh table data
          startTransition(async () => {
            const result = await getProductRequests(params);
            setData(result);
          });
        }}
      />

      <RequestDetailsDialog
        requestId={selectedRequestId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
