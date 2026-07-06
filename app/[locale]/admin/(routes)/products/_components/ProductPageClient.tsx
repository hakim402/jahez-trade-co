"use client";

// app/[locale]/admin/(routes)/products/_components/ProductPageClient.tsx

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  X,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Trash2,
  Edit3,
  Eye,
  TrendingUp,
  Star,
  Package,
  BarChart3,
  Globe,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Upload,
  Download,
  GripVertical,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  AlertCircle,
  Hash,
  Link2,
  Filter,
  ArrowUpDown,
  ShoppingCart,
  Layers,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CreateProductInput,
  UpdateProductInput,
  BulkAction,
} from "../actions";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  toggleProductActive,
  toggleProductFeatured,
  updateTrendScore,
  softDeleteProduct,
  restoreProduct,
  hardDeleteProduct,
  bulkProductAction,
  addProductTags,
  removeProductTag,
  uploadProductImage,
  addProductImageByUrl,
  setPrimaryImage,
  reorderProductImages,
  deleteProductImage,
  updateImageAltText,
  getProductById,
  checkSlugAvailability,
} from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

export type SerializedProduct = {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string | null;
  description: string | null;
  descriptionAr: string | null;
  shortDesc: string | null;
  shortDescAr: string | null;
  estimatedPrice: number | null;
  currency: string;
  sourceCountry: string | null;
  sourceUrl: string | null;
  supplier: string | null;
  category: string | null;
  categoryAr: string | null;
  tags: string[];
  trendScore: number;
  viewCount: number;
  inquiryCount: number;
  isFeatured: boolean;
  featuredUntil: string | null;
  isActive: boolean;
  isDeleted: boolean;
  images: ProductImage[];
  addedBy: { id: string; fullName: string | null; email: string } | null;
  _count: { relatedRequests: number; images: number };
  createdAt: string;
  updatedAt: string;
};

// ─── Client-side slug helper (mirrors the server slugify — used only for
//     live preview / auto-fill; the server always re-validates & dedupes) ────

function slugifyClient(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Hydration-safe relative time ────────────────────────────────────────────

function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    const update = () => {
      const { formatDistanceToNow: fdt } =
        require("date-fns") as typeof import("date-fns");
      setText(fdt(new Date(date), { addSuffix: true }));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date]);
  if (!text) return <span className={className} suppressHydrationWarning />;
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function ActiveBadge({
  isActive,
  isDeleted,
}: {
  isActive: boolean;
  isDeleted: boolean;
}) {
  if (isDeleted)
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
        Deleted
      </span>
    );
  if (!isActive)
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/40">
        Inactive
      </span>
    );
  return null;
}

function TrendBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color =
    clamped >= 75
      ? "bg-emerald-500"
      : clamped >= 40
        ? "bg-amber-500"
        : "bg-blue-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
        {clamped}
      </span>
    </div>
  );
}

function Pagination({
  pagination,
  onPage,
}: {
  pagination: { page: number; limit: number; total: number; pages: number };
  onPage: (p: number) => void;
}) {
  const { page, limit, total, pages } = pagination;
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2))
      nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        Showing{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {total.toLocaleString()}
        </span>
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="text-xs text-muted-foreground px-1">
              …
            </span>
          ) : (
            <Button
              key={n}
              size="icon"
              variant={n === page ? "default" : "outline"}
              className={cn(
                "h-8 w-8 rounded-xl text-xs",
                n === page
                  ? "bg-[#7b57fc] text-white border-[#7b57fc] hover:bg-[#6a48eb]"
                  : "border-border/60",
              )}
              onClick={() => onPage(n as number)}
            >
              {n}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────

function StatsStrip({
  stats,
}: {
  stats: {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    totalViews: number;
    totalInquiries: number;
  };
}) {
  const cards = [
    {
      label: "Total",
      value: stats.total,
      icon: Package,
      grad: "from-[#7b57fc] to-[#2b1cff]",
      sh: "shadow-[#7b57fc]/20",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      grad: "from-emerald-400 to-teal-500",
      sh: "shadow-emerald-500/20",
    },
    {
      label: "Featured",
      value: stats.featured,
      icon: Star,
      grad: "from-amber-400 to-orange-500",
      sh: "shadow-amber-500/20",
    },
    {
      label: "Views",
      value: stats.totalViews,
      icon: Eye,
      grad: "from-sky-400 to-blue-500",
      sh: "shadow-sky-500/20",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, grad, sh }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5"
        >
          <div
            className={cn(
              "absolute -top-4 -right-4 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-linear-to-br",
              grad,
            )}
          />
          <div
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md",
              grad,
              sh,
            )}
          >
            <Icon size={17} className="text-white" />
          </div>
          <div className="relative">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {value.toLocaleString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Image Manager ─────────────────────────────────────────────────────────

function ImageManager({
  productId,
  images,
  onChanged,
}: {
  productId: string;
  images: ProductImage[];
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [primaryId, setPrimaryId_] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [localImages, setLocalImages] = useState<ProductImage[]>(images);
  const [editAlt, setEditAlt] = useState<{ id: string; val: string } | null>(
    null,
  );

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const processFile = async (file: File) => {
    setUploadErr(null);
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setUploadErr("Only JPEG, PNG, WebP or GIF — max 10 MB");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr("Max 10 MB");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadProductImage(productId, fd);
    setUploading(false);
    if (r.success) {
      toast.success("Image uploaded");
      onChanged();
    } else setUploadErr(r.error);
  };

  const handleUrl = async () => {
    if (!urlInput.trim()) return;
    const r = await addProductImageByUrl(productId, { url: urlInput.trim() });
    if (r.success) {
      toast.success("Image added");
      setUrlInput("");
      onChanged();
    } else toast.error(r.error);
  };

  const handleDelete = async (img: ProductImage) => {
    setDeletingId(img.id);
    const r = await deleteProductImage(productId, img.id);
    setDeletingId(null);
    if (r.success) {
      setLocalImages((p) => p.filter((i) => i.id !== img.id));
      onChanged();
      toast.success("Deleted");
    } else toast.error(r.error);
  };

  const handleSetPrimary = async (img: ProductImage) => {
    if (img.isPrimary) return;
    setPrimaryId_(img.id);
    const r = await setPrimaryImage(productId, img.id);
    setPrimaryId_(null);
    if (r.success) {
      setLocalImages((p) =>
        p.map((i) => ({ ...i, isPrimary: i.id === img.id })),
      );
      onChanged();
    } else toast.error(r.error);
  };

  const handleDragStart = (idx: number) => setDraggingIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const updated = [...localImages];
    const [moved] = updated.splice(draggingIdx, 1);
    updated.splice(idx, 0, moved);
    setLocalImages(updated);
    setDraggingIdx(idx);
  };
  const handleDragEnd = async () => {
    setDraggingIdx(null);
    const r = await reorderProductImages(
      productId,
      localImages.map((i) => i.id),
    );
    if (r.success) onChanged();
    else toast.error(r.error);
  };

  const saveAlt = async () => {
    if (!editAlt) return;
    const r = await updateImageAltText(editAlt.id, editAlt.val);
    if (r.success) {
      toast.success("Alt text saved");
      setEditAlt(null);
      onChanged();
    } else toast.error(r.error);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) processFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
          isDragging
            ? "border-[#7b57fc]/60 bg-[#7b57fc]/5"
            : "border-border/40 hover:border-[#7b57fc]/40 hover:bg-muted/10",
        )}
      >
        <Input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Uploading…</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Upload className="w-6 h-6 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Drop or{" "}
              <span className="text-[#7b57fc] underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              JPEG · PNG · WebP · GIF — max 10 MB
            </p>
          </div>
        )}
      </div>
      {uploadErr && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {uploadErr}
        </p>
      )}

      {/* URL input */}
      <div className="flex gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Or paste an image URL…"
          className="h-9 rounded-xl border-border/60 bg-muted/30 text-sm flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl shrink-0 gap-1.5"
          onClick={handleUrl}
          disabled={!urlInput.trim()}
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {/* Image grid */}
      {localImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {localImages.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-square rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none transition-all",
                img.isPrimary
                  ? "border-[#7b57fc] ring-2 ring-[#7b57fc]/20"
                  : "border-border/40 hover:border-border/70",
                draggingIdx === idx && "opacity-50 scale-95",
              )}
            >
              <img
                src={img.url}
                alt={img.altText ?? ""}
                className="w-full h-full object-cover pointer-events-none"
              />
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7b57fc] text-white shadow-md">
                  <Star className="w-2.5 h-2.5 fill-white" /> Primary
                </div>
              )}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-5 h-5 rounded-md bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <GripVertical className="w-3 h-3 text-white" />
                </div>
              </div>
              {/* Action overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent pt-5 pb-1.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end gap-1">
                {!img.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    disabled={primaryId === img.id}
                    className="flex-1 h-6 flex items-center justify-center gap-1 rounded-lg bg-[#7b57fc]/80 hover:bg-[#7b57fc] text-white text-[10px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {primaryId === img.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Star className="w-2.5 h-2.5" /> Set
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() =>
                    setEditAlt({ id: img.id, val: img.altText ?? "" })
                  }
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Edit alt text"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deletingId === img.id}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 py-8 text-center">
          <ImageIcon className="w-7 h-7 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">No images yet</p>
        </div>
      )}

      {/* Alt text editor */}
      {editAlt && (
        <div className="flex gap-2 items-center p-3 rounded-xl bg-muted/20 border border-border/40">
          <Input
            value={editAlt.val}
            onChange={(e) => setEditAlt({ ...editAlt, val: e.target.value })}
            placeholder="Alt text…"
            className="h-8 rounded-xl border-border/60 bg-background text-sm flex-1"
          />
          <Button
            size="sm"
            className="h-8 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shrink-0"
            onClick={saveAlt}
          >
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl shrink-0"
            onClick={() => setEditAlt(null)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Product Form Dialog ──────────────────────────────────────────────────────

type FormTab = "basic" | "details" | "content" | "images";

const EMPTY_FORM = {
  name: "",
  nameAr: "",
  slug: "",
  description: "",
  descriptionAr: "",
  shortDesc: "",
  shortDescAr: "",
  estimatedPrice: "",
  currency: "USD",
  sourceCountry: "CN",
  sourceUrl: "",
  supplier: "",
  category: "",
  categoryAr: "",
  tagsInput: "",
  trendScore: "0",
  isFeatured: false,
  isActive: true,
};

function ProductFormDialog({
  open,
  onClose,
  onDone,
  editProduct,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  editProduct?: SerializedProduct | null;
}) {
  const isEdit = !!editProduct;
  const [isPending, start] = useTransition();
  const [tab, setTab] = useState<FormTab>("basic");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Slug was hand-edited by the user — stop auto-deriving it from the name.
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugHint, setSlugHint] = useState<string | null>(null);
  // For create: after save, keep open to manage images
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdImages, setCreatedImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setErrors({});
    setCreatedId(null);
    setCreatedImages([]);
    setSlugTouched(!!editProduct?.slug);
    setSlugHint(null);
    if (editProduct) {
      setForm({
        name: editProduct.name,
        nameAr: editProduct.nameAr ?? "",
        slug: editProduct.slug ?? "",
        description: editProduct.description ?? "",
        descriptionAr: editProduct.descriptionAr ?? "",
        shortDesc: editProduct.shortDesc ?? "",
        shortDescAr: editProduct.shortDescAr ?? "",
        estimatedPrice:
          editProduct.estimatedPrice !== null
            ? String(editProduct.estimatedPrice)
            : "",
        currency: editProduct.currency,
        sourceCountry: editProduct.sourceCountry ?? "CN",
        sourceUrl: editProduct.sourceUrl ?? "",
        supplier: editProduct.supplier ?? "",
        category: editProduct.category ?? "",
        categoryAr: editProduct.categoryAr ?? "",
        tagsInput: editProduct.tags.join(", "),
        trendScore: String(editProduct.trendScore),
        isFeatured: editProduct.isFeatured,
        isActive: editProduct.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editProduct?.id]);

  const set =
    (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  // Auto-derive the EN slug from the name until the user edits it directly.
  useEffect(() => {
    if (slugTouched) return;
    setForm((p) => ({ ...p, slug: slugifyClient(p.name) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, slugTouched]);

  // Debounced live availability check for the EN slug.
  useEffect(() => {
    if (!form.slug.trim()) {
      setSlugHint(null);
      return;
    }
    setSlugChecking(true);
    const t = setTimeout(async () => {
      const r = await checkSlugAvailability(form.slug, "slug", editProduct?.id);
      setSlugChecking(false);
      if (r.success && !r.data.available) {
        setSlugHint(`Taken — try "${r.data.suggested}"`);
      } else {
        setSlugHint(null);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      setSlugChecking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.slug, editProduct?.id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.estimatedPrice && isNaN(Number(form.estimatedPrice)))
      e.estimatedPrice = "Must be a number";
    if (Number(form.trendScore) < 0 || Number(form.trendScore) > 100)
      e.trendScore = "Must be 0–100";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildInput = (): CreateProductInput => ({
    name: form.name.trim(),
    nameAr: form.nameAr.trim() || undefined,
    slug: form.slug.trim() || undefined,
    description: form.description.trim() || undefined,
    descriptionAr: form.descriptionAr.trim() || undefined,
    shortDesc: form.shortDesc.trim() || undefined,
    shortDescAr: form.shortDescAr.trim() || undefined,
    estimatedPrice: form.estimatedPrice
      ? Number(form.estimatedPrice)
      : undefined,
    currency: form.currency,
    sourceCountry: form.sourceCountry || undefined,
    sourceUrl: form.sourceUrl.trim() || undefined,
    supplier: form.supplier.trim() || undefined,
    category: form.category.trim() || undefined,
    categoryAr: form.categoryAr.trim() || undefined,
    tags: form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    trendScore: Number(form.trendScore) || 0,
    isFeatured: form.isFeatured,
  });

  const handleSubmit = () => {
    if (!validate()) return;
    start(async () => {
      if (isEdit && editProduct) {
        const r = await updateProduct(editProduct.id, {
          ...buildInput(),
          isActive: form.isActive,
        });
        if (r.success) {
          toast.success("Product updated");
          onClose();
          onDone();
        } else toast.error(r.error);
      } else {
        const r = await createProduct(buildInput());
        if (r.success) {
          toast.success("Product created — add images now");
          setCreatedId(r.data.id);
          setCreatedImages(r.data.images ?? []);
        } else toast.error(r.error);
      }
    });
  };

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "text-[10px] font-bold text-muted-foreground uppercase tracking-wide";
  const textareaCls =
    "rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";

  const tabs: { id: FormTab; label: string; icon: React.ElementType }[] = [
    { id: "basic", label: "Basic", icon: Package },
    { id: "details", label: "Details", icon: Tag },
    { id: "content", label: "Content", icon: Layers },
    ...(isEdit
      ? [{ id: "images" as FormTab, label: "Images", icon: ImageIcon }]
      : []),
  ];

  const dialogTitle = isEdit
    ? `Edit: ${editProduct?.name}`
    : createdId
      ? "Add images"
      : "New Product";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
          "[&>button:last-child]:hidden",
        )}
      >
        {/* DialogTitle always in tree */}
        {!isEdit && !createdId && (
          <VisuallyHidden>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </VisuallyHidden>
        )}

        {/* Header */}
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
              {createdId ? (
                <ImageIcon className="w-4 h-4 text-[#7b57fc]" />
              ) : isEdit ? (
                <Edit3 className="w-4 h-4 text-[#7b57fc]" />
              ) : (
                <Plus className="w-4 h-4 text-[#7b57fc]" />
              )}
            </div>
            <DialogTitle className="text-sm font-bold text-foreground">
              {dialogTitle}
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>

        {/* After create: images step */}
        {createdId ? (
          <>
            <div
              className={cn(
                "flex-1 min-h-0 overflow-y-auto px-6 py-5",
                "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
                "[&::-webkit-scrollbar-thumb:hover]:bg-border",
              )}
            >
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Product created! Add images or click Done to finish.
                </p>
              </div>
              <ImageManager
                productId={createdId}
                images={createdImages}
                onChanged={() => {
                  getProductById(createdId).then((r) => {
                    if (r.success)
                      setCreatedImages((r.data as any).images ?? []);
                  });
                  onDone();
                }}
              />
            </div>
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                {createdImages.length} image
                {createdImages.length !== 1 ? "s" : ""} added
              </p>
              <Button
                className="h-9 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-xs gap-1.5"
                onClick={() => {
                  onDone();
                  onClose();
                }}
              >
                <CheckCircle className="w-4 h-4" /> Done
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Form tabs */}
            <div className="shrink-0 flex border-b border-border/40 px-6 overflow-x-auto scrollbar-none">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-1 py-3 mr-6 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0",
                    tab === id
                      ? "border-[#7b57fc] text-[#7b57fc]"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Form body */}
            <div
              className={cn(
                "flex-1 min-h-0 overflow-y-auto px-6 py-5",
                "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
                "[&::-webkit-scrollbar-thumb:hover]:bg-border",
              )}
            >
              <AnimatePresence mode="wait">
                {/* ── Basic ── */}
                {tab === "basic" && (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>
                          Name (EN) <span className="text-[#7b57fc]">*</span>
                        </Label>
                        <Input
                          value={form.name}
                          onChange={set("name")}
                          placeholder="e.g. Wireless Earbuds"
                          className={cn(
                            inputCls,
                            errors.name && "border-red-400",
                          )}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500">{errors.name}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>الاسم (AR)</Label>
                        <Input
                          value={form.nameAr}
                          onChange={set("nameAr")}
                          dir="rtl"
                          placeholder="مثال: سماعات لاسلكية"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Slug */}
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Slug</Label>
                      <div className="relative">
                        <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          value={form.slug}
                          onChange={(e) => {
                            setSlugTouched(true);
                            setForm((p) => ({
                              ...p,
                              slug: slugifyClient(e.target.value),
                            }));
                          }}
                          placeholder="auto-generated-from-name"
                          dir="ltr"
                          className={cn(inputCls, "pl-8 pr-8 font-mono")}
                        />
                        {slugChecking && (
                          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                        )}
                        {!slugChecking && slugTouched && (
                          <button
                            type="button"
                            title="Reset to auto-generated"
                            onClick={() => {
                              setSlugTouched(false);
                              setForm((p) => ({
                                ...p,
                                slug: slugifyClient(p.name),
                              }));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#7b57fc] transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {slugHint ? (
                        <p className="text-[11px] text-amber-500">{slugHint}</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60">
                          /products/{form.slug || "…"}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>
                          Short Description (EN)
                        </Label>
                        <Input
                          value={form.shortDesc}
                          onChange={set("shortDesc")}
                          placeholder="One-liner for cards"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>وصف قصير (AR)</Label>
                        <Input
                          value={form.shortDescAr}
                          onChange={set("shortDescAr")}
                          dir="rtl"
                          placeholder="جملة قصيرة"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Description (EN)</Label>
                      <Textarea
                        value={form.description}
                        onChange={set("description")}
                        rows={4}
                        placeholder="Full product description…"
                        className={textareaCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>الوصف (AR)</Label>
                      <Textarea
                        value={form.descriptionAr}
                        onChange={set("descriptionAr")}
                        rows={4}
                        dir="rtl"
                        placeholder="وصف المنتج الكامل…"
                        className={textareaCls}
                      />
                    </div>
                  </motion.div>
                )}

                {/* ── Details ── */}
                {tab === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.estimatedPrice}
                            onChange={set("estimatedPrice")}
                            placeholder="0.00"
                            dir="ltr"
                            className={cn(
                              inputCls,
                              "pl-8",
                              errors.estimatedPrice && "border-red-400",
                            )}
                          />
                        </div>
                        {errors.estimatedPrice && (
                          <p className="text-xs text-red-500">
                            {errors.estimatedPrice}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Currency</Label>
                        <Select
                          value={form.currency}
                          onValueChange={(v) =>
                            setForm((p) => ({ ...p, currency: v }))
                          }
                        >
                          <SelectTrigger className={cn(inputCls, "w-full")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["USD", "EUR", "GBP", "CNY", "SAR", "AED"].map(
                              (c) => (
                                <SelectItem
                                  key={c}
                                  value={c}
                                  className="text-xs"
                                >
                                  {c}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Source Country</Label>
                        <Input
                          value={form.sourceCountry}
                          onChange={set("sourceCountry")}
                          placeholder="CN"
                          maxLength={2}
                          dir="ltr"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Supplier</Label>
                        <Input
                          value={form.supplier}
                          onChange={set("supplier")}
                          placeholder="Supplier name"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Source URL</Label>
                      <Input
                        value={form.sourceUrl}
                        onChange={set("sourceUrl")}
                        placeholder="https://alibaba.com/product/…"
                        dir="ltr"
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Category (EN)</Label>
                        <Input
                          value={form.category}
                          onChange={set("category")}
                          placeholder="e.g. Electronics"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>الفئة (AR)</Label>
                        <Input
                          value={form.categoryAr}
                          onChange={set("categoryAr")}
                          dir="rtl"
                          placeholder="مثال: إلكترونيات"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Tags (comma-separated)</Label>
                      <Input
                        value={form.tagsInput}
                        onChange={set("tagsInput")}
                        placeholder="summer, electronics, new"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Trend Score (0–100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={form.trendScore}
                        onChange={set("trendScore")}
                        dir="ltr"
                        className={cn(
                          inputCls,
                          "w-28",
                          errors.trendScore && "border-red-400",
                        )}
                      />
                      {errors.trendScore && (
                        <p className="text-xs text-red-500">
                          {errors.trendScore}
                        </p>
                      )}
                    </div>
                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          key: "isActive" as const,
                          label: "Active (visible publicly)",
                        },
                        {
                          key: "isFeatured" as const,
                          label: "Featured (homepage)",
                        },
                      ].map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20"
                        >
                          <Label className="text-xs font-medium text-foreground">
                            {label}
                          </Label>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((p) => ({ ...p, [key]: !p[key] }))
                            }
                            className={cn(
                              "transition-colors",
                              form[key]
                                ? "text-[#7b57fc]"
                                : "text-muted-foreground",
                            )}
                          >
                            {form[key] ? (
                              <ToggleRight className="w-6 h-6" />
                            ) : (
                              <ToggleLeft className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── Content (AI content hints) ── */}
                {tab === "content" && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#7b57fc]/6 border border-[#7b57fc]/15">
                      <Sparkles className="w-4 h-4 text-[#7b57fc] shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Content fields are pulled from the{" "}
                        <strong className="text-foreground">Basic</strong> tab.
                        Use this tab to review how the product will appear on
                        the public listing page.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Public preview (EN)
                      </p>
                      <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                        <p className="text-sm font-bold text-foreground">
                          {form.name || (
                            <span className="text-muted-foreground/40 italic">
                              Name…
                            </span>
                          )}
                        </p>
                        {form.slug && (
                          <p className="text-[11px] font-mono text-[#7b57fc]/80">
                            /products/{form.slug}
                          </p>
                        )}
                        {form.shortDesc && (
                          <p className="text-xs text-muted-foreground">
                            {form.shortDesc}
                          </p>
                        )}
                        {form.description && (
                          <p className="text-xs text-foreground/70 leading-relaxed line-clamp-3">
                            {form.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {form.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/40">
                              {form.category}
                            </span>
                          )}
                          {form.tagsInput
                            .split(",")
                            .filter(Boolean)
                            .map((t, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20"
                              >
                                {t.trim()}
                              </span>
                            ))}
                        </div>
                        {(form.estimatedPrice || form.sourceCountry) && (
                          <div className="flex items-center gap-3 pt-1.5 border-t border-border/30 text-[11px] text-muted-foreground">
                            {form.estimatedPrice && (
                              <span>
                                From $
                                {Number(form.estimatedPrice).toLocaleString()}{" "}
                                {form.currency}
                              </span>
                            )}
                            {form.sourceCountry && (
                              <span>📦 Ships from {form.sourceCountry}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {form.nameAr && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Arabic preview
                        </p>
                        <div
                          className="rounded-xl border border-border/50 bg-card p-4 space-y-1.5"
                          dir="rtl"
                        >
                          <p className="text-sm font-bold text-foreground">
                            {form.nameAr}
                          </p>
                          {form.shortDescAr && (
                            <p className="text-xs text-muted-foreground">
                              {form.shortDescAr}
                            </p>
                          )}
                          {form.descriptionAr && (
                            <p className="text-xs text-foreground/70 leading-relaxed line-clamp-3">
                              {form.descriptionAr}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Images (edit mode only) ── */}
                {tab === "images" && isEdit && editProduct && (
                  <motion.div
                    key="images"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ImageManager
                      productId={editProduct.id}
                      images={editProduct.images}
                      onChanged={onDone}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {tab !== "images" && (
              <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-border/50 bg-background">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {tabs
                    .filter((t) => t.id !== "images")
                    .map(({ id }) => (
                      <Button
                        variant={"ghost"}
                        key={id}
                        onClick={() => setTab(id)}
                        className={cn(
                          "h-2 rounded-full transition-all",
                          tab === id
                            ? "bg-[#7b57fc] w-5"
                            : "bg-muted-foreground/30 w-2",
                        )}
                      />
                    ))}
                </div>
                <div className="flex gap-2 ml-auto">
                  {tab !== "basic" && (
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl text-sm"
                      onClick={() =>
                        setTab(tab === "content" ? "details" : "basic")
                      }
                    >
                      Back
                    </Button>
                  )}
                  {tab !== "content" ? (
                    <Button
                      className="h-10 px-5 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20 text-sm gap-2"
                      onClick={() =>
                        setTab(tab === "basic" ? "details" : "content")
                      }
                    >
                      Next <ChevronDown className="w-4 h-4 -rotate-90" />
                    </Button>
                  ) : (
                    <Button
                      disabled={isPending}
                      className={cn(
                        "h-10 px-5 rounded-xl text-sm gap-2",
                        isPending
                          ? "bg-muted text-muted-foreground"
                          : "bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20",
                      )}
                      onClick={handleSubmit}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />{" "}
                          {isEdit ? "Save changes" : "Create product"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  selected,
  onSelect,
  onEdit,
  onManageImages,
  onDone,
}: {
  product: SerializedProduct;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onManageImages: () => void;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const primaryImg =
    product.images.find((i) => i.isPrimary) ?? product.images[0];

  const handleToggle = () => {
    start(async () => {
      const r = await toggleProductActive(product.id);
      if (r.success) {
        toast.success(product.isActive ? "Deactivated" : "Activated");
        onDone();
      } else toast.error(r.error);
    });
  };
  const handleFeature = () => {
    start(async () => {
      const r = await toggleProductFeatured(product.id);
      if (r.success) {
        toast.success(product.isFeatured ? "Unfeatured" : "Featured");
        onDone();
      } else toast.error(r.error);
    });
  };
  const handleDelete = () => {
    start(async () => {
      const r = product.isDeleted
        ? await restoreProduct(product.id)
        : await softDeleteProduct(product.id);
      if (r.success) {
        toast.success(product.isDeleted ? "Restored" : "Deleted");
        setShowDelete(false);
        onDone();
      } else toast.error(r.error);
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden transition-all duration-200",
        selected
          ? "border-[#7b57fc]/50 ring-2 ring-[#7b57fc]/15"
          : "border-border/50 hover:border-[#7b57fc]/30 hover:shadow-md hover:shadow-[#7b57fc]/5",
        !product.isActive && "opacity-60",
      )}
    >
      {/* Checkbox */}
      <div
        className="absolute top-2.5 left-2.5 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded accent-[#7b57fc] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ opacity: selected ? 1 : undefined }}
        />
      </div>

      {/* Image */}
      <div className="relative h-44 bg-linear-to-br from-muted/30 to-muted/60 overflow-hidden">
        {primaryImg ? (
          <img
            src={primaryImg.url}
            alt={primaryImg.altText ?? product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/20" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {product.isFeatured && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow">
              <Star className="w-2.5 h-2.5 fill-white" /> Featured
            </span>
          )}
          <ActiveBadge
            isActive={product.isActive}
            isDeleted={product.isDeleted}
          />
        </div>
        {product.images.length > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <ImageIcon className="w-2.5 h-2.5" /> {product.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground line-clamp-1">
              {product.name}
            </h3>
            {product.nameAr && (
              <p
                className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1"
                dir="rtl"
              >
                {product.nameAr}
              </p>
            )}
            {product.slug && (
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5 line-clamp-1 flex items-center gap-1">
                <Link2 className="w-2.5 h-2.5 shrink-0" />/{product.slug}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg shrink-0 -mt-0.5"
                disabled={isPending}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit} className="text-xs gap-2">
                <Edit3 className="w-3.5 h-3.5" /> Edit details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onManageImages}
                className="text-xs gap-2"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Manage images
                {product.images.length > 0 && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {product.images.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleFeature}
                className="text-xs gap-2"
              >
                {product.isFeatured ? (
                  <>
                    <Star className="w-3.5 h-3.5" /> Unfeature
                  </>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5" /> Feature
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggle}
                className="text-xs gap-2"
              >
                {product.isActive ? (
                  <ToggleLeft className="w-3.5 h-3.5" />
                ) : (
                  <ToggleRight className="w-3.5 h-3.5" />
                )}
                {product.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              {product.slug && (
                <DropdownMenuItem asChild className="text-xs gap-2">
                  <a
                    href={`/products/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View public page
                  </a>
                </DropdownMenuItem>
              )}
              {product.sourceUrl && (
                <DropdownMenuItem asChild className="text-xs gap-2">
                  <a
                    href={product.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View source
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDelete(true)}
                className={cn(
                  "text-xs gap-2",
                  product.isDeleted
                    ? "text-emerald-500"
                    : "text-red-500 focus:text-red-500",
                )}
              >
                {product.isDeleted ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Restore
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {product.shortDesc && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.shortDesc}
          </p>
        )}

        {/* Trend score */}
        <TrendBar score={product.trendScore} />

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 border-t border-border/30">
          {product.estimatedPrice !== null && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ${product.estimatedPrice.toLocaleString()} {product.currency}
            </span>
          )}
          {product.category && (
            <span className="text-[11px] text-muted-foreground">
              {product.category}
            </span>
          )}
          {product.sourceCountry && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Globe className="w-3 h-3" /> {product.sourceCountry}
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
            <Eye className="w-3 h-3" /> {product.viewCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />{" "}
            {product._count.relatedRequests}
          </span>
        </div>
      </div>

      {/* Delete confirm overlay */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
          >
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="text-center">
              <p className="text-sm font-semibold">
                {product.isDeleted ? "Restore product?" : "Delete product?"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.isDeleted
                  ? "Will be visible publicly again."
                  : "This is reversible."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending}
                className={cn(
                  "h-8 px-4 rounded-xl text-white border-0 text-xs",
                  product.isDeleted
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600",
                )}
                onClick={handleDelete}
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : product.isDeleted ? (
                  "Restore"
                ) : (
                  "Delete"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 rounded-xl text-xs"
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Image Manager Dialog (standalone) ───────────────────────────────────────

function ImageManagerDialog({
  product,
  open,
  onClose,
  onDone,
}: {
  product: SerializedProduct | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  if (!product) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0",
          "[&>button:last-child]:hidden",
        )}
      >
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 border-b border-border/50 bg-muted/10 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7b57fc]/10 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-[#7b57fc]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground leading-none">
                Images
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {product.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </DialogHeader>
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto px-6 py-5",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60",
            "[&::-webkit-scrollbar-thumb:hover]:bg-border",
          )}
        >
          <ImageManager
            productId={product.id}
            images={product.images}
            onChanged={onDone}
          />
        </div>
        <div className="shrink-0 flex items-center justify-end px-6 py-4 border-t border-border/50 bg-muted/10">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-4 rounded-xl text-xs"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  onApply,
  isPending,
  selectedCount,
  onBulkAction,
  categories,
}: {
  filters: {
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  onApply: (patch: Record<string, string | undefined>) => void;
  isPending: boolean;
  selectedCount: number;
  onBulkAction: (action: BulkAction) => void;
  categories: { value: string; labelAr: string | null }[];
}) {
  const [val, setVal] = useState(filters.search ?? "");
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (v: string) => {
    setVal(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(
      () => onApply({ search: v || undefined, page: "1" }),
      380,
    );
  };
  const activeCount = [
    filters.status && filters.status !== "all" ? 1 : 0,
    filters.category ? 1 : 0,
    filters.search ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const BULK_ACTIONS: {
    action: BulkAction;
    label: string;
    danger?: boolean;
  }[] = [
    { action: "activate", label: "Activate" },
    { action: "deactivate", label: "Deactivate" },
    { action: "feature", label: "Feature" },
    { action: "unfeature", label: "Unfeature" },
    { action: "delete", label: "Delete", danger: true },
    { action: "restore", label: "Restore" },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {/* Bulk bar */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#7b57fc]/8 border border-[#7b57fc]/20">
            <Hash className="w-3.5 h-3.5 text-[#7b57fc]" />
            <span className="text-xs text-[#7b57fc] font-semibold">
              {selectedCount} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-[11px] bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 gap-1"
                >
                  Bulk action <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {BULK_ACTIONS.map(({ action, label, danger }) => (
                  <DropdownMenuItem
                    key={action}
                    onClick={() => onBulkAction(action)}
                    className={cn(
                      "text-xs",
                      danger && "text-red-500 focus:text-red-500",
                    )}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-52 max-w-xs">
          {isPending ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Input
            value={val}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name, slug, supplier, tag…"
            className="pl-9 h-9 rounded-xl text-sm border-border/60"
          />
          {val && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleSearch("")}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            onApply({ status: v === "all" ? undefined : v, page: "1" })
          }
        >
          <SelectTrigger
            className={cn(
              "h-9 rounded-xl border-border/60 text-xs w-32",
              filters.status &&
                filters.status !== "all" &&
                "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
            )}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {[
              { v: "all", l: "All" },
              { v: "active", l: "Active" },
              { v: "inactive", l: "Inactive" },
              { v: "featured", l: "Featured" },
              { v: "deleted", l: "Deleted" },
            ].map(({ v, l }) => (
              <SelectItem key={v} value={v} className="text-xs">
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        {categories.length > 0 && (
          <Select
            value={filters.category ?? "__all__"}
            onValueChange={(v) =>
              onApply({ category: v === "__all__" ? undefined : v, page: "1" })
            }
          >
            <SelectTrigger
              className={cn(
                "h-9 rounded-xl border-border/60 text-xs w-36",
                filters.category &&
                  "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
              )}
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" className="text-xs">
                All categories
              </SelectItem>
              {categories.map(({ value }) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select
          value={`${filters.sortBy ?? "createdAt"}_${filters.sortOrder ?? "desc"}`}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split("_");
            onApply({ sortBy, sortOrder, page: "1" });
          }}
        >
          <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc" className="text-xs">
              Newest first
            </SelectItem>
            <SelectItem value="createdAt_asc" className="text-xs">
              Oldest first
            </SelectItem>
            <SelectItem value="trendScore_desc" className="text-xs">
              Trend score ↓
            </SelectItem>
            <SelectItem value="viewCount_desc" className="text-xs">
              Most views
            </SelectItem>
            <SelectItem value="inquiryCount_desc" className="text-xs">
              Most inquiries
            </SelectItem>
            <SelectItem value="estimatedPrice_asc" className="text-xs">
              Price ↑
            </SelectItem>
            <SelectItem value="name_asc" className="text-xs">
              Name A–Z
            </SelectItem>
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              setVal("");
              onApply({
                status: undefined,
                category: undefined,
                search: undefined,
                page: "1",
              });
            }}
          >
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.status && filters.status !== "all" && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              {filters.status}
              <Button
                variant={"ghost"}
                onClick={() => onApply({ status: undefined, page: "1" })}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              {filters.category}
              <Button
                variant={"ghost"}
                onClick={() => onApply({ category: undefined, page: "1" })}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
              "{filters.search}"
              <Button
                variant={"ghost"}
                onClick={() => {
                  setVal("");
                  onApply({ search: undefined, page: "1" });
                }}
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  initialProducts: SerializedProduct[];
  pagination: { page: number; limit: number; total: number; pages: number };
  stats: {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    totalViews: number;
    totalInquiries: number;
  } | null;
  categories: { value: string; labelAr: string | null }[];
  filters: {
    page: number;
    limit: number;
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    sourceCountry?: string;
  };
}

export function ProductPageClient({
  initialProducts,
  pagination,
  stats,
  categories,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, start] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<SerializedProduct | null>(
    null,
  );
  const [imgProduct, setImgProduct] = useState<SerializedProduct | null>(null);
  const [imgOpen, setImgOpen] = useState(false);

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const base = new URLSearchParams();
        const merged: Record<string, string | undefined> = {
          page: String(filters.page),
          status: filters.status,
          category: filters.category,
          search: filters.search,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          ...patch,
        };
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== "" && !(k === "page" && v === "1"))
            base.set(k, v);
        });
        router.push(`${pathname}?${base.toString()}`);
      });
    },
    [filters, router, pathname],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  const openCreate = () => {
    setEditProduct(null);
    setFormOpen(true);
  };
  const openEdit = (p: SerializedProduct) => {
    setEditProduct(p);
    setFormOpen(true);
  };
  const openImages = (p: SerializedProduct) => {
    setImgProduct(p);
    setImgOpen(true);
  };

  const handleBulk = (action: BulkAction) => {
    if (!selectedIds.length) return;
    start(async () => {
      const r = await bulkProductAction(selectedIds, action);
      if (r.success) {
        toast.success(`${r.data.count} products — ${action}`);
        setSelectedIds([]);
        refresh();
      } else toast.error(r.error);
    });
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? initialProducts.map((p) => p.id) : []);
  const allSelected =
    initialProducts.length > 0 &&
    initialProducts.every((p) => selectedIds.includes(p.id));

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      {stats && <StatsStrip stats={stats} />}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onApply={applyFilters}
        isPending={isPending}
        selectedCount={selectedIds.length}
        onBulkAction={handleBulk}
        categories={categories}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 -mt-1">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleAll(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-[#7b57fc] cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </label>
          <p className="text-xs text-muted-foreground">
            {pagination.total.toLocaleString()} product
            {pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-xl gap-1.5 text-xs text-muted-foreground"
            onClick={refresh}
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
            onClick={openCreate}
          >
            <Plus className="w-3.5 h-3.5" /> New Product
          </Button>
        </div>
      </div>

      {/* Grid */}
      {initialProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl border border-dashed border-border/60 bg-card/50"
        >
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Package className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground/70">
              No products found
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Try adjusting your filters or create a new product
            </p>
          </div>
          <Button
            size="sm"
            className="h-9 px-5 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20"
            onClick={openCreate}
          >
            <Plus className="w-3.5 h-3.5" /> Create first product
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence initial={false}>
            {initialProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={selectedIds.includes(product.id)}
                onSelect={() => toggleSelect(product.id)}
                onEdit={() => openEdit(product)}
                onManageImages={() => openImages(product)}
                onDone={refresh}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        pagination={pagination}
        onPage={(p) => applyFilters({ page: String(p) })}
      />

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onDone={refresh}
        editProduct={editProduct}
      />
      <ImageManagerDialog
        product={imgProduct}
        open={imgOpen}
        onClose={() => setImgOpen(false)}
        onDone={refresh}
      />
    </div>
  );
}
