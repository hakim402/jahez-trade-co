"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductRequest } from "@prisma/client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
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
import { MoreHorizontal, Eye, Pencil, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import { CreateQuoteDialog } from "./CreateQuoteDialog";
import { RequestDetailsDrawer } from "./RequestDetailsDrawer";

type RequestWithRelations = ProductRequest & {
  user: { fullName: string | null; email: string };
  files: any[];
  quotes: any[];
};

interface RequestsTableProps {
  requests: RequestWithRelations[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

export function RequestsTable({
  requests,
  totalCount,
  pageCount,
  currentPage,
  pageSize,
}: RequestsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<RequestWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const columns: ColumnDef<RequestWithRelations>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: "user.fullName",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.user.fullName || "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.user.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "productLink",
      header: "Product",
      cell: ({ row }) =>
        row.original.productLink ? (
          <a
            href={row.original.productLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate max-w-50 block"
          >
            {row.original.productLink}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variantMap: Record<string, string> = {
          SUBMITTED: "secondary",
          IN_REVIEW: "default",
          QUOTED: "default",
          APPROVED: "default",
          REJECTED: "destructive",
          IN_PRODUCTION: "default",
          SHIPPED: "default",
          COMPLETED: "default",
        };
        return <Badge variant={variantMap[status] as any}>{status}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setSelectedRequest(row.original);
                setDetailsOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedRequest(row.original);
                setStatusDialogOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" /> Update status
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedRequest(row.original);
                setQuoteDialogOpen(true);
              }}
            >
              <FileText className="mr-2 h-4 w-4" /> Add quote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: requests,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total {totalCount} request(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <UpdateStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        request={selectedRequest}
        onSuccess={() => {
          setStatusDialogOpen(false);
          router.refresh();
        }}
      />
      <CreateQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        request={selectedRequest}
        onSuccess={() => {
          setQuoteDialogOpen(false);
          router.refresh();
        }}
      />
      <RequestDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        requestId={selectedRequest?.id}
      />
    </>
  );
}
