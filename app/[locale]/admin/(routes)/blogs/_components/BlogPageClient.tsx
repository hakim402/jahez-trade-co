"use client";

// app/[locale]/admin/(routes)/blogs/_components/BlogPageClient.tsx

import {
  useState,
  useTransition,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
  FileText,
  BookOpen,
  Tag,
  Image as ImageIcon,
  Upload,
  GripVertical,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Hash,
  FolderTree,
  MessageSquare,
  Heart,
  Calendar,
  Copy,
  Archive,
  Undo2,
  FolderPlus,
  Merge,
  Star,
  Video,
  Link2,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@prisma/client";
import type {
  Locale,
  CreatePostInput,
  BulkPostAction,
  CreateCategoryInput,
  CreateTagInput,
} from "../actions";
import {
  getAllPosts,
  createPost,
  updatePost,
  publishPost,
  unpublishPost,
  archivePost,
  softDeletePost,
  restorePost,
  hardDeletePost,
  bulkPostAction,
  duplicatePost,
  uploadPostImage,
  addPostImageByUrl,
  setPostPrimaryImage,
  reorderPostImages,
  deletePostImage,
  updatePostImageAltText,
  getPostById,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  mergeTags,
  getPostComments,
  moderateDeleteComment,
  restoreComment,
  hardDeleteComment,
  getPostReactionSummary,
  autoFillSeoFields,
  checkSlugAvailability,
  generateUniqueSlug,
  addPostVideo,
  deletePostVideo,
  reorderPostVideos,
} from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PostImage = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

type PostVideo = {
  id: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

type PostTag = {
  tag: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string | null;
  };
};

type PostAuthor = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

type PostCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string | null;
  descEn?: string | null;
  descAr?: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string | null;
  } | null;
  children?: PostCategory[];
  _count?: { posts: number };
};

type TagData = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string | null;
  _count?: { posts: number };
};

export type SerializedPost = {
  id: string;
  titleEn: string;
  titleAr: string | null;
  slugEn: string;
  slugAr: string | null;
  excerptEn: string | null;
  excerptAr: string | null;
  contentEn: string;
  contentAr: string | null;
  status: PostStatus;
  publishedAt: string | null;
  isDeleted: boolean;
  authorId: string;
  author: PostAuthor;
  categoryId: string | null;
  category: PostCategory | null;
  images: PostImage[];
  videos: PostVideo[];
  tags: PostTag[];
  metaTitleEn: string | null;
  metaTitleAr: string | null;
  metaDescriptionEn: string | null;
  metaDescriptionAr: string | null;
  ogImageUrl: string | null;
  ogImageAltEn: string | null;
  ogImageAltAr: string | null;
  twitterCard: string | null;
  canonicalUrl: string | null;
  _count: {
    comments: number;
    reactions: number;
    videos: number;
    images: number;
  };
  createdAt: string;
  updatedAt: string;
};

type SerializedComment = {
  id: string;
  content: string;
  author: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  postId: string;
  parentId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: SerializedComment[];
  _count?: { replies: number; reactions: number };
};

type ReactionSummary = { likes: number; dislikes: number; total: number };

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO URL UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function toEmbedUrl(raw: string): string {
  const s = raw.trim();
  // YouTube watch: https://www.youtube.com/watch?v=ID
  const ytWatch = s.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;
  // YouTube short: https://youtu.be/ID
  const ytShort = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;
  // YouTube shorts: https://youtube.com/shorts/ID
  const ytShorts = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}`;
  // Vimeo: https://vimeo.com/123456789
  const vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // Already an embed or other URL — return as-is
  return s;
}

function getYouTubeThumb(url: string): string | null {
  // Match any YouTube URL (watch, youtu.be, shorts, embed)
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    const update = () =>
      setText(formatDistanceToNow(new Date(date), { addSuffix: true }));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date]);
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}

function StatusBadge({
  status,
  isDeleted,
}: {
  status: PostStatus;
  isDeleted: boolean;
}) {
  if (isDeleted)
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
        Deleted
      </span>
    );
  const variants: Record<PostStatus, { label: string; className: string }> = {
    DRAFT: {
      label: "Draft",
      className: "bg-muted/50 text-muted-foreground border-border/40",
    },
    PUBLISHED: {
      label: "Published",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    ARCHIVED: {
      label: "Archived",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
  };
  const v = variants[status];
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.className}`}
    >
      {v.label}
    </span>
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

function StatsStrip({
  stats,
}: {
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    deleted: number;
    totalComments: number;
    totalReactions: number;
  };
}) {
  const cards = [
    {
      label: "Total Posts",
      value: stats.total,
      icon: FileText,
      grad: "from-[#7b57fc] to-[#2b1cff]",
    },
    {
      label: "Published",
      value: stats.published,
      icon: CheckCircle,
      grad: "from-emerald-400 to-teal-500",
    },
    {
      label: "Drafts",
      value: stats.draft,
      icon: Edit3,
      grad: "from-amber-400 to-orange-500",
    },
    {
      label: "Comments",
      value: stats.totalComments,
      icon: MessageSquare,
      grad: "from-sky-400 to-blue-500",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, grad }, i) => (
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
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md shadow-black/10",
              grad,
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

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-TAG SELECT (replaces broken <Select multiple>)
// ─────────────────────────────────────────────────────────────────────────────

function MultiTagSelect({
  value,
  onChange,
  options,
  placeholder = "Select tags…",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  options: TagData[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );

  const selected = options.filter((o) => value.includes(o.id));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full min-h-9 px-3 py-1.5 flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 text-sm transition-colors hover:border-border focus:outline-none focus-visible:border-[#7b57fc]/60 focus-visible:ring-2 focus-visible:ring-[#7b57fc]/20"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          ) : (
            selected.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#7b57fc]/10 text-[#7b57fc] text-[10px] font-medium border border-[#7b57fc]/20"
              >
                {tag.nameEn}

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(tag.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(tag.id);
                    }
                  }}
                  className="cursor-pointer hover:text-[#5a3fcc] ml-0.5 inline-flex items-center focus:outline-none focus:ring-1 focus:ring-[#7b57fc]/40 rounded-full"
                  aria-label={`Remove tag ${tag.nameEn}`}
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-lg"
          >
            {options.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                No tags available
              </p>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                        isSelected
                          ? "bg-[#7b57fc] border-[#7b57fc]"
                          : "border-border/60 bg-background",
                      )}
                    >
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => toggle(option.id)}
                    />
                    <span className="text-sm flex-1">{option.nameEn}</span>
                    {option.nameAr && (
                      <span
                        className="text-[11px] text-muted-foreground"
                        dir="rtl"
                      >
                        {option.nameAr}
                      </span>
                    )}
                    {option._count && (
                      <span className="text-[10px] text-muted-foreground/60">
                        {option._count.posts}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function ImageManager({
  postId,
  images,
  onChanged,
}: {
  postId: string;
  images: PostImage[];
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [localImages, setLocalImages] = useState<PostImage[]>(images);
  const [editAlt, setEditAlt] = useState<{ id: string; val: string } | null>(
    null,
  );
  const [savingAlt, setSavingAlt] = useState(false);

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // ── Upload from disk ──────────────────────────────────────────────────────

  const processFiles = async (files: FileList) => {
    const ALLOWED = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
    const list = Array.from(files);

    // Validate all first
    for (const f of list) {
      if (!ALLOWED.has(f.type)) {
        toast.error(`${f.name}: Only JPEG/PNG/WebP/GIF`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: Max 10 MB`);
        return;
      }
    }

    setUploadErr(null);
    setUploading(true);
    setUploadProgress(0);

    let succeeded = 0;
    for (let i = 0; i < list.length; i++) {
      const fd = new FormData();
      fd.append("file", list[i]);
      const r = await uploadPostImage(postId, fd);
      if (r.success) {
        succeeded++;
        setUploadProgress(Math.round(((i + 1) / list.length) * 100));
      } else {
        setUploadErr(r.error);
        toast.error(`${list[i].name}: ${r.error}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (succeeded > 0) {
      toast.success(
        succeeded === 1 ? "Image uploaded" : `${succeeded} images uploaded`,
      );
      onChanged();
    }
  };

  // ── Add by URL ────────────────────────────────────────────────────────────

  const handleUrlAdd = async () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Invalid URL");
      return;
    }

    setAddingUrl(true);
    const r = await addPostImageByUrl(postId, {
      url,
      isPrimary: localImages.length === 0,
    });
    setAddingUrl(false);

    if (r.success) {
      toast.success("Image added");
      setUrlInput("");
      onChanged();
    } else {
      toast.error(r.error);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (img: PostImage) => {
    setDeletingId(img.id);
    const r = await deletePostImage(postId, img.id);
    setDeletingId(null);
    if (r.success) {
      setLocalImages((p) => p.filter((i) => i.id !== img.id));
      toast.success("Deleted");
      onChanged();
    } else toast.error(r.error);
  };

  // ── Set primary ───────────────────────────────────────────────────────────

  const handleSetPrimary = async (img: PostImage) => {
    if (img.isPrimary) return;
    setSettingPrimary(img.id);
    const r = await setPostPrimaryImage(postId, img.id);
    setSettingPrimary(null);
    if (r.success) {
      setLocalImages((p) =>
        p.map((i) => ({ ...i, isPrimary: i.id === img.id })),
      );
      onChanged();
    } else toast.error(r.error);
  };

  // ── Drag-to-reorder ───────────────────────────────────────────────────────

  const handleDragStart = (idx: number) => setDraggingIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const arr = [...localImages];
    const [moved] = arr.splice(draggingIdx, 1);
    arr.splice(idx, 0, moved);
    setLocalImages(arr);
    setDraggingIdx(idx);
  };
  const handleDragEnd = async () => {
    setDraggingIdx(null);
    const r = await reorderPostImages(
      postId,
      localImages.map((i) => i.id),
    );
    if (r.success) onChanged();
    else toast.error(r.error);
  };

  // ── Alt text ──────────────────────────────────────────────────────────────

  const saveAlt = async () => {
    if (!editAlt) return;
    setSavingAlt(true);
    const r = await updatePostImageAltText(editAlt.id, editAlt.val);
    setSavingAlt(false);
    if (r.success) {
      toast.success("Alt text saved");
      setEditAlt(null);
      onChanged();
    } else toast.error(r.error);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingZone(true);
        }}
        onDragLeave={() => setIsDraggingZone(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingZone(false);
          if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 select-none",
          isDraggingZone
            ? "border-[#7b57fc]/60 bg-[#7b57fc]/5 scale-[1.01]"
            : "border-border/40 hover:border-[#7b57fc]/40 hover:bg-muted/10",
          uploading && "cursor-default",
        )}
      >
        <Input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="w-6 h-6 mx-auto text-[#7b57fc] animate-spin" />
            <p className="text-sm text-muted-foreground">
              Uploading… {uploadProgress > 0 && `${uploadProgress}%`}
            </p>
            {uploadProgress > 0 && (
              <div className="w-48 mx-auto h-1 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full bg-[#7b57fc] rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Upload className="w-6 h-6 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Drop images here or{" "}
              <span className="text-[#7b57fc] underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              JPEG · PNG · WebP · GIF — max 10 MB each · multiple supported
            </p>
          </div>
        )}
      </div>

      {uploadErr && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {uploadErr}
        </p>
      )}

      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
            placeholder="Or paste an image URL and press Enter…"
            className="pl-9 h-9 rounded-xl border-border/60 bg-muted/30 text-sm"
          />
          {urlInput && (
            <Button
              variant={"ghost"}
              onClick={() => setUrlInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl shrink-0 gap-1.5"
          onClick={handleUrlAdd}
          disabled={addingUrl || !urlInput.trim()}
        >
          {addingUrl ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Add
        </Button>
      </div>

      {/* Image grid */}
      {localImages.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {localImages.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-square rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none transition-all duration-150",
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
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent pt-6 pb-1.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end gap-1">
                {!img.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    disabled={settingPrimary === img.id}
                    className="flex-1 h-6 flex items-center justify-center gap-1 rounded-lg bg-[#7b57fc]/80 hover:bg-[#7b57fc] text-white text-[10px] font-semibold transition-colors disabled:opacity-50"
                    title="Set as primary"
                  >
                    {settingPrimary === img.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Star className="w-2.5 h-2.5" /> Primary
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
                  title="Delete image"
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
          <p className="text-xs text-muted-foreground">
            No images yet — upload files or add a URL above
          </p>
        </div>
      )}

      {/* Alt text editor */}
      {editAlt && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 items-center p-3 rounded-xl bg-muted/20 border border-border/40"
        >
          <Input
            value={editAlt.val}
            onChange={(e) => setEditAlt({ ...editAlt, val: e.target.value })}
            placeholder="Describe this image for accessibility…"
            className="h-8 rounded-xl border-border/60 bg-background text-sm flex-1"
            autoFocus
          />
          <Button
            size="sm"
            className="h-8 rounded-xl bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shrink-0"
            onClick={saveAlt}
            disabled={savingAlt}
          >
            {savingAlt ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl shrink-0"
            onClick={() => setEditAlt(null)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function VideoManager({
  postId,
  videos,
  onChanged,
}: {
  postId: string;
  videos: PostVideo[];
  onChanged: () => void;
}) {
  const [localVideos, setLocalVideos] = useState(videos);
  const [isAdding, setIsAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [urlErr, setUrlErr] = useState<string | null>(null);

  useEffect(() => {
    setLocalVideos(videos);
  }, [videos]);

  const handleAdd = async () => {
    const raw = url.trim();
    if (!raw) return;

    // Basic URL validation
    try {
      new URL(raw);
    } catch {
      setUrlErr("Please enter a valid URL");
      return;
    }
    setUrlErr(null);

    const embedUrl = toEmbedUrl(raw);
    setIsAdding(true);
    const r = await addPostVideo(postId, { url: embedUrl });
    setIsAdding(false);

    if (r.success) {
      toast.success("Video added");
      setUrl("");
      onChanged();
    } else toast.error(r.error);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const r = await deletePostVideo(postId, id);
    setDeletingId(null);
    if (r.success) {
      setLocalVideos((p) => p.filter((v) => v.id !== id));
      onChanged();
      toast.success("Removed");
    } else toast.error(r.error);
  };

  const handleDragStart = (idx: number) => setDraggingIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const arr = [...localVideos];
    const [moved] = arr.splice(draggingIdx, 1);
    arr.splice(idx, 0, moved);
    setLocalVideos(arr);
    setDraggingIdx(idx);
  };
  const handleDragEnd = async () => {
    setDraggingIdx(null);
    const r = await reorderPostVideos(
      postId,
      localVideos.map((v) => v.id),
    );
    if (r.success) onChanged();
    else toast.error(r.error);
  };

  // Detect if URL is convertible
  const isYouTube = /(?:youtube\.com|youtu\.be)/.test(url);
  const isVimeo = /vimeo\.com/.test(url);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlErr(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="YouTube, Vimeo, or embed URL…"
              className="pl-9 h-9 rounded-xl border-border/60 bg-muted/30 text-sm"
            />
          </div>
          <Button
            size="sm"
            className="h-9 rounded-xl gap-1.5 bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
            onClick={handleAdd}
            disabled={isAdding || !url.trim()}
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add
          </Button>
        </div>
        {(isYouTube || isVimeo) && (
          <p className="text-[10px] text-[#7b57fc] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {isYouTube
              ? "YouTube URL detected — will auto-convert to embed"
              : "Vimeo URL detected — will auto-convert to embed"}
          </p>
        )}
        {urlErr && (
          <p className="text-[10px] text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {urlErr}
          </p>
        )}
      </div>

      {localVideos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 py-6 text-center">
          <Video className="w-6 h-6 mx-auto text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">No videos added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {localVideos.map((video, idx) => {
            const thumb = getYouTubeThumb(video.url);
            return (
              <div
                key={video.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border border-border/50 bg-muted/20 cursor-grab active:cursor-grabbing group transition-all",
                  draggingIdx === idx && "opacity-50 scale-98",
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                {thumb ? (
                  <div className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img
                      src={thumb}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center">
                        <div className="w-0 h-0 border-y-4 border-y-transparent border-l-[7px] border-l-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                  {video.url.replace(/^https?:\/\//, "")}
                </span>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                >
                  {deletingId === video.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function CategoryManager({
  categories,
  onChanged,
}: {
  categories: PostCategory[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PostCategory | null>(null);
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    slug: "",
    nameEn: "",
    nameAr: "",
    descEn: "",
    descAr: "",
    parentId: "",
  });

  const reset = () =>
    setForm({
      slug: "",
      nameEn: "",
      nameAr: "",
      descEn: "",
      descAr: "",
      parentId: "",
    });

  const openCreate = () => {
    setEditing(null);
    reset();
    setOpen(true);
  };
  const openEdit = (cat: PostCategory) => {
    setEditing(cat);
    setForm({
      slug: cat.slug,
      nameEn: cat.nameEn,
      nameAr: cat.nameAr || "",
      descEn: cat.descEn || "",
      descAr: cat.descAr || "",
      parentId: cat.parentId || "",
    });
  };

  const handleSubmit = () => {
    if (!form.slug.trim() || !form.nameEn.trim()) {
      toast.error("Slug and English name required");
      return;
    }
    start(async () => {
      const input: CreateCategoryInput = {
        slug: form.slug.trim(),
        nameEn: form.nameEn.trim(),
        nameAr: form.nameAr.trim() || undefined,
        descEn: form.descEn.trim() || undefined,
        descAr: form.descAr.trim() || undefined,
        parentId: form.parentId || null,
      };
      const r = editing
        ? await updateCategory(editing.id, input)
        : await createCategory(input);
      if (r.success) {
        toast.success(editing ? "Updated" : "Created");
        reset();
        setEditing(null);
        onChanged();
      } else toast.error(r.error);
    });
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this category? Posts using it will become uncategorised.",
      )
    )
      return;
    const r = await deleteCategory(id);
    if (r.success) {
      toast.success("Deleted");
      onChanged();
    } else toast.error(r.error);
  };

  const renderTree = (items: PostCategory[], depth = 0): React.ReactNode =>
    items.map((cat) => (
      <div key={cat.id} style={{ marginLeft: depth * 16 }}>
        <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-muted/30 group">
          <div className="flex items-center gap-2 min-w-0">
            <FolderTree className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            <span className="text-sm truncate">{cat.nameEn}</span>
            {cat.nameAr && (
              <span
                className="text-xs text-muted-foreground truncate"
                dir="rtl"
              >
                / {cat.nameAr}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/50 shrink-0">
              ({cat.slug})
            </span>
            {cat._count && (
              <span className="text-[10px] text-muted-foreground/50 shrink-0">
                {cat._count.posts} posts
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => openEdit(cat)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-500"
              onClick={() => handleDelete(cat.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {cat.children &&
          cat.children.length > 0 &&
          renderTree(cat.children, depth + 1)}
      </div>
    ));

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 rounded-xl gap-1.5 text-xs"
        onClick={openCreate}
      >
        <FolderPlus className="w-3.5 h-3.5" /> Categories
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit: ${editing.nameEn}` : "Manage Categories"}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable content – hides scrollbar */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Slug *
                </Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Name EN *
                </Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameEn: e.target.value }))
                  }
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Name AR
                </Label>
                <Input
                  value={form.nameAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameAr: e.target.value }))
                  }
                  dir="rtl"
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Parent
                </Label>
                <Select
                  value={form.parentId || "__none__"}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      parentId: v === "__none__" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {categories
                      .filter((c) => c.id !== editing?.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nameEn}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Description EN
                </Label>
                <Textarea
                  value={form.descEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descEn: e.target.value }))
                  }
                  rows={2}
                  className="text-sm mt-1 resize-none"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Description AR
                </Label>
                <Textarea
                  value={form.descAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descAr: e.target.value }))
                  }
                  rows={2}
                  dir="rtl"
                  className="text-sm mt-1 resize-none"
                />
              </div>
            </div>

            {categories.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Hierarchy
                </p>
                <div className="space-y-0.5">
                  {renderTree(categories.filter((c) => !c.parentId))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed footer with buttons */}
          <div className="shrink-0 p-4 border-t flex items-center justify-between gap-3 bg-card/95 backdrop-blur-sm">
            {editing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  setEditing(null);
                  reset();
                }}
              >
                Cancel edit
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              {editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                className="bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : editing ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAG MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function TagManager({
  tags,
  onChanged,
}: {
  tags: TagData[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TagData | null>(null);
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({ slug: "", nameEn: "", nameAr: "" });
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  const reset = () => setForm({ slug: "", nameEn: "", nameAr: "" });

  const handleSubmit = () => {
    if (!form.slug.trim() || !form.nameEn.trim()) {
      toast.error("Slug and name required");
      return;
    }
    start(async () => {
      const input: CreateTagInput = {
        slug: form.slug.trim(),
        nameEn: form.nameEn.trim(),
        nameAr: form.nameAr.trim() || undefined,
      };
      const r = editing
        ? await updateTag(editing.id, input)
        : await createTag(input);
      if (r.success) {
        toast.success(editing ? "Updated" : "Created");
        reset();
        setEditing(null);
        onChanged();
      } else toast.error(r.error);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete tag? It will be removed from all posts.")) return;
    const r = await deleteTag(id);
    if (r.success) {
      toast.success("Deleted");
      onChanged();
    } else toast.error(r.error);
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) {
      toast.error("Select two different tags");
      return;
    }
    const r = await mergeTags(mergeSource, mergeTarget);
    if (r.success) {
      toast.success(`Merged: ${r.data.movedCount} posts updated`);
      setMergeSource("");
      setMergeTarget("");
      onChanged();
    } else toast.error(r.error);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 rounded-xl gap-1.5 text-xs"
        onClick={() => {
          setEditing(null);
          reset();
          setOpen(true);
        }}
      >
        <Tag className="w-3.5 h-3.5" /> Tags
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          {/* Header */}
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit tag: ${editing.nameEn}` : "Manage Tags"}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable content – hides scrollbar */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Slug *
                </Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Name EN *
                </Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameEn: e.target.value }))
                  }
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Name AR
                </Label>
                <Input
                  value={form.nameAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameAr: e.target.value }))
                  }
                  dir="rtl"
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>

            {/* Existing tags */}
            {tags.length > 0 && (
              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Existing Tags ({tags.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] text-[11px] border border-[#7b57fc]/20"
                    >
                      {t.nameEn}
                      {t._count && (
                        <span className="text-[#7b57fc]/50">
                          ({t._count.posts})
                        </span>
                      )}
                      <Button
                        variant={"ghost"}
                        onClick={() => {
                          setEditing(t);
                          setForm({
                            slug: t.slug,
                            nameEn: t.nameEn,
                            nameAr: t.nameAr || "",
                          });
                        }}
                      >
                        <Edit3 className="w-2.5 h-2.5 hover:text-[#5a3fcc]" />
                      </Button>
                      <Button
                        variant={"ghost"}
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="w-2.5 h-2.5 text-red-400 hover:text-red-500" />
                      </Button>
                    </span>
                  ))}
                </div>

                {/* Merge section */}
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    <Merge className="w-3 h-3 inline mr-1" /> Merge Tags
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Source tag will be deleted; its posts move to target.
                  </p>
                  <div className="flex gap-2 items-center">
                    <Select value={mergeSource} onValueChange={setMergeSource}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Source tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-xs shrink-0">
                      →
                    </span>
                    <Select value={mergeTarget} onValueChange={setMergeTarget}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Target tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8 bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0"
                      onClick={handleMerge}
                    >
                      Merge
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed footer with action buttons */}
          <div className="shrink-0 p-4 border-t flex justify-end gap-2 bg-card/95 backdrop-blur-sm">
            {editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  reset();
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              className="bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : editing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function CommentManager({
  postId,
  commentCount,
  onChanged,
}: {
  postId: string;
  commentCount: number;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<SerializedComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getPostComments({
      postId,
      page: 1,
      limit: 100,
      includeDeleted,
      topLevelOnly: false,
    });
    if (r.success) setComments(r.data.comments);
    else toast.error(r.error);
    setLoading(false);
  }, [postId, includeDeleted]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const moderate = async (id: string, action: "soft" | "restore" | "hard") => {
    const r =
      action === "soft"
        ? await moderateDeleteComment(id)
        : action === "restore"
          ? await restoreComment(id)
          : await hardDeleteComment(id);
    if (r.success) {
      toast.success("Done");
      load();
      onChanged();
    } else toast.error(r.error);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="w-3 h-3" /> {commentCount}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold">
              Moderate Comments
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable content – hides scrollbar */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                  className="accent-[#7b57fc] w-3.5 h-3.5"
                />
                Show deleted comments
              </label>
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="space-y-3">
              {!loading && comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No comments yet
                  </p>
                </div>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "p-3 rounded-xl border",
                    c.isDeleted
                      ? "bg-red-500/5 border-red-500/20"
                      : "border-border/50 bg-muted/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold shrink-0">
                        {(
                          c.author.fullName?.[0] || c.author.email[0]
                        ).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">
                          {c.author.fullName || c.author.email}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          <RelativeTime date={c.createdAt} />
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!c.isDeleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                          onClick={() => moderate(c.id, "soft")}
                          title="Soft delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      {c.isDeleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => moderate(c.id, "restore")}
                          title="Restore"
                        >
                          <Undo2 className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => moderate(c.id, "hard")}
                        title="Permanently delete"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs mt-2 text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {c.content}
                  </p>
                  {c.replies && c.replies.length > 0 && (
                    <div className="ml-6 mt-2 space-y-2 pl-3 border-l-2 border-border/30">
                      {c.replies.map((r) => (
                        <div
                          key={r.id}
                          className="text-[11px] text-muted-foreground"
                        >
                          <span className="font-medium text-foreground/70">
                            {r.author.fullName || r.author.email}:
                          </span>{" "}
                          {r.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* No footer needed – dialog can be closed by X button or clicking outside */}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REACTION SUMMARY (inline, lazy-loaded)
// ─────────────────────────────────────────────────────────────────────────────

function ReactionSummary({ postId }: { postId: string }) {
  const [summary, setSummary] = useState<ReactionSummary | null>(null);
  useEffect(() => {
    getPostReactionSummary(postId).then((r) => {
      if (r.success) setSummary(r.data);
    });
  }, [postId]);
  if (!summary || summary.total === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Heart className="w-3 h-3 text-red-400" />
      {summary.likes}
      {summary.dislikes > 0 && (
        <span className="opacity-60">/ {summary.dislikes} 👎</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST FORM DIALOG
// ─────────────────────────────────────────────────────────────────────────────

type FormTab = "basic" | "content" | "media" | "seo";

const EMPTY_FORM = {
  titleEn: "",
  titleAr: "",
  slugEn: "",
  slugAr: "",
  excerptEn: "",
  excerptAr: "",
  contentEn: "",
  contentAr: "",
  status: "DRAFT" as PostStatus,
  publishedAt: "",
  categoryId: "",
  tagIds: [] as string[],
  metaTitleEn: "",
  metaTitleAr: "",
  metaDescriptionEn: "",
  metaDescriptionAr: "",
  ogImageUrl: "",
  ogImageAltEn: "",
  ogImageAltAr: "",
  twitterCard: "summary_large_image",
  canonicalUrl: "",
};

function PostFormDialog({
  open,
  onClose,
  onDone,
  editPost,
  categories,
  tags,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  editPost?: SerializedPost | null;
  categories: PostCategory[];
  tags: TagData[];
}) {
  const isEdit = !!editPost;
  const [isPending, start] = useTransition();
  const [tab, setTab] = useState<FormTab>("basic");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdImages, setCreatedImages] = useState<PostImage[]>([]);
  const [createdVideos, setCreatedVideos] = useState<PostVideo[]>([]);
  const [slugAvail, setSlugAvail] = useState<{
    en: boolean | null;
    ar: boolean | null;
  }>({ en: null, ar: null });
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise form on open
  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setErrors({});
    setCreatedId(null);
    setCreatedImages([]);
    setCreatedVideos([]);
    setSlugAvail({ en: null, ar: null });
    if (editPost) {
      setForm({
        titleEn: editPost.titleEn,
        titleAr: editPost.titleAr ?? "",
        slugEn: editPost.slugEn,
        slugAr: editPost.slugAr ?? "",
        excerptEn: editPost.excerptEn ?? "",
        excerptAr: editPost.excerptAr ?? "",
        contentEn: editPost.contentEn,
        contentAr: editPost.contentAr ?? "",
        status: editPost.status,
        publishedAt: editPost.publishedAt
          ? editPost.publishedAt.slice(0, 16)
          : "",
        categoryId: editPost.categoryId ?? "",
        tagIds: editPost.tags.map((t) => t.tag.id),
        metaTitleEn: editPost.metaTitleEn ?? "",
        metaTitleAr: editPost.metaTitleAr ?? "",
        metaDescriptionEn: editPost.metaDescriptionEn ?? "",
        metaDescriptionAr: editPost.metaDescriptionAr ?? "",
        ogImageUrl: editPost.ogImageUrl ?? "",
        ogImageAltEn: editPost.ogImageAltEn ?? "",
        ogImageAltAr: editPost.ogImageAltAr ?? "",
        twitterCard: editPost.twitterCard ?? "summary_large_image",
        canonicalUrl: editPost.canonicalUrl ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editPost?.id]);

  const setField =
    (k: keyof typeof EMPTY_FORM) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  // Debounced slug availability check
  useEffect(() => {
    if (!form.slugEn && !form.slugAr) return;
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    slugTimerRef.current = setTimeout(async () => {
      setCheckingSlug(true);
      const [enR, arR] = await Promise.all([
        form.slugEn
          ? checkSlugAvailability(form.slugEn, "en", editPost?.id)
          : Promise.resolve(null),
        form.slugAr
          ? checkSlugAvailability(form.slugAr, "ar", editPost?.id)
          : Promise.resolve(null),
      ]);
      setSlugAvail({
        en: enR?.success ? enR.data.available : null,
        ar: arR?.success ? arR.data.available : null,
      });
      setCheckingSlug(false);
    }, 500);
    return () => {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    };
  }, [form.slugEn, form.slugAr, editPost?.id]);

  const genSlug = async (locale: Locale) => {
    const title = locale === "en" ? form.titleEn : form.titleAr;
    if (!title.trim()) {
      toast.error("Enter a title first");
      return;
    }
    const r = await generateUniqueSlug(title, locale, editPost?.id);
    if (r.success)
      setForm((p) => ({
        ...p,
        [locale === "en" ? "slugEn" : "slugAr"]: r.data.slug,
      }));
    else toast.error(r.error);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.titleEn.trim()) e.titleEn = "Required";
    if (!form.slugEn.trim()) e.slugEn = "Required";
    if (!form.contentEn.trim()) e.contentEn = "Required";
    if (slugAvail.en === false) e.slugEn = "Slug already taken";
    if (slugAvail.ar === false) e.slugAr = "Slug already taken";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildInput = (): CreatePostInput => ({
    titleEn: form.titleEn.trim(),
    titleAr: form.titleAr.trim() || undefined,
    slugEn: form.slugEn.trim(),
    slugAr: form.slugAr.trim() || undefined,
    excerptEn: form.excerptEn.trim() || undefined,
    excerptAr: form.excerptAr.trim() || undefined,
    contentEn: form.contentEn,
    contentAr: form.contentAr || undefined,
    status: form.status,
    publishedAt: form.publishedAt ? new Date(form.publishedAt) : undefined,
    categoryId: form.categoryId || undefined,
    tagIds: form.tagIds,
    metaTitleEn: form.metaTitleEn.trim() || undefined,
    metaTitleAr: form.metaTitleAr.trim() || undefined,
    metaDescriptionEn: form.metaDescriptionEn.trim() || undefined,
    metaDescriptionAr: form.metaDescriptionAr.trim() || undefined,
    ogImageUrl: form.ogImageUrl.trim() || undefined,
    ogImageAltEn: form.ogImageAltEn.trim() || undefined,
    ogImageAltAr: form.ogImageAltAr.trim() || undefined,
    twitterCard: form.twitterCard,
    canonicalUrl: form.canonicalUrl.trim() || undefined,
  });

  const handleSubmit = () => {
    if (!validate()) {
      toast.error("Please fix the errors below");
      return;
    }
    start(async () => {
      if (isEdit && editPost) {
        const r = await updatePost(editPost.id, buildInput());
        if (r.success) {
          toast.success("Post updated");
          onClose();
          onDone();
        } else toast.error(r.error);
      } else {
        const r = await createPost(buildInput());
        if (r.success) {
          toast.success("Post created — add images & videos");
          setCreatedId(r.data.id);
          setCreatedImages(r.data.images ?? []);
          setCreatedVideos(r.data.videos ?? []);
        } else toast.error(r.error);
      }
    });
  };

  const handleAutoSeo = async () => {
    if (!editPost) return;
    const r = await autoFillSeoFields(editPost.id);
    if (r.success) {
      if (r.data.filled.length)
        (toast.success(`Filled: ${r.data.filled.join(", ")}`), onDone());
      else toast.info("All SEO fields are already filled");
    } else toast.error(r.error);
  };

  const refreshMedia = async (id: string) => {
    const r = await getPostById(id);
    if (r.success) {
      setCreatedImages((r.data as any).images ?? []);
      setCreatedVideos((r.data as any).videos ?? []);
    }
    onDone();
  };

  const inputCls =
    "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
  const labelCls =
    "block text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1";
  const textareaCls =
    "rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";

  const TABS: { id: FormTab; label: string; icon: LucideIcon }[] = [
    { id: "basic", label: "Basic", icon: FileText },
    { id: "content", label: "Content", icon: BookOpen },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "seo", label: "SEO", icon: Sparkles },
  ];

  // ── After creation: media screen ──────────────────────────────────────────
  if (createdId) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <DialogContent className="w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              Post created — add media (optional)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none p-5 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" /> Images
              </h3>
              <ImageManager
                postId={createdId}
                images={createdImages}
                onChanged={() => refreshMedia(createdId)}
              />
            </div>
            <div className="border-t pt-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Video className="w-3.5 h-3.5" /> Videos
              </h3>
              <VideoManager
                postId={createdId}
                videos={createdVideos}
                onChanged={() => refreshMedia(createdId)}
              />
            </div>
          </div>
          <div className="shrink-0 p-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onDone();
                onClose();
              }}
            >
              Skip for now
            </Button>
            <Button
              className="bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
              onClick={() => {
                onDone();
                onClose();
              }}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
        <VisuallyHidden>
          <DialogTitle>
            {isEdit ? `Edit: ${editPost?.titleEn}` : "New Post"}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7b57fc]/10 flex items-center justify-center">
              {isEdit ? (
                <Edit3 className="w-3.5 h-3.5 text-[#7b57fc]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-[#7b57fc]" />
              )}
            </div>
            <span className="text-sm font-bold">
              {isEdit ? `Edit: ${editPost?.titleEn.slice(0, 40)}` : "New Post"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-xl"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4 gap-0 overflow-x-auto shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                tab === id
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none p-5 space-y-4">
          {/* Basic tab */}
          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Title (English) *</label>
                  <Input
                    value={form.titleEn}
                    onChange={setField("titleEn")}
                    className={cn(inputCls, errors.titleEn && "border-red-400")}
                    placeholder="Post title in English"
                  />
                  {errors.titleEn && (
                    <p className="text-[10px] text-red-500 mt-0.5">
                      {errors.titleEn}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>العنوان (عربي)</label>
                  <Input
                    value={form.titleAr}
                    onChange={setField("titleAr")}
                    dir="rtl"
                    className={inputCls}
                    placeholder="عنوان المنشور بالعربية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Slug EN *</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        value={form.slugEn}
                        onChange={setField("slugEn")}
                        className={cn(
                          inputCls,
                          "pr-8",
                          errors.slugEn && "border-red-400",
                        )}
                        placeholder="my-post-slug"
                      />
                      {checkingSlug && (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      )}
                      {!checkingSlug && slugAvail.en === true && (
                        <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {!checkingSlug && slugAvail.en === false && (
                        <AlertCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-500" />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-2.5 rounded-xl shrink-0"
                      onClick={() => genSlug("en")}
                      title="Auto-generate slug"
                    >
                      <Sparkles className="w-3 h-3" />
                    </Button>
                  </div>
                  {errors.slugEn && (
                    <p className="text-[10px] text-red-500 mt-0.5">
                      {errors.slugEn}
                    </p>
                  )}
                  {slugAvail.en === false && (
                    <p className="text-[10px] text-red-500 mt-0.5">
                      Slug already in use
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Slug AR</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        value={form.slugAr}
                        onChange={setField("slugAr")}
                        className={cn(
                          inputCls,
                          "pr-8",
                          errors.slugAr && "border-red-400",
                        )}
                        placeholder="my-post-slug-ar"
                      />
                      {!checkingSlug && slugAvail.ar === true && (
                        <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {!checkingSlug && slugAvail.ar === false && (
                        <AlertCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-500" />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-2.5 rounded-xl shrink-0"
                      onClick={() => genSlug("ar")}
                    >
                      <Sparkles className="w-3 h-3" />
                    </Button>
                  </div>
                  {slugAvail.ar === false && (
                    <p className="text-[10px] text-red-500 mt-0.5">
                      Slug already in use
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Excerpt EN</label>
                  <Textarea
                    value={form.excerptEn}
                    onChange={setField("excerptEn")}
                    rows={2}
                    className={textareaCls}
                    placeholder="Short summary…"
                  />
                </div>
                <div>
                  <label className={labelCls}>ملخص AR</label>
                  <Textarea
                    value={form.excerptAr}
                    onChange={setField("excerptAr")}
                    rows={2}
                    dir="rtl"
                    className={textareaCls}
                    placeholder="ملخص قصير…"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Status</label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, status: v as PostStatus }))
                    }
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Publish Date / Schedule</label>
                  <Input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={setField("publishedAt")}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <Select
                    value={form.categoryId || "__none__"}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        categoryId: v === "__none__" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Tags</label>
                  <MultiTagSelect
                    value={form.tagIds}
                    onChange={(ids) => setForm((p) => ({ ...p, tagIds: ids }))}
                    options={tags}
                    placeholder="Select tags…"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content tab */}
          {tab === "content" && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Content EN *{" "}
                  <span className="text-muted-foreground/60 normal-case font-normal">
                    (HTML / rich text)
                  </span>
                </label>
                <Textarea
                  value={form.contentEn}
                  onChange={setField("contentEn")}
                  rows={14}
                  className={cn(
                    textareaCls,
                    "font-mono text-xs leading-relaxed",
                    errors.contentEn && "border-red-400",
                  )}
                  placeholder="<h2>Introduction</h2><p>Your content here…</p>"
                />
                {errors.contentEn && (
                  <p className="text-[10px] text-red-500 mt-0.5">
                    {errors.contentEn}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>
                  المحتوى AR{" "}
                  <span className="text-muted-foreground/60 normal-case font-normal">
                    (اختياري)
                  </span>
                </label>
                <Textarea
                  value={form.contentAr}
                  onChange={setField("contentAr")}
                  rows={10}
                  dir="rtl"
                  className={cn(
                    textareaCls,
                    "font-mono text-xs leading-relaxed",
                  )}
                  placeholder="<h2>مقدمة</h2><p>المحتوى هنا…</p>"
                />
              </div>
            </div>
          )}

          {/* Media tab */}
          {tab === "media" && isEdit && editPost && (
            <div key={editPost.id} className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Images
                </h3>
                <ImageManager
                  postId={editPost.id}
                  images={editPost.images}
                  onChanged={onDone}
                />
              </div>
              <div className="border-t pt-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Videos
                </h3>
                <VideoManager
                  postId={editPost.id}
                  videos={editPost.videos}
                  onChanged={onDone}
                />
              </div>
            </div>
          )}
          {tab === "media" && !isEdit && (
            <div className="text-center py-12">
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Save the post first
              </p>
              <p className="text-xs text-muted-foreground/60">
                Images and videos can be added after the post is created.
              </p>
              <Button
                size="sm"
                className="mt-4 bg-[#7b57fc] text-white border-0"
                onClick={() => setTab("basic")}
              >
                Go to Basic tab
              </Button>
            </div>
          )}

          {/* SEO tab */}
          {tab === "seo" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={handleAutoSeo}
                  disabled={!isEdit}
                >
                  <Sparkles className="w-3 h-3" /> Auto-fill from content
                </Button>
              </div>
              {!isEdit && (
                <p className="text-[11px] text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
                  Auto-fill is available after the post is saved.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Meta Title EN ({form.metaTitleEn.length}/60)
                  </label>
                  <Input
                    value={form.metaTitleEn}
                    onChange={setField("metaTitleEn")}
                    maxLength={60}
                    className={cn(
                      inputCls,
                      form.metaTitleEn.length > 55 && "border-amber-400",
                    )}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Meta Title AR ({form.metaTitleAr.length}/60)
                  </label>
                  <Input
                    value={form.metaTitleAr}
                    onChange={setField("metaTitleAr")}
                    maxLength={60}
                    dir="rtl"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Meta Description EN ({form.metaDescriptionEn.length}/160)
                  </label>
                  <Textarea
                    value={form.metaDescriptionEn}
                    onChange={setField("metaDescriptionEn")}
                    rows={2}
                    maxLength={160}
                    className={cn(
                      textareaCls,
                      form.metaDescriptionEn.length > 150 && "border-amber-400",
                    )}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Meta Description AR ({form.metaDescriptionAr.length}/160)
                  </label>
                  <Textarea
                    value={form.metaDescriptionAr}
                    onChange={setField("metaDescriptionAr")}
                    rows={2}
                    dir="rtl"
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>OG Image URL</label>
                  <Input
                    value={form.ogImageUrl}
                    onChange={setField("ogImageUrl")}
                    className={inputCls}
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className={labelCls}>Twitter Card</label>
                  <Select
                    value={form.twitterCard}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, twitterCard: v }))
                    }
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary_large_image">
                        Summary Large Image
                      </SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-full">
                  <label className={labelCls}>Canonical URL</label>
                  <Input
                    value={form.canonicalUrl}
                    onChange={setField("canonicalUrl")}
                    className={inputCls}
                    placeholder="https://yoursite.com/blog/..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t flex items-center justify-between gap-3 bg-card/95 backdrop-blur-sm">
          <div className="flex gap-1">
            {(["basic", "content", "seo"] as const).map((t) => (
              <Button
                variant={"ghost"}
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  tab === t
                    ? "bg-[#7b57fc] w-5"
                    : "bg-muted-foreground/30 w-2.5",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={isPending}
              className="bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 min-w-24"
              onClick={handleSubmit}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create post"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST CARD
// ─────────────────────────────────────────────────────────────────────────────

function PostCard({
  post,
  selected,
  onSelect,
  onEdit,
  onManageMedia,
  onDone,
}: {
  post: SerializedPost;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onManageMedia: (post: SerializedPost) => void;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const primaryImg = post.images.find((i) => i.isPrimary) ?? post.images[0];

  const act = (
    fn: () => Promise<any>,
    successMsg: string,
    onSuccess?: () => void,
  ) =>
    start(async () => {
      const r = await fn();
      if (r.success) {
        toast.success(successMsg);
        onDone();
        onSuccess?.();
      } else toast.error(r.error);
    });

  const handleOpenMedia = async () => {
    const full = await getPostById(post.id);
    if (full.success) {
      onManageMedia(full.data as SerializedPost);
    } else {
      toast.error("Could not load full post data");
    }
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
          : "border-border/50 hover:border-[#7b57fc]/30 hover:shadow-md",
        post.isDeleted && "opacity-60",
      )}
    >
      {/* Checkbox */}
      <div className="absolute top-2.5 left-2.5 z-10">
        <Input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded accent-[#7b57fc] cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
          style={{ opacity: selected ? 1 : undefined }}
        />
      </div>

      {/* Cover image */}
      <div className="relative h-44 bg-linear-to-br from-muted/30 to-muted/60 overflow-hidden">
        {primaryImg ? (
          <img
            src={primaryImg.url}
            alt={primaryImg.altText ?? post.titleEn}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-muted-foreground/10" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <StatusBadge status={post.status} isDeleted={post.isDeleted} />
        </div>
        {/* Media count badges */}
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          {post._count.images > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-color bg-white backdrop-blur-sm px-1.5 py-0.5 rounded-full">
              <ImageIcon className="w-2.5 h-2.5" /> {post._count.images}
            </span>
          )}
          {post._count.videos > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-color bg-white  backdrop-blur-sm px-1.5 py-0.5 rounded-full">
              <Video className="w-2.5 h-2.5" /> {post._count.videos}
            </span>
          )}
          {post._count.reactions > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-color bg-white  backdrop-blur-sm px-1.5 py-0.5 rounded-full">
              <Heart className="w-2.5 h-2.5" /> {post._count.reactions}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold line-clamp-2 leading-snug">
              {post.titleEn}
            </h3>
            {post.titleAr && (
              <p
                className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5"
                dir="rtl"
              >
                {post.titleAr}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg -mt-0.5 shrink-0"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenMedia}>
                <ImageIcon className="w-3.5 h-3.5 mr-2" /> Manage media
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  act(() => duplicatePost(post.id), "Duplicated as draft")
                }
              >
                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {post.status === "DRAFT" && (
                <DropdownMenuItem
                  onClick={() => act(() => publishPost(post.id), "Published!")}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-2 text-emerald-500" />{" "}
                  Publish
                </DropdownMenuItem>
              )}
              {post.status === "PUBLISHED" && (
                <DropdownMenuItem
                  onClick={() =>
                    act(() => unpublishPost(post.id), "Unpublished")
                  }
                >
                  <Eye className="w-3.5 h-3.5 mr-2" /> Unpublish
                </DropdownMenuItem>
              )}
              {post.status !== "ARCHIVED" && !post.isDeleted && (
                <DropdownMenuItem
                  onClick={() => act(() => archivePost(post.id), "Archived")}
                >
                  <Archive className="w-3.5 h-3.5 mr-2 text-amber-500" />{" "}
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={cn(
                  post.isDeleted
                    ? "text-emerald-500 focus:text-emerald-500"
                    : "text-red-500 focus:text-red-500",
                )}
                onClick={() => setShowConfirm(true)}
              >
                {post.isDeleted ? (
                  <>
                    <Undo2 className="w-3.5 h-3.5 mr-2" /> Restore
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {post.excerptEn && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerptEn}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-1.5 border-t border-border/30">
          {post.category && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <FolderTree className="w-3 h-3" /> {post.category.nameEn}
            </span>
          )}
          {post.tags.length > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3" />{" "}
              {post.tags
                .slice(0, 2)
                .map((t) => t.tag.nameEn)
                .join(", ")}
              {post.tags.length > 2 && ` +${post.tags.length - 2}`}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2 ">
            <CommentManager
              postId={post.id}
              commentCount={post._count.comments}
              onChanged={onDone}
            />
            <ReactionSummary postId={post.id} />
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <RelativeTime date={post.createdAt} />
        </p>
      </div>

      {/* Delete confirm overlay */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-card/96 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-4 z-20"
          >
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm font-semibold text-center">
              {post.isDeleted ? "Restore this post?" : "Delete this post?"}
            </p>
            {!post.isDeleted && (
              <p className="text-xs text-muted-foreground text-center">
                It can be restored later.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                className={cn(
                  "h-8 px-4 rounded-xl text-white border-0",
                  post.isDeleted
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600",
                )}
                disabled={isPending}
                onClick={() =>
                  act(
                    () =>
                      post.isDeleted
                        ? restorePost(post.id)
                        : softDeletePost(post.id),
                    post.isDeleted ? "Restored" : "Deleted",
                    () => setShowConfirm(false),
                  )
                }
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : post.isDeleted ? (
                  "Restore"
                ) : (
                  "Delete"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 rounded-xl"
                onClick={() => setShowConfirm(false)}
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

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  categories,
  onApply,
  isPending,
  selectedCount,
  onBulkAction,
}: {
  filters: {
    status?: string;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  categories: { id: string; nameEn: string }[];
  onApply: (patch: Record<string, string | undefined>) => void;
  isPending: boolean;
  selectedCount: number;
  onBulkAction: (action: BulkPostAction) => void;
}) {
  const [searchVal, setSearchVal] = useState(filters.search ?? "");
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (v: string) => {
    setSearchVal(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(
      () => onApply({ search: v || undefined, page: "1" }),
      380,
    );
  };

  const activeCount = [
    filters.status && filters.status !== "all" ? 1 : 0,
    filters.categoryId ? 1 : 0,
    filters.search ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const BULK: { action: BulkPostAction; label: string; cls?: string }[] = [
    { action: "publish", label: "Publish all" },
    { action: "unpublish", label: "Unpublish all" },
    { action: "archive", label: "Archive all" },
    { action: "restore", label: "Restore all" },
    {
      action: "delete",
      label: "Delete all",
      cls: "text-red-500 focus:text-red-500",
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {/* Bulk action */}
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
                  Actions <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {BULK.map(({ action, label, cls }) => (
                  <DropdownMenuItem
                    key={action}
                    onClick={() => onBulkAction(action)}
                    className={cn("text-xs", cls)}
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
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          )}
          <Input
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search title, excerpt…"
            className="pl-9 h-9 rounded-xl text-sm border-border/60"
          />
          {searchVal && (
            <Button
              variant={"ghost"}
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Status filter */}
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
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        {categories.length > 0 && (
          <Select
            value={filters.categoryId ?? "__all__"}
            onValueChange={(v) =>
              onApply({ category: v === "__all__" ? undefined : v, page: "1" })
            }
          >
            <SelectTrigger
              className={cn(
                "h-9 rounded-xl border-border/60 text-xs w-36",
                filters.categoryId &&
                  "border-[#7b57fc]/50 text-[#7b57fc] bg-[#7b57fc]/5",
              )}
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nameEn}
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
          <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt_desc">Newest first</SelectItem>
            <SelectItem value="createdAt_asc">Oldest first</SelectItem>
            <SelectItem value="publishedAt_desc">Publish date ↓</SelectItem>
            <SelectItem value="publishedAt_asc">Publish date ↑</SelectItem>
            <SelectItem value="titleEn_asc">Title A–Z</SelectItem>
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearchVal("");
              onApply({
                status: undefined,
                category: undefined,
                search: undefined,
                page: "1",
              });
            }}
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.status && filters.status !== "all" && (
            <FilterChip
              label={`Status: ${filters.status}`}
              onRemove={() => onApply({ status: undefined, page: "1" })}
            />
          )}
          {filters.categoryId && (
            <FilterChip
              label={`Category: ${categories.find((c) => c.id === filters.categoryId)?.nameEn ?? filters.categoryId}`}
              onRemove={() => onApply({ category: undefined, page: "1" })}
            />
          )}
          {filters.search && (
            <FilterChip
              label={`"${filters.search}"`}
              onRemove={() => {
                setSearchVal("");
                onApply({ search: undefined, page: "1" });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
      {label}
      <Button
        variant={"ghost"}
        onClick={onRemove}
        className="hover:text-[#5a3fcc]"
      >
        <X className="w-2.5 h-2.5" />
      </Button>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA DIALOG (standalone image + video manager for a post)
// ─────────────────────────────────────────────────────────────────────────────

function MediaDialog({
  open,
  post,
  onClose,
  onDone,
}: {
  open: boolean;
  post: SerializedPost | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [currentImages, setCurrentImages] = useState<PostImage[]>(
    post?.images ?? [],
  );
  const [currentVideos, setCurrentVideos] = useState<PostVideo[]>(
    post?.videos ?? [],
  );

  useEffect(() => {
    if (post) {
      setCurrentImages(post.images);
      setCurrentVideos(post.videos);
    }
  }, [post?.id]);

  const refreshMedia = async () => {
    if (!post) return;
    const r = await getPostById(post.id);
    if (r.success) {
      setCurrentImages((r.data as any).images ?? []);
      setCurrentVideos((r.data as any).videos ?? []);
    }
    onDone();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "w-full max-w-none! sm:max-w-4xl! rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col max-h-[90vh] p-0 gap-0",
          "[&>button:last-child]:hidden", // hide default close button
        )}
      >
        <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
          <DialogTitle className="text-sm font-bold truncate">
            Media — {post?.titleEn}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content – hides scrollbar */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none p-5 space-y-6">
          {post && (
            <>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Images
                </h3>
                <ImageManager
                  postId={post.id}
                  images={currentImages}
                  onChanged={refreshMedia}
                />
              </div>
              <div className="border-t pt-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Videos
                </h3>
                <VideoManager
                  postId={post.id}
                  videos={currentVideos}
                  onChanged={refreshMedia}
                />
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 p-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  initialPosts: SerializedPost[];
  pagination: { page: number; limit: number; total: number; pages: number };
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    deleted: number;
    totalComments: number;
    totalReactions: number;
  } | null;
  categories: PostCategory[];
  tags: TagData[];
  filters: {
    page: number;
    limit: number;
    status?: string;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function BlogPageClient({
  initialPosts,
  pagination,
  stats,
  categories,
  tags,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, start] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editPost, setEditPost] = useState<SerializedPost | null>(null);
  const [mediaPost, setMediaPost] = useState<SerializedPost | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  // ── URL-based navigation ───────────────────────────────────────────────────
  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const params = new URLSearchParams();
        const current: Record<string, string | undefined> = {
          page: String(filters.page),
          status: filters.status,
          category: filters.categoryId, // internal key → URL key
          search: filters.search,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        };
        const merged = { ...current, ...patch };
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== "" && !(k === "page" && v === "1"))
            params.set(k, v);
        });
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [filters, router, pathname],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? initialPosts.map((p) => p.id) : []);
  const allSelected =
    initialPosts.length > 0 &&
    initialPosts.every((p) => selectedIds.includes(p.id));

  // ── Bulk action ────────────────────────────────────────────────────────────
  const handleBulk = (action: BulkPostAction) => {
    if (!selectedIds.length) return;
    start(async () => {
      const r = await bulkPostAction(selectedIds, action);
      if (r.success) {
        toast.success(`${r.data.count} post(s) — ${action}`);
        setSelectedIds([]);
        refresh();
      } else toast.error(r.error);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      {stats && <StatsStrip stats={stats} />}

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between gap-2 items-center">
        <div className="flex gap-2">
          <CategoryManager categories={categories} onChanged={refresh} />
          <TagManager tags={tags} onChanged={refresh} />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 rounded-xl gap-1.5 text-xs"
          onClick={refresh}
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", isPending && "animate-spin")}
          />{" "}
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        categories={categories}
        onApply={applyFilters}
        isPending={isPending}
        selectedCount={selectedIds.length}
        onBulkAction={handleBulk}
      />

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleAll(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-[#7b57fc]"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </label>
          <p className="text-xs text-muted-foreground">
            {pagination.total.toLocaleString()} post
            {pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 px-4 rounded-xl gap-1.5 text-xs bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
          onClick={() => {
            setEditPost(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5" /> New Post
        </Button>
      </div>

      {/* Post grid */}
      {initialPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl border border-dashed border-border/60 bg-card/50"
        >
          <FileText className="w-12 h-12 text-muted-foreground/20" />
          <div className="text-center">
            <p className="text-sm font-semibold mb-1">No posts found</p>
            <p className="text-xs text-muted-foreground">
              {filters.search ||
              (filters.status && filters.status !== "all") ||
              filters.categoryId
                ? "Try adjusting your filters"
                : "Create your first blog post to get started"}
            </p>
          </div>
          <Button
            className="bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0"
            onClick={() => {
              setEditPost(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Create first post
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {initialPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                selected={selectedIds.includes(post.id)}
                onSelect={() => toggleSelect(post.id)}
                onEdit={async () => {
                  const full = await getPostById(post.id);
                  if (full.success) {
                    setEditPost(full.data as SerializedPost);
                    setFormOpen(true);
                  } else {
                    toast.error("Failed to load full post data");
                  }
                }}
                onManageMedia={(p) => {
                  setMediaPost(p);
                  setMediaOpen(true);
                }}
                onDone={refresh}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPage={(p) => applyFilters({ page: String(p) })}
      />

      {/* Post form dialog */}
      <PostFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onDone={refresh}
        editPost={editPost}
        categories={categories}
        tags={tags}
      />

      {/* Standalone media dialog */}
      <MediaDialog
        open={mediaOpen}
        post={mediaPost}
        onClose={() => setMediaOpen(false)}
        onDone={refresh}
      />
    </div>
  );
}
