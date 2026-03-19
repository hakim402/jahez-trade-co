"use client"

// app/[locale]/admin/(routes)/products/_components/products-client.tsx

import { useState, useTransition, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
  CheckSquare,
  Square,
  AlertTriangle,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  toggleProductActive,
  toggleProductFeatured,
  softDeleteProduct,
  restoreProduct,
  bulkProductAction,
  type BulkAction,
} from "../actions"
import { ProductFormDialog } from "./ProductFormDialog"
import { TrendScoreDialog } from "./TrendScoreDialog"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type Product = {
  id: string
  name: string
  nameAr: string | null
  shortDesc: string | null
  estimatedPrice: any
  currency: string
  category: string | null
  trendScore: number
  viewCount: number
  inquiryCount: number
  isFeatured: boolean
  isActive: boolean
  isDeleted: boolean
  createdAt: Date
  tags: string[]
  images: { url: string; isPrimary: boolean }[]
  addedBy: { id: string; fullName: string | null; email: string } | null
  _count: { relatedRequests: number }
}

interface ProductsClientProps {
  initialData: {
    products: Product[]
    total: number
    page: number
    limit: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  categories: { value: string; labelAr: string | null }[]
  initialFilters: {
    page: number
    search: string
    category: string
    status: string
    sortBy: string
    sortOrder: "asc" | "desc"
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductsClient({
  initialData,
  categories,
  initialFilters,
}: ProductsClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [search,   setSearch]   = useState(initialFilters.search)
  const [status,   setStatus]   = useState(initialFilters.status)
  const [category, setCategory] = useState(initialFilters.category)

  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set())
  const [deleteTarget,   setDeleteTarget]   = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const [createOpen,          setCreateOpen]          = useState(false)
  const [editProduct,         setEditProduct]         = useState<Product | null>(null)
  const [trendScoreProduct,   setTrendScoreProduct]   = useState<Product | null>(null)

  const products    = initialData.products
  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id))

  // ── Navigation ─────────────────────────────────────────────────────────────

  const pushFilters = useCallback(
    (overrides: Record<string, string | number>) => {
      const params = new URLSearchParams({
        search,
        status,
        category,
        page:      String(initialFilters.page),
        sortBy:    initialFilters.sortBy,
        sortOrder: initialFilters.sortOrder,
        ...Object.fromEntries(
          Object.entries(overrides).map(([k, v]) => [k, String(v)])
        ),
      })
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [search, status, category, initialFilters, pathname, router]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    pushFilters({ search, page: 1 })
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(products.map((p) => p.id)))

  // ── Row actions ────────────────────────────────────────────────────────────

  const handleToggleActive = (id: string) => {
    startTransition(async () => {
      try   { await toggleProductActive(id);   toast.success("Product status updated") }
      catch { toast.error("Failed to update status") }
    })
  }

  const handleToggleFeatured = (id: string) => {
    startTransition(async () => {
      try   { await toggleProductFeatured(id); toast.success("Featured status updated") }
      catch { toast.error("Failed to update") }
    })
  }

  const handleSoftDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await softDeleteProduct(id)
        toast.success("Product deleted")
        setDeleteTarget(null)
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
      } catch { toast.error("Failed to delete product") }
    })
  }

  const handleRestore = (id: string) => {
    startTransition(async () => {
      try   { await restoreProduct(id); toast.success("Product restored") }
      catch { toast.error("Failed to restore") }
    })
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────

  const handleBulkAction = async (action: BulkAction) => {
    if (!selectedIds.size) return
    if (action === "delete") { setBulkDeleteOpen(true); return }
    startTransition(async () => {
      try {
        const result = await bulkProductAction(Array.from(selectedIds), action)
        toast.success(`${result.count} products updated`)
        setSelectedIds(new Set())
      } catch { toast.error("Bulk action failed") }
    })
  }

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    startTransition(async () => {
      try {
        await bulkProductAction(ids, "delete")
        toast.success(`${ids.length} products deleted`)
        setSelectedIds(new Set())
        setBulkDeleteOpen(false)
      } catch { toast.error("Bulk delete failed") }
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col h-full rounded-2xl border border-border/50 bg-card overflow-hidden">

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border/50 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-9 h-9 text-sm rounded-xl bg-background border-border"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="h-9 px-4 rounded-xl"
            >
              Search
            </Button>
          </form>

          <div className="flex gap-2 flex-wrap">
            {/* Status filter */}
            <Select
              value={status}
              onValueChange={(v) => { setStatus(v); pushFilters({ status: v, page: 1 }) }}
            >
              <SelectTrigger className="h-9 w-[130px] text-sm rounded-xl bg-background border-border">
                <Filter className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "all",      label: "All" },
                  { value: "active",   label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "featured", label: "Featured" },
                  { value: "deleted",  label: "Deleted" },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category filter */}
            {categories.length > 0 && (
              <Select
                value={category || "all"}
                onValueChange={(v) => {
                  const cat = v === "all" ? "" : v
                  setCategory(cat)
                  pushFilters({ category: cat, page: 1 })
                }}
              >
                <SelectTrigger className="h-9 w-[140px] text-sm rounded-xl bg-background border-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Add product */}
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="h-9 px-4 rounded-xl gap-1.5 bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </Button>
          </div>
        </div>

        {/* ── Bulk action bar ─────────────────────────────────────── */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden shrink-0"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#7b57fc]/8 border-b border-[#7b57fc]/20">
                <span className="text-sm font-medium text-[#7b57fc]">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2 ml-auto flex-wrap">
                  {(
                    [
                      { action: "activate",   label: "Activate" },
                      { action: "deactivate", label: "Deactivate" },
                      { action: "feature",    label: "Feature" },
                      { action: "unfeature",  label: "Unfeature" },
                    ] as { action: BulkAction; label: string }[]
                  ).map(({ action, label }) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction(action)}
                      disabled={isPending}
                      className="h-7 text-xs rounded-lg"
                    >
                      {label}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("delete")}
                    disabled={isPending}
                    className="h-7 text-xs rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border/50">
                <th className="w-10 px-4 py-3">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                    {allSelected
                      ? <CheckSquare className="w-4 h-4 text-[#7b57fc]" />
                      : <Square className="w-4 h-4" />
                    }
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                  onClick={() =>
                    pushFilters({
                      sortBy: "trendScore",
                      sortOrder:
                        initialFilters.sortBy === "trendScore" && initialFilters.sortOrder === "desc"
                          ? "asc" : "desc",
                    })
                  }
                >
                  Score {initialFilters.sortBy === "trendScore" && (initialFilters.sortOrder === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Views
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Price
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product, i) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={i}
                    isSelected={selectedIds.has(product.id)}
                    isPending={isPending}
                    onSelect={() => toggleSelect(product.id)}
                    onEdit={() => setEditProduct(product)}
                    onToggleActive={() => handleToggleActive(product.id)}
                    onToggleFeatured={() => handleToggleFeatured(product.id)}
                    onDelete={() => setDeleteTarget(product.id)}
                    onRestore={() => handleRestore(product.id)}
                    onEditTrendScore={() => setTrendScoreProduct(product)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────── */}
        {initialData.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 shrink-0">
            <span className="text-xs text-muted-foreground">
              {initialData.total} products · page {initialData.page} of {initialData.pages}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!initialData.hasPrev || isPending}
                onClick={() => pushFilters({ page: initialData.page - 1 })}
                className="h-7 w-7 p-0 rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!initialData.hasNext || isPending}
                onClick={() => pushFilters({ page: initialData.page + 1 })}
                className="h-7 w-7 p-0 rounded-lg"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      <ProductFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />

      {editProduct && (
        <ProductFormDialog
          open={!!editProduct}
          onOpenChange={(open) => !open && setEditProduct(null)}
          mode="edit"
          product={editProduct}
        />
      )}

      {trendScoreProduct && (
        <TrendScoreDialog
          open={!!trendScoreProduct}
          onOpenChange={(open) => !open && setTrendScoreProduct(null)}
          product={trendScoreProduct}
        />
      )}

      {/* Single delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Delete product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the product. You can restore it later from the Deleted filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleSoftDelete(deleteTarget)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Delete {selectedIds.size} products?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All selected products will be soft-deleted and hidden from clients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Row
// ─────────────────────────────────────────────────────────────────────────────

function ProductRow({
  product,
  index,
  isSelected,
  isPending,
  onSelect,
  onEdit,
  onToggleActive,
  onToggleFeatured,
  onDelete,
  onRestore,
  onEditTrendScore,
}: {
  product: Product
  index: number
  isSelected: boolean
  isPending: boolean
  onSelect: () => void
  onEdit: () => void
  onToggleActive: () => void
  onToggleFeatured: () => void
  onDelete: () => void
  onRestore: () => void
  onEditTrendScore: () => void
}) {
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0]

  return (
    <motion.tr
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025 }}
      className={cn(
        "group hover:bg-muted/30 transition-colors",
        isSelected && "bg-[#7b57fc]/5",
        product.isDeleted && "opacity-50"
      )}
    >
      {/* Checkbox */}
      <td className="px-4 py-3">
        <button onClick={onSelect} className="text-muted-foreground hover:text-foreground">
          {isSelected
            ? <CheckSquare className="w-4 h-4 text-[#7b57fc]" />
            : <Square className="w-4 h-4" />
          }
        </button>
      </td>

      {/* Product */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border/50">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-4 h-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
              {product.name}
            </p>
            {product.nameAr && (
              <p className="text-xs text-muted-foreground truncate max-w-[180px] text-right" dir="rtl">
                {product.nameAr}
              </p>
            )}
            {product.tags.length > 0 && (
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {product.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3 hidden md:table-cell">
        {product.category ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {product.category}
          </span>
        ) : (
          <span className="text-muted-foreground/40 text-xs">—</span>
        )}
      </td>

      {/* Trend score */}
      <td className="px-4 py-3">
        <button
          onClick={onEditTrendScore}
          className="flex items-center gap-1.5 group/score hover:bg-muted rounded-lg px-2 py-1 transition-colors -mx-2"
        >
          <TrendScoreBar score={product.trendScore} />
          <span className="text-xs text-muted-foreground group-hover/score:text-foreground transition-colors tabular-nums">
            {product.trendScore}
          </span>
        </button>
      </td>

      {/* Views */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {product.viewCount.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {product.inquiryCount}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {product.isDeleted ? (
            <Badge variant="destructive" className="text-[10px] px-2 py-0 w-fit">
              Deleted
            </Badge>
          ) : product.isActive ? (
            <Badge className="text-[10px] px-2 py-0 w-fit bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-2 py-0 w-fit">
              Inactive
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="text-[10px] px-2 py-0 w-fit bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15">
              <Star className="w-2.5 h-2.5 mr-0.5" />
              Featured
            </Badge>
          )}
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-sm font-medium text-foreground tabular-nums">
          {product.estimatedPrice
            ? `${parseFloat(product.estimatedPrice).toLocaleString()} ${product.currency}`
            : <span className="text-muted-foreground/40">—</span>
          }
        </span>
      </td>

      {/* Row actions */}
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
              <Pencil className="w-3.5 h-3.5" />
              Edit product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditTrendScore} className="gap-2 cursor-pointer">
              <Flame className="w-3.5 h-3.5 text-[#7b57fc]" />
              Edit trend score
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleActive} className="gap-2 cursor-pointer">
              {product.isActive
                ? <><EyeOff className="w-3.5 h-3.5" />Deactivate</>
                : <><Eye className="w-3.5 h-3.5" />Activate</>
              }
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleFeatured} className="gap-2 cursor-pointer">
              {product.isFeatured
                ? <><StarOff className="w-3.5 h-3.5" />Unfeature</>
                : <><Star className="w-3.5 h-3.5 text-amber-500" />Feature</>
              }
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {product.isDeleted ? (
              <DropdownMenuItem onClick={onRestore} className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400">
                <RefreshCw className="w-3.5 h-3.5" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  )
}

// ── Trend score mini bar ──────────────────────────────────────────────────────
function TrendScoreBar({ score }: { score: number }) {
  const pct   = Math.min(100, Math.max(0, score))
  const color =
    pct >= 80 ? "bg-red-500"
    : pct >= 60 ? "bg-orange-500"
    : pct >= 40 ? "bg-amber-500"
    : "bg-muted-foreground/30"

  return (
    <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}