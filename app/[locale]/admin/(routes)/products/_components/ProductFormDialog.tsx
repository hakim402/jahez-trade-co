"use client"

// app/[locale]/admin/(routes)/products/_components/product-form-dialog.tsx

import { useState, useTransition } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  X,
  Plus,
  Trash2,
  Star,
  Image as ImageIcon,
  Tag,
  Globe,
  DollarSign,
  Loader2,
  Flame,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge }    from "@/components/ui/badge"
import { createProduct, updateProduct } from "../actions"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductImage = {
  url: string
  isPrimary: boolean
  altText: string
  sortOrder: number
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  product?: {
    id: string
    name: string
    nameAr: string | null
    description: string | null
    descriptionAr: string | null
    shortDesc: string | null
    shortDescAr: string | null
    estimatedPrice: any
    currency: string
    sourceCountry: string | null
    sourceUrl: string | null
    supplier: string | null
    category: string | null
    categoryAr: string | null
    tags: string[]
    trendScore: number
    isFeatured: boolean
    isActive: boolean
    images: { url: string; isPrimary: boolean; altText: string | null }[]
  }
}

const COUNTRIES = [
  { code: "CN", label: "🇨🇳 China" },
  { code: "US", label: "🇺🇸 USA" },
  { code: "SA", label: "🇸🇦 Saudi Arabia" },
  { code: "AE", label: "🇦🇪 UAE" },
  { code: "YE", label: "🇾🇪 Yemen" },
  { code: "TR", label: "🇹🇷 Turkey" },
  { code: "IN", label: "🇮🇳 India" },
]

const CURRENCIES = ["USD", "SAR", "AED", "CNY", "EUR"]

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductFormDialog({
  open,
  onOpenChange,
  mode,
  product,
}: ProductFormDialogProps) {
  const [isPending, startTransition] = useTransition()

  const [name,          setName]          = useState(product?.name ?? "")
  const [nameAr,        setNameAr]        = useState(product?.nameAr ?? "")
  const [description,   setDescription]   = useState(product?.description ?? "")
  const [descriptionAr, setDescriptionAr] = useState(product?.descriptionAr ?? "")
  const [shortDesc,     setShortDesc]     = useState(product?.shortDesc ?? "")
  const [shortDescAr,   setShortDescAr]   = useState(product?.shortDescAr ?? "")
  const [estimatedPrice, setEstimatedPrice] = useState(
    product?.estimatedPrice ? String(parseFloat(product.estimatedPrice)) : ""
  )
  const [currency,      setCurrency]      = useState(product?.currency ?? "USD")
  const [sourceCountry, setSourceCountry] = useState(product?.sourceCountry ?? "CN")
  const [sourceUrl,     setSourceUrl]     = useState(product?.sourceUrl ?? "")
  const [supplier,      setSupplier]      = useState(product?.supplier ?? "")
  const [category,      setCategory]      = useState(product?.category ?? "")
  const [categoryAr,    setCategoryAr]    = useState(product?.categoryAr ?? "")
  const [trendScore,    setTrendScore]    = useState(product?.trendScore ?? 50)
  const [isFeatured,    setIsFeatured]    = useState(product?.isFeatured ?? false)
  const [isActive,      setIsActive]      = useState(product?.isActive ?? true)
  const [tags,          setTags]          = useState<string[]>(product?.tags ?? [])
  const [tagInput,      setTagInput]      = useState("")
  const [images,        setImages]        = useState<ProductImage[]>(
    product?.images.map((img, i) => ({
      url: img.url,
      isPrimary: img.isPrimary,
      altText: img.altText ?? "",
      sortOrder: i,
    })) ?? []
  )
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newImageAlt, setNewImageAlt] = useState("")

  // ── Tag handlers ────────────────────────────────────────────────────────────

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) { setTags((p) => [...p, t]); setTagInput("") }
  }
  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag))

  // ── Image handlers ───────────────────────────────────────────────────────────

  const addImage = () => {
    if (!newImageUrl.trim()) return
    setImages((p) => [
      ...p,
      { url: newImageUrl.trim(), isPrimary: p.length === 0, altText: newImageAlt.trim(), sortOrder: p.length },
    ])
    setNewImageUrl(""); setNewImageAlt("")
  }

  const removeImage = (index: number) =>
    setImages((p) => {
      const next = p.filter((_, i) => i !== index)
      if (p[index].isPrimary && next.length > 0) next[0].isPrimary = true
      return next
    })

  const setPrimary = (index: number) =>
    setImages((p) => p.map((img, i) => ({ ...img, isPrimary: i === index })))

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error("Product name is required"); return }

    startTransition(async () => {
      try {
        const data = {
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          description: description.trim() || undefined,
          descriptionAr: descriptionAr.trim() || undefined,
          shortDesc: shortDesc.trim() || undefined,
          shortDescAr: shortDescAr.trim() || undefined,
          estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
          currency,
          sourceCountry,
          sourceUrl: sourceUrl.trim() || undefined,
          supplier: supplier.trim() || undefined,
          category: category.trim() || undefined,
          categoryAr: categoryAr.trim() || undefined,
          tags,
          trendScore,
          isFeatured,
          isActive,
        }

        if (mode === "create") {
          await createProduct({ ...data, images })
          toast.success("Product created successfully")
        } else if (product) {
          await updateProduct(product.id, data)
          toast.success("Product updated successfully")
        }
        onOpenChange(false)
      } catch (err: any) {
        toast.error(err?.message ?? "Something went wrong")
      }
    })
  }

  const scoreLabel =
    trendScore >= 80 ? "🔥 Hot" :
    trendScore >= 60 ? "📈 Rising" :
    trendScore >= 40 ? "Moderate" : "Low"

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">

        {/* Header — matches RequestDetailModal style */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7b57fc]/10">
              <Flame className="h-4 w-4 text-[#7b57fc]" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              {mode === "create" ? "Add Trending Product" : "Edit Product"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">

            {/* Tab bar */}
            <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent px-6 h-auto pb-0 gap-0 justify-start">
              {[
                { value: "basic", label: "Basic Info",      icon: Globe },
                { value: "media", label: "Images",           icon: ImageIcon },
                { value: "meta",  label: "Pricing & Meta",  icon: DollarSign },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#7b57fc] data-[state=active]:bg-transparent data-[state=active]:text-[#7b57fc] text-muted-foreground hover:text-foreground px-4 pb-3 pt-2 text-sm gap-1.5 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Basic Info ────────────────────────────────────────── */}
            <TabsContent value="basic" className="px-6 py-5 space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Product Name (EN) *">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Wireless Earbuds"
                    className="h-9 text-sm rounded-xl"
                    required
                  />
                </Field>
                <Field label="اسم المنتج (AR)">
                  <Input
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: سماعات لاسلكية"
                    className="h-9 text-sm rounded-xl text-right"
                    dir="rtl"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Short Description (EN)">
                  <Input
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="Brief summary"
                    className="h-9 text-sm rounded-xl"
                  />
                </Field>
                <Field label="وصف قصير (AR)">
                  <Input
                    value={shortDescAr}
                    onChange={(e) => setShortDescAr(e.target.value)}
                    placeholder="وصف مختصر"
                    className="h-9 text-sm rounded-xl text-right"
                    dir="rtl"
                  />
                </Field>
              </div>

              <Field label="Description (EN)">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full product description"
                  rows={3}
                  className="text-sm rounded-xl resize-none"
                />
              </Field>

              <Field label="الوصف (AR)">
                <Textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="وصف المنتج الكامل"
                  rows={3}
                  className="text-sm rounded-xl resize-none text-right"
                  dir="rtl"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category (EN)">
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Electronics"
                    className="h-9 text-sm rounded-xl"
                  />
                </Field>
                <Field label="الفئة (AR)">
                  <Input
                    value={categoryAr}
                    onChange={(e) => setCategoryAr(e.target.value)}
                    placeholder="مثال: إلكترونيات"
                    className="h-9 text-sm rounded-xl text-right"
                    dir="rtl"
                  />
                </Field>
              </div>

              {/* Tags */}
              <Field label="Tags">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Type a tag and press Enter"
                    className="h-9 text-sm rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    size="sm"
                    variant="secondary"
                    className="h-9 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs rounded-full"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive ml-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
            </TabsContent>

            {/* ── Images ───────────────────────────────────────────── */}
            <TabsContent value="media" className="px-6 py-5 space-y-4 mt-0">
              {/* Add new image */}
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Add image URL
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                    placeholder="https://example.com/image.jpg"
                    className="h-9 text-sm rounded-xl flex-1"
                  />
                  <Input
                    value={newImageAlt}
                    onChange={(e) => setNewImageAlt(e.target.value)}
                    placeholder="Alt text"
                    className="h-9 text-sm rounded-xl w-36"
                  />
                  <Button
                    type="button"
                    onClick={addImage}
                    size="sm"
                    className="h-9 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {images.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No images added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {images.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      <img
                        src={img.url}
                        alt={img.altText}
                        className="w-11 h-11 rounded-lg object-cover bg-muted flex-shrink-0"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{img.url}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {img.altText || "No alt text"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setPrimary(index)}
                          className={cn(
                            "h-7 w-7 p-0 rounded-lg",
                            img.isPrimary
                              ? "text-amber-500 bg-amber-500/10"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          title={img.isPrimary ? "Primary" : "Set as primary"}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeImage(index)}
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Pricing & Meta ───────────────────────────────────── */}
            <TabsContent value="meta" className="px-6 py-5 space-y-5 mt-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field label="Estimated Price">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={estimatedPrice}
                      onChange={(e) => setEstimatedPrice(e.target.value)}
                      placeholder="0.00"
                      className="h-9 text-sm rounded-xl"
                    />
                  </Field>
                </div>
                <Field label="Currency">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9 text-sm rounded-xl w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Source Country">
                  <Select value={sourceCountry} onValueChange={setSourceCountry}>
                    <SelectTrigger className="h-9 text-sm rounded-xl w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Supplier">
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Supplier name"
                    className="h-9 text-sm rounded-xl"
                  />
                </Field>
              </div>

              <Field label="Source URL">
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://1688.com/…"
                  className="h-9 text-sm rounded-xl"
                />
              </Field>

              {/* Trend score */}
              <Field label={`Trend Score — ${trendScore} (${scoreLabel})`}>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={trendScore}
                    onChange={(e) => setTrendScore(Number(e.target.value))}
                    className="flex-1 accent-[#7b57fc]"
                  />
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background:
                        trendScore >= 80 ? "#ef4444"
                        : trendScore >= 60 ? "#f97316"
                        : trendScore >= 40 ? "#f59e0b"
                        : "var(--muted-foreground)",
                    }}
                  />
                </div>
              </Field>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Visible to clients</p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-[#7b57fc]"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Featured</p>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Switch
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t border-border/50 px-6 py-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 rounded-xl min-w-[130px]"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "create" ? (
                "Create Product"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}