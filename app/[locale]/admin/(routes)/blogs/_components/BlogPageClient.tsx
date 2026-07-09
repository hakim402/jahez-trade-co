"use client";

// app/[locale]/admin/(routes)/blogs/_components/BlogPageClient.tsx

import {
  useState,
  useTransition,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ChangeEvent,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
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
  MonitorPlay,
  Code,
  ToggleLeft,
  ToggleRight,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Clock,
  TrendingUp,
  Activity,
  Layers,
  Settings2,
  Filter,
  ChevronUp,
  ExternalLink,
  Download,
  BarChart3,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@prisma/client";
import type {
  CreatePostInput,
  BulkPostAction,
  CreateCategoryInput,
  CreateTagInput,
  UpsertAdInput,
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
  getAllComments,
  moderateDeleteComment,
  restoreComment,
  hardDeleteComment,
  getPostReactionSummary,
  deletePostReaction,
  autoFillSeoFields,
  checkSlugAvailability,
  generateUniqueSlug,
  addPostVideo,
  deletePostVideo,
  reorderPostVideos,
  getAllAds,
  upsertAd,
  toggleAdActive,
  deleteAd,
  adminPostComment,
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
  tag: { id: string; slug: string; nameEn: string; nameAr: string | null };
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
type AdData = {
  id: string;
  placement: string;
  adCodeEn: string | null;
  adCodeAr: string | null;
  adType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SerializedPost = {
  id: string;
  titleEn: string;
  titleAr: string | null;
  slugEn: string;
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
  reactions?: any[];
  _count?: { replies: number; reactions: number };
};

type FilterParams = {
  page: number;
  limit: number;
  status?: string;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function parseDateSafe(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function toEmbedUrl(raw: string): string {
  const s = raw.trim();
  const ytWatch = s.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;
  const ytShort = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;
  const ytShorts = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}`;
  const vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return s;
}

function getYouTubeThumb(url: string): string | null {
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`;
  }
  return null;
}

function getInitials(name: string | null, email: string): string {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  return email[0].toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useKeyboardShortcuts(actions: {
  onNewPost: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        actions.onNewPost();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k" &&
        actions.onSearch
      ) {
        e.preventDefault();
        actions.onSearch();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "r" &&
        actions.onRefresh
      ) {
        e.preventDefault();
        actions.onRefresh();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [actions]);
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = "#7b57fc";
const ACCENT_HOVER = "#6a48eb";
const ACCENT_BG = "bg-[#7b57fc]/8";
const ACCENT_BORDER = "border-[#7b57fc]/20";
const ACCENT_TEXT = "text-[#7b57fc]";
const BTN_PRIMARY = `bg-[#7b57fc] hover:bg-[#6a48eb] text-white border-0 shadow-md shadow-[#7b57fc]/20`;
const INPUT_CLS =
  "h-9 rounded-xl border-border/60 bg-muted/30 text-sm focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
const TEXTAREA_CLS =
  "rounded-xl border-border/60 bg-muted/30 text-sm resize-none focus-visible:ring-[#7b57fc]/20 focus-visible:border-[#7b57fc]/50";
const LABEL_CLS =
  "block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5";

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
  const ref = useRef<HTMLTimeElement>(null);
  useEffect(() => {
    const update = () =>
      setText(formatDistanceToNow(new Date(date), { addSuffix: true }));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date]);
  return (
    <time
      ref={ref}
      dateTime={date}
      className={className}
      suppressHydrationWarning
      title={format(new Date(date), "PPp")}
    >
      {text}
    </time>
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
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Deleted
      </span>
    );
  const v: Record<PostStatus, { label: string; dot: string; cls: string }> = {
    DRAFT: {
      label: "Draft",
      dot: "bg-muted-foreground",
      cls: "bg-muted/50 text-muted-foreground border-border/40",
    },
    PUBLISHED: {
      label: "Published",
      dot: "bg-emerald-500",
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    ARCHIVED: {
      label: "Archived",
      dot: "bg-amber-500",
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
  };
  const { label, dot, cls } = v[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} /> {label}
    </span>
  );
}

function Avatar({
  name,
  email,
  size = "sm",
}: {
  name: string | null;
  email: string;
  size?: "sm" | "md";
}) {
  const initials = getInitials(name, email);
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${sz} rounded-full bg-linear-to-br from-[#7b57fc] to-[#2b1cff] flex items-center justify-center font-bold text-white shrink-0`}
    >
      {initials}
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
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1))
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
        </span>{" "}
        posts
      </p>
      <nav
        aria-label="Pagination"
        className="flex items-center gap-1 order-1 sm:order-2"
      >
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-border/60"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
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
                n === page ? `${BTN_PRIMARY}` : "border-border/60",
              )}
              onClick={() => onPage(n as number)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
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
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </nav>
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
      sub: `${stats.archived} archived`,
    },
    {
      label: "Published",
      value: stats.published,
      icon: Globe,
      grad: "from-emerald-400 to-teal-600",
      sub: `${Math.round((stats.published / Math.max(stats.total, 1)) * 100)}% of total`,
    },
    {
      label: "Drafts",
      value: stats.draft,
      icon: Edit3,
      grad: "from-amber-400 to-orange-500",
      sub: `${stats.deleted} deleted`,
    },
    {
      label: "Engagement",
      value: stats.totalComments + stats.totalReactions,
      icon: Activity,
      grad: "from-sky-400 to-blue-600",
      sub: `${stats.totalComments} comments · ${stats.totalReactions} reactions`,
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, grad, sub }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.07,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5 hover:border-border/80 transition-colors"
        >
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-linear-to-br ${grad} opacity-[0.02]`}
          />
          <div
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${grad} shadow-lg`}
          >
            <Icon size={18} className="text-white" />
          </div>
          <div className="relative min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {value.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground/60 truncate">
              {sub}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-pulse">
      <div className="h-44 bg-muted/40" />
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="h-4 w-4/5 bg-muted/40 rounded" />
          <div className="h-3 w-2/5 bg-muted/30 rounded" />
        </div>
        <div className="h-3 w-full bg-muted/30 rounded" />
        <div className="h-3 w-3/4 bg-muted/30 rounded" />
        <div className="flex gap-1.5 pt-0.5">
          <div className="h-5 w-16 bg-muted/40 rounded-full" />
          <div className="h-5 w-12 bg-muted/40 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border/30">
          <div className="h-3 w-20 bg-muted/30 rounded" />
          <div className="h-7 w-7 bg-muted/40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-TAG SELECT
// ─────────────────────────────────────────────────────────────────────────────

function MultiTagSelect({
  value,
  onChange,
  options,
  placeholder = "Select tags…",
  id,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  options: TagData[];
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        id={id}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
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
                  className="cursor-pointer hover:text-[#5a3fcc] ml-0.5"
                  aria-label={`Remove ${tag.nameEn}`}
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
            role="listbox"
            aria-multiselectable="true"
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-xl"
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
                    role="option"
                    aria-selected={isSelected}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                        isSelected
                          ? "bg-[#7b57fc] border-[#7b57fc]"
                          : "border-border/60",
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
                      <span className="text-[10px] text-muted-foreground/50">
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
// MEDIA PREVIEW DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function MediaPreviewDialog({
  open,
  onClose,
  media,
  type,
}: {
  open: boolean;
  onClose: () => void;
  media: { url: string; altText?: string | null } | null;
  type: "image" | "video";
}) {
  if (!media) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl bg-black/90 border-border/20">
        <VisuallyHidden>
          <DialogTitle>
            {type === "image" ? "Image preview" : "Video preview"}
          </DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </Button>
          {type === "image" ? (
            <img
              src={media.url}
              alt={media.altText || "Preview"}
              className="max-h-[85vh] w-auto mx-auto object-contain"
              loading="lazy"
            />
          ) : (
            <div className="aspect-video">
              <iframe
                src={media.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video preview"
                loading="lazy"
              />
            </div>
          )}
          {media.altText && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm p-3">
              {media.altText}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  const [uploadProgress, setUploadProgress] = useState(0);
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
  const [previewImage, setPreviewImage] = useState<PostImage | null>(null);

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const ALLOWED = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);

  const processFiles = async (files: FileList) => {
    const list = Array.from(files);
    for (const f of list) {
      if (!ALLOWED.has(f.type)) {
        toast.error(`${f.name}: Only JPEG/PNG/WebP/GIF allowed`);
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
        setUploadErr(r.error || "Upload failed");
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
    } else toast.error(r.error || "Failed to add image");
  };

  const handleDelete = async (img: PostImage) => {
    setDeletingId(img.id);
    const r = await deletePostImage(postId, img.id);
    setDeletingId(null);
    if (r.success) {
      setLocalImages((p) => p.filter((i) => i.id !== img.id));
      toast.success("Deleted");
      onChanged();
    } else toast.error(r.error || "Delete failed");
  };

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
    } else toast.error(r.error || "Failed");
  };

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
    else toast.error(r.error || "Reorder failed");
  };

  const saveAlt = async () => {
    if (!editAlt) return;
    setSavingAlt(true);
    const r = await updatePostImageAltText(editAlt.id, editAlt.val);
    setSavingAlt(false);
    if (r.success) {
      toast.success("Alt text saved");
      setEditAlt(null);
      onChanged();
    } else toast.error(r.error || "Save failed");
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
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
      >
        <input
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
          <div className="space-y-2" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 mx-auto text-[#7b57fc] animate-spin" />
            <p className="text-sm text-muted-foreground">
              Uploading… {uploadProgress > 0 && `${uploadProgress}%`}
            </p>
            {uploadProgress > 0 && (
              <div className="w-48 mx-auto h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full bg-[#7b57fc] rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Drop images or{" "}
              <span className="text-[#7b57fc] underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              JPEG · PNG · WebP · GIF — max 10 MB each
            </p>
          </div>
        )}
      </div>
      {uploadErr && (
        <p
          className="text-xs text-red-500 flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5" /> {uploadErr}
        </p>
      )}

      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
            placeholder="Or paste an image URL…"
            className="pl-9 h-9 rounded-xl border-border/60 bg-muted/30 text-sm"
            aria-label="Image URL"
          />
          {urlInput && (
            <button
              onClick={() => setUrlInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
          )}{" "}
          Add
        </Button>
      </div>

      {/* Image grid */}
      {localImages.length > 0 ? (
        <div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
          role="list"
        >
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
              role="listitem"
            >
              <img
                src={img.url}
                alt={img.altText ?? "Post image"}
                className="w-full h-full object-cover pointer-events-none"
                onClick={() => setPreviewImage(img)}
                loading="lazy"
              />
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#7b57fc] text-white shadow-md">
                  <Star className="w-2 h-2 fill-white" /> Primary
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent pt-6 pb-1.5 px-1.5 flex items-end gap-1">
                {!img.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    disabled={settingPrimary === img.id}
                    className="flex-1 h-6 flex items-center justify-center gap-0.5 rounded-lg bg-[#7b57fc]/80 hover:bg-[#7b57fc] text-white text-[9px] font-bold disabled:opacity-50"
                    aria-label="Set as primary"
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
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white"
                  aria-label="Edit alt text"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deletingId === img.id}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-500 text-white disabled:opacity-50"
                  aria-label="Delete"
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
      <AnimatePresence>
        {editAlt && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex gap-2 items-center p-3 rounded-xl bg-muted/20 border border-border/40"
            role="dialog"
            aria-label="Edit alt text"
          >
            <Input
              value={editAlt.val}
              onChange={(e) => setEditAlt({ ...editAlt, val: e.target.value })}
              placeholder="Describe this image for accessibility…"
              className="h-8 rounded-xl border-border/60 bg-background text-sm flex-1"
              autoFocus
              aria-label="Alt text"
            />
            <Button
              size="sm"
              className={`h-8 rounded-xl ${BTN_PRIMARY} shrink-0`}
              onClick={saveAlt}
              disabled={savingAlt}
            >
              {savingAlt ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl shrink-0"
              onClick={() => setEditAlt(null)}
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <MediaPreviewDialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        media={previewImage}
        type="image"
      />
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
  const [previewVideo, setPreviewVideo] = useState<PostVideo | null>(null);

  useEffect(() => {
    setLocalVideos(videos);
  }, [videos]);

  const handleAdd = async () => {
    const raw = url.trim();
    if (!raw) return;
    try {
      new URL(raw);
    } catch {
      setUrlErr("Please enter a valid URL");
      return;
    }
    setUrlErr(null);
    setIsAdding(true);
    const r = await addPostVideo(postId, { url: toEmbedUrl(raw) });
    setIsAdding(false);
    if (r.success) {
      toast.success("Video added");
      setUrl("");
      onChanged();
    } else toast.error(r.error || "Failed to add video");
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const r = await deletePostVideo(postId, id);
    setDeletingId(null);
    if (r.success) {
      setLocalVideos((p) => p.filter((v) => v.id !== id));
      onChanged();
      toast.success("Video removed");
    } else toast.error(r.error || "Failed");
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
    else toast.error(r.error || "Reorder failed");
  };

  const isYouTube = /(?:youtube\.com|youtu\.be)/.test(url);
  const isVimeo = /vimeo\.com/.test(url);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlErr(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="YouTube, Vimeo, or embed URL…"
              className="pl-9 h-9 rounded-xl border-border/60 bg-muted/30 text-sm"
              aria-label="Video URL"
            />
          </div>
          <Button
            size="sm"
            className={`h-9 rounded-xl gap-1.5 ${BTN_PRIMARY}`}
            onClick={handleAdd}
            disabled={isAdding || !url.trim()}
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}{" "}
            Add
          </Button>
        </div>
        {(isYouTube || isVimeo) && (
          <p className="text-[10px] text-[#7b57fc] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {isYouTube
              ? "YouTube detected — auto-converting to embed"
              : "Vimeo detected — auto-converting to embed"}
          </p>
        )}
        {urlErr && (
          <p
            className="text-[10px] text-red-500 flex items-center gap-1"
            role="alert"
          >
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
        <div className="space-y-2" role="list">
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
                  draggingIdx === idx && "opacity-50",
                )}
                role="listitem"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                {thumb ? (
                  <div
                    className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                    onClick={() => setPreviewVideo(video)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setPreviewVideo(video);
                    }}
                    aria-label="Preview video"
                  >
                    <img
                      src={thumb}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
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
                  aria-label="Delete video"
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
      <MediaPreviewDialog
        open={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        media={previewVideo}
        type="video"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADS MANAGER
// ─────────────────────────────────────────────────────────────────────────────

function AdsManager({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [ads, setAds] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAd, setEditingAd] = useState<AdData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, start] = useTransition();
  const [form, setForm] = useState<UpsertAdInput>({
    placement: "",
    adCodeEn: "",
    adCodeAr: "",
    adType: "display",
    isActive: true,
  });

  const loadAds = useCallback(async () => {
    setLoading(true);
    const r = await getAllAds();
    if (r.success) setAds(r.data || []);
    else toast.error(r.error || "Failed to load ads");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) loadAds();
  }, [open, loadAds]);

  const resetForm = () => {
    setForm({
      placement: "",
      adCodeEn: "",
      adCodeAr: "",
      adType: "display",
      isActive: true,
    });
    setEditingAd(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.placement?.trim()) {
      toast.error("Placement identifier is required");
      return;
    }
    start(async () => {
      const r = await upsertAd({
        placement: form.placement!.trim(),
        adCodeEn: form.adCodeEn?.trim() || undefined,
        adCodeAr: form.adCodeAr?.trim() || undefined,
        adType: form.adType,
        isActive: form.isActive,
      });
      if (r.success) {
        toast.success(editingAd ? "Ad updated" : "Ad created");
        resetForm();
        loadAds();
        onChanged();
      } else toast.error(r.error || "Failed to save ad");
    });
  };

  const handleToggle = async (id: string) => {
    const r = await toggleAdActive(id);
    if (r.success) {
      toast.success(`Ad ${r.data.isActive ? "activated" : "deactivated"}`);
      loadAds();
      onChanged();
    } else toast.error(r.error || "Failed");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad placement?")) return;
    const r = await deleteAd(id);
    if (r.success) {
      toast.success("Ad deleted");
      loadAds();
      onChanged();
    } else toast.error(r.error || "Failed");
  };

  const openEdit = (ad: AdData) => {
    setEditingAd(ad);
    setForm({
      placement: ad.placement,
      adCodeEn: ad.adCodeEn || "",
      adCodeAr: ad.adCodeAr || "",
      adType: ad.adType || "display",
      isActive: ad.isActive,
    });
    setShowForm(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 rounded-xl gap-1.5 text-xs"
        onClick={() => setOpen(true)}
        aria-label="Manage Google Ads"
      >
        <MonitorPlay className="w-3.5 h-3.5" /> Ads
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            resetForm();
            setOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-5 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <div className="w-6 h-6 rounded-lg bg-[#7b57fc]/10 flex items-center justify-center">
                <MonitorPlay className="w-3.5 h-3.5 text-[#7b57fc]" />
              </div>
              Google Ads Management
            </DialogTitle>
            <DialogDescription>
              Configure ad placements with English and Arabic support.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Form panel */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b bg-muted/20 overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {editingAd ? "Edit Ad" : "New Ad Placement"}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={resetForm}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div>
                      <Label className={LABEL_CLS} htmlFor="ad-placement">
                        Placement ID *
                      </Label>
                      <Input
                        id="ad-placement"
                        value={form.placement}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, placement: e.target.value }))
                        }
                        placeholder="e.g., header-banner, sidebar-300x250"
                        className={INPUT_CLS}
                        disabled={!!editingAd}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className={LABEL_CLS} htmlFor="ad-code-en">
                          Ad Code (EN)
                        </Label>
                        <Textarea
                          id="ad-code-en"
                          value={form.adCodeEn}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, adCodeEn: e.target.value }))
                          }
                          rows={4}
                          className={`${TEXTAREA_CLS} font-mono text-xs`}
                          placeholder="<script>/* AdSense code */</script>"
                        />
                      </div>
                      <div>
                        <Label className={LABEL_CLS} htmlFor="ad-code-ar">
                          Ad Code (AR)
                        </Label>
                        <Textarea
                          id="ad-code-ar"
                          value={form.adCodeAr}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, adCodeAr: e.target.value }))
                          }
                          rows={4}
                          dir="rtl"
                          className={`${TEXTAREA_CLS} font-mono text-xs`}
                          placeholder="<script>/* كود الإعلان */</script>"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={LABEL_CLS} htmlFor="ad-type">
                          Ad Type
                        </Label>
                        <Select
                          value={form.adType}
                          onValueChange={(v) =>
                            setForm((p) => ({ ...p, adType: v }))
                          }
                        >
                          <SelectTrigger id="ad-type" className={INPUT_CLS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="display">
                              Display Banner
                            </SelectItem>
                            <SelectItem value="in-article">
                              In-Article
                            </SelectItem>
                            <SelectItem value="anchor">
                              Anchor/Vignette
                            </SelectItem>
                            <SelectItem value="auto">Auto Ads</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                isActive: e.target.checked,
                              }))
                            }
                            className="accent-[#7b57fc] w-4 h-4 rounded"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className={BTN_PRIMARY}
                        onClick={handleSubmit}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : editingAd ? (
                          "Update Ad"
                        ) : (
                          "Create Ad"
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ads list */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {ads.length} placement{ads.length !== 1 ? "s" : ""}
                </p>
                {!showForm && (
                  <Button
                    size="sm"
                    className={`h-7 text-xs ${BTN_PRIMARY} gap-1`}
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-3 h-3" /> New Placement
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                </div>
              ) : ads.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-border/40">
                  <MonitorPlay className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No ad placements configured
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setShowForm(true)}
                  >
                    Add first placement
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/40 rounded-xl border border-border/50 overflow-hidden">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            ad.isActive
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/30",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-mono font-medium truncate">
                            {ad.placement}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {ad.adType || "display"}
                            </span>
                            {ad.adCodeEn && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                EN
                              </span>
                            )}
                            {ad.adCodeAr && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                AR
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium",
                            ad.isActive
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {ad.isActive ? "Active" : "Inactive"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggle(ad.id)}
                          title={ad.isActive ? "Deactivate" : "Activate"}
                        >
                          {ad.isActive ? (
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(ad)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
        toast.success(editing ? "Category updated" : "Category created");
        reset();
        setEditing(null);
        onChanged();
      } else toast.error(r.error || "Failed");
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Posts using it will become uncategorised.`))
      return;
    const r = await deleteCategory(id);
    if (r.success) {
      toast.success("Category deleted");
      onChanged();
    } else toast.error(r.error || "Failed");
  };

  const renderTree = (items: PostCategory[], depth = 0): React.ReactNode =>
    items.map((cat) => (
      <div key={cat.id} style={{ marginLeft: depth * 16 }}>
        <div className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/30 group">
          <div className="flex items-center gap-2 min-w-0">
            <FolderTree className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            <span className="text-sm font-medium truncate">{cat.nameEn}</span>
            {cat.nameAr && (
              <span className="text-xs text-muted-foreground" dir="rtl">
                / {cat.nameAr}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">
              ({cat.slug})
            </span>
            {cat._count && (
              <span className="text-[10px] text-muted-foreground/40 shrink-0">
                {cat._count.posts}p
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => openEdit(cat)}
              aria-label={`Edit ${cat.nameEn}`}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500"
              onClick={() => handleDelete(cat.id, cat.nameEn)}
              aria-label={`Delete ${cat.nameEn}`}
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
        onClick={() => {
          setEditing(null);
          reset();
          setOpen(true);
        }}
      >
        <FolderPlus className="w-3.5 h-3.5" /> Categories
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            reset();
            setEditing(null);
            setOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit: ${editing.nameEn}` : "Manage Categories"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={LABEL_CLS} htmlFor="cat-slug">
                  Slug *
                </Label>
                <Input
                  id="cat-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  className={`${INPUT_CLS} mt-1`}
                />
              </div>
              <div>
                <Label className={LABEL_CLS} htmlFor="cat-name-en">
                  Name EN *
                </Label>
                <Input
                  id="cat-name-en"
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameEn: e.target.value }))
                  }
                  className={`${INPUT_CLS} mt-1`}
                />
              </div>
              <div>
                <Label className={LABEL_CLS} htmlFor="cat-name-ar">
                  Name AR
                </Label>
                <Input
                  id="cat-name-ar"
                  value={form.nameAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameAr: e.target.value }))
                  }
                  dir="rtl"
                  className={`${INPUT_CLS} mt-1`}
                />
              </div>
              <div>
                <Label className={LABEL_CLS} htmlFor="cat-parent">
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
                  <SelectTrigger
                    id="cat-parent"
                    className={`${INPUT_CLS} mt-1`}
                  >
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
                <Label className={LABEL_CLS} htmlFor="cat-desc-en">
                  Description EN
                </Label>
                <Textarea
                  id="cat-desc-en"
                  value={form.descEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descEn: e.target.value }))
                  }
                  rows={2}
                  className={`${TEXTAREA_CLS} mt-1`}
                />
              </div>
              <div className="col-span-2">
                <Label className={LABEL_CLS} htmlFor="cat-desc-ar">
                  Description AR
                </Label>
                <Textarea
                  id="cat-desc-ar"
                  value={form.descAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descAr: e.target.value }))
                  }
                  rows={2}
                  dir="rtl"
                  className={`${TEXTAREA_CLS} mt-1`}
                />
              </div>
            </div>
            {categories.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Hierarchy
                </p>
                <div className="space-y-0.5">
                  {renderTree(categories.filter((c) => !c.parentId))}
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 p-4 border-t flex justify-end gap-2">
            {editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  reset();
                }}
              >
                Cancel edit
              </Button>
            )}
            <Button
              size="sm"
              className={BTN_PRIMARY}
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
  const [isMerging, setIsMerging] = useState(false);

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
        toast.success(editing ? "Tag updated" : "Tag created");
        reset();
        setEditing(null);
        onChanged();
      } else toast.error(r.error || "Failed");
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"? It will be removed from all posts.`))
      return;
    const r = await deleteTag(id);
    if (r.success) {
      toast.success("Tag deleted");
      onChanged();
    } else toast.error(r.error || "Failed");
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) {
      toast.error("Select two different tags");
      return;
    }
    const src = tags.find((t) => t.id === mergeSource);
    const tgt = tags.find((t) => t.id === mergeTarget);
    if (
      !confirm(
        `Merge "${src?.nameEn}" → "${tgt?.nameEn}"? Source tag will be deleted.`,
      )
    )
      return;
    setIsMerging(true);
    const r = await mergeTags(mergeSource, mergeTarget);
    setIsMerging(false);
    if (r.success) {
      toast.success(`Merged: ${r.data.movedCount} posts updated`);
      setMergeSource("");
      setMergeTarget("");
      onChanged();
    } else toast.error(r.error || "Failed");
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
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            reset();
            setEditing(null);
            setOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit: ${editing.nameEn}` : "Manage Tags"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={LABEL_CLS} htmlFor="tag-slug">
                  Slug *
                </Label>
                <Input
                  id="tag-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slug: e.target.value }))
                  }
                  className={`${INPUT_CLS} mt-1`}
                />
              </div>
              <div>
                <Label className={LABEL_CLS} htmlFor="tag-name-en">
                  Name EN *
                </Label>
                <Input
                  id="tag-name-en"
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameEn: e.target.value }))
                  }
                  className={`${INPUT_CLS} mt-1`}
                />
              </div>
              <div className="col-span-2">
                <Label className={LABEL_CLS} htmlFor="tag-name-ar">
                  Name AR
                </Label>
                <Input
                  id="tag-name-ar"
                  value={form.nameAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameAr: e.target.value }))
                  }
                  dir="rtl"
                  className={`${INPUT_CLS} mt-1`}
                />
              </div>
            </div>

            {tags.length > 0 && (
              <>
                <div className="border-t pt-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Existing Tags ({tags.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] text-[11px] border border-[#7b57fc]/20"
                      >
                        <span className="font-medium">{t.nameEn}</span>
                        {t._count && (
                          <span className="text-[#7b57fc]/50 text-[9px]">
                            ({t._count.posts})
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditing(t);
                            setForm({
                              slug: t.slug,
                              nameEn: t.nameEn,
                              nameAr: t.nameAr || "",
                            });
                          }}
                          className="hover:text-[#5a3fcc]"
                          aria-label={`Edit ${t.nameEn}`}
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.nameEn)}
                          className="text-red-400 hover:text-red-500"
                          aria-label={`Delete ${t.nameEn}`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Merge className="w-3 h-3" /> Merge Tags
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mb-2">
                    Source → deleted; its posts move to target.
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
                      disabled={isMerging}
                    >
                      {isMerging ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Merge"
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="shrink-0 p-4 border-t flex justify-end gap-2">
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
              className={BTN_PRIMARY}
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getPostComments({
      postId,
      page: 1,
      limit: 100,
      includeDeleted,
      topLevelOnly: false,
    });
    if (r.success) setComments(r.data.comments || []);
    else toast.error(r.error || "Failed to load comments");
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
    } else toast.error(r.error || "Failed");
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      toast.error("Reply content required");
      return;
    }
    setSubmittingReply(true);
    const r = await adminPostComment({
      postId,
      content: replyContent.trim(),
      parentId,
    });
    setSubmittingReply(false);
    if (r.success) {
      toast.success("Reply posted");
      setReplyingTo(null);
      setReplyContent("");
      load();
      onChanged();
    } else toast.error(r.error || "Failed to post reply");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label={`${commentCount} comments`}
      >
        <MessageSquare className="w-3 h-3" /> {commentCount}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#7b57fc]" /> Comment
              Moderation
            </DialogTitle>
          </DialogHeader>
          <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b bg-muted/20">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="accent-[#7b57fc]"
                aria-label="Show deleted"
              />
              Show deleted
            </label>
            {loading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {!loading && comments.length === 0 && (
              <div className="text-center py-10">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
              </div>
            )}
            {comments.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "p-3.5 rounded-xl border",
                  c.isDeleted
                    ? "bg-red-500/5 border-red-500/20"
                    : "border-border/50 bg-muted/10",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2.5">
                    <Avatar name={c.author.fullName} email={c.author.email} />
                    <div>
                      <p className="text-xs font-semibold">
                        {c.author.fullName || c.author.email}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        <RelativeTime date={c.createdAt} />
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {!c.isDeleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-amber-500 hover:bg-amber-500/10"
                        onClick={() => moderate(c.id, "soft")}
                        title="Soft delete"
                        aria-label="Soft delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                    {c.isDeleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => moderate(c.id, "restore")}
                        title="Restore"
                        aria-label="Restore"
                      >
                        <Undo2 className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:bg-red-500/10"
                      onClick={() => moderate(c.id, "hard")}
                      title="Permanently delete"
                      aria-label="Hard delete"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-xs mt-2 leading-relaxed whitespace-pre-wrap",
                    c.isDeleted
                      ? "text-muted-foreground italic"
                      : "text-foreground/80",
                  )}
                >
                  {c.content}
                </p>
                {!c.isDeleted && (
                  <div className="mt-2">
                    {replyingTo === c.id ? (
                      <div className="flex gap-2">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Reply as admin…"
                          rows={2}
                          className="text-xs flex-1 rounded-xl"
                          autoFocus
                          aria-label="Reply"
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            className={`h-8 text-xs ${BTN_PRIMARY}`}
                            onClick={() => handleReply(c.id)}
                            disabled={submittingReply || !replyContent.trim()}
                          >
                            {submittingReply ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Reply"
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(c.id)}
                        className="text-[10px] text-muted-foreground hover:text-[#7b57fc] transition-colors flex items-center gap-0.5"
                      >
                        <MessageSquare className="w-2.5 h-2.5" /> Reply as admin
                      </button>
                    )}
                  </div>
                )}
                {c.replies && c.replies.length > 0 && (
                  <div className="ml-6 mt-2 space-y-1.5 pl-3 border-l-2 border-border/30">
                    {c.replies.map((r) => (
                      <div
                        key={r.id}
                        className="text-[11px] text-muted-foreground"
                      >
                        <span className="font-semibold text-foreground/70">
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
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REACTION SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

function ReactionSummary({ postId }: { postId: string }) {
  const [summary, setSummary] = useState<{
    likes: number;
    dislikes: number;
    total: number;
  } | null>(null);
  useEffect(() => {
    getPostReactionSummary(postId).then((r) => {
      if (r.success) setSummary(r.data);
    });
  }, [postId]);
  if (!summary || summary.total === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
      aria-label={`${summary.likes} likes, ${summary.dislikes} dislikes`}
    >
      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> {summary.likes}
      {summary.dislikes > 0 && (
        <span className="text-muted-foreground/50">·{summary.dislikes}👎</span>
      )}
    </span>
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
  const [slugAvail, setSlugAvail] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setErrors({});
    setCreatedId(null);
    setCreatedImages([]);
    setCreatedVideos([]);
    setSlugAvail(null);
    if (editPost) {
      setForm({
        titleEn: editPost.titleEn,
        titleAr: editPost.titleAr ?? "",
        slugEn: editPost.slugEn,
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

  useEffect(() => {
    return () => {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    };
  }, []);

  const setField =
    (k: keyof typeof EMPTY_FORM) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  // Debounced slug check
  useEffect(() => {
    if (!form.slugEn) return;
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    slugTimerRef.current = setTimeout(async () => {
      setCheckingSlug(true);
      const r = await checkSlugAvailability(form.slugEn, editPost?.id);
      setSlugAvail(r.success ? r.data.available : null);
      setCheckingSlug(false);
    }, 500);
  }, [form.slugEn, editPost?.id]);

  const genSlug = async () => {
    const title = form.titleEn;
    if (!title.trim()) {
      toast.error("Enter a title first");
      return;
    }
    const r = await generateUniqueSlug(title, editPost?.id);
    if (r.success) setForm((p) => ({ ...p, slugEn: r.data.slug }));
    else toast.error(r.error || "Failed");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.titleEn.trim()) e.titleEn = "English title is required";
    if (!form.slugEn.trim()) e.slugEn = "English slug is required";
    if (!form.contentEn.trim()) e.contentEn = "English content is required";
    if (slugAvail === false) e.slugEn = "Slug is already taken";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildInput = (): CreatePostInput => ({
    titleEn: form.titleEn.trim(),
    titleAr: form.titleAr.trim() || undefined,
    slugEn: form.slugEn.trim(),
    excerptEn: form.excerptEn.trim() || undefined,
    excerptAr: form.excerptAr.trim() || undefined,
    contentEn: form.contentEn,
    contentAr: form.contentAr || undefined,
    status: form.status,
    publishedAt: parseDateSafe(form.publishedAt) || undefined,
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
      setTab("basic");
      return;
    }
    start(async () => {
      if (isEdit && editPost) {
        const r = await updatePost(editPost.id, {
          ...buildInput(),
          isDeleted: editPost.isDeleted,
        });
        if (r.success) {
          toast.success("Post updated");
          onClose();
          onDone();
        } else toast.error(r.error || "Failed to update");
      } else {
        const r = await createPost(buildInput());
        if (r.success) {
          toast.success("Post created — add media now");
          setCreatedId(r.data.id);
          setCreatedImages(r.data.images ?? []);
          setCreatedVideos(r.data.videos ?? []);
        } else toast.error(r.error || "Failed to create");
      }
    });
  };

  const handleAutoSeo = async () => {
    if (!editPost) return;
    const r = await autoFillSeoFields(editPost.id);
    if (r.success) {
      if (r.data.filled.length)
        toast.success(`Auto-filled: ${r.data.filled.join(", ")}`);
      else toast.info("All SEO fields already filled");
      onDone();
    } else toast.error(r.error || "Failed");
  };

  const refreshMedia = async (id: string) => {
    const r = await getPostById(id);
    if (r.success) {
      setCreatedImages((r.data as any).images ?? []);
      setCreatedVideos((r.data as any).videos ?? []);
    }
    onDone();
  };

  const TABS: {
    id: FormTab;
    label: string;
    icon: LucideIcon;
    hasError?: boolean;
  }[] = [
    {
      id: "basic",
      label: "Basic",
      icon: FileText,
      hasError: !!(errors.titleEn || errors.slugEn),
    },
    {
      id: "content",
      label: "Content",
      icon: BookOpen,
      hasError: !!errors.contentEn,
    },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "seo", label: "SEO", icon: Sparkles },
  ];

  // Post-creation media screen
  if (createdId) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <DialogContent className="w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
          <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              Post created — add media (optional)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Images
              </h3>
              <ImageManager
                postId={createdId}
                images={createdImages}
                onChanged={() => refreshMedia(createdId)}
              />
            </div>
            <div className="border-t pt-5">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
              className={BTN_PRIMARY}
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

  const SlugStatus = ({ avail }: { avail: boolean | null }) => {
    if (checkingSlug)
      return (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
      );
    if (avail === true)
      return (
        <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500" />
      );
    if (avail === false)
      return (
        <AlertCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-red-500" />
      );
    return null;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="w-full max-w-none! sm:max-w-4xl! max-h-[90vh] rounded-2xl flex flex-col overflow-hidden p-0 gap-0 [&>button:last-child]:hidden">
        <VisuallyHidden>
          <DialogTitle>
            {isEdit ? `Edit: ${editPost?.titleEn}` : "New Post"}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#7b57fc]/10 flex items-center justify-center">
              {isEdit ? (
                <Edit3 className="w-3.5 h-3.5 text-[#7b57fc]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-[#7b57fc]" />
              )}
            </div>
            <span className="text-sm font-bold">
              {isEdit
                ? `Edit: ${editPost?.titleEn.slice(0, 45)}${(editPost?.titleEn.length ?? 0) > 45 ? "…" : ""}`
                : "New Post"}
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
        <div
          className="flex border-b px-4 gap-0 overflow-x-auto shrink-0"
          role="tablist"
        >
          {TABS.map(({ id, label, icon: Icon, hasError }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              role="tab"
              aria-selected={tab === id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap relative",
                tab === id
                  ? "border-[#7b57fc] text-[#7b57fc]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
              {hasError && (
                <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Basic */}
          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS} htmlFor="f-title-en">
                    Title (English) *
                  </label>
                  <Input
                    id="f-title-en"
                    value={form.titleEn}
                    onChange={setField("titleEn")}
                    className={cn(
                      INPUT_CLS,
                      errors.titleEn && "border-red-400",
                    )}
                    placeholder="Post title in English"
                    aria-required="true"
                  />
                  {errors.titleEn && (
                    <p className="text-[10px] text-red-500 mt-0.5" role="alert">
                      {errors.titleEn}
                    </p>
                  )}
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-title-ar">
                    العنوان (عربي)
                  </label>
                  <Input
                    id="f-title-ar"
                    value={form.titleAr}
                    onChange={setField("titleAr")}
                    dir="rtl"
                    className={INPUT_CLS}
                    placeholder="عنوان المنشور بالعربية"
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLS} htmlFor="f-slug-en">
                  Slug *
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Input
                      id="f-slug-en"
                      value={form.slugEn}
                      onChange={setField("slugEn")}
                      className={cn(
                        INPUT_CLS,
                        "pr-8",
                        errors.slugEn && "border-red-400",
                      )}
                      placeholder="my-post-slug"
                    />
                    <SlugStatus avail={slugAvail} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5 rounded-xl shrink-0"
                    onClick={genSlug}
                    title="Generate from title"
                    aria-label="Generate slug"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {errors.slugEn && (
                  <p className="text-[10px] text-red-500 mt-0.5" role="alert">
                    {errors.slugEn}
                  </p>
                )}
                {!errors.slugEn && slugAvail === false && (
                  <p className="text-[10px] text-red-500 mt-0.5">
                    Slug already in use
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS} htmlFor="f-excerpt-en">
                    Excerpt EN
                  </label>
                  <Textarea
                    id="f-excerpt-en"
                    value={form.excerptEn}
                    onChange={setField("excerptEn")}
                    rows={2}
                    className={TEXTAREA_CLS}
                    placeholder="Short summary…"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-excerpt-ar">
                    ملخص AR
                  </label>
                  <Textarea
                    id="f-excerpt-ar"
                    value={form.excerptAr}
                    onChange={setField("excerptAr")}
                    rows={2}
                    dir="rtl"
                    className={TEXTAREA_CLS}
                    placeholder="ملخص قصير…"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS} htmlFor="f-status">
                    Status
                  </label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, status: v as PostStatus }))
                    }
                  >
                    <SelectTrigger id="f-status" className={INPUT_CLS}>
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
                  <label className={LABEL_CLS} htmlFor="f-pub-at">
                    Publish Date / Schedule
                  </label>
                  <Input
                    id="f-pub-at"
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={setField("publishedAt")}
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS} htmlFor="f-category">
                    Category
                  </label>
                  <Select
                    value={form.categoryId || "__none__"}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        categoryId: v === "__none__" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger id="f-category" className={INPUT_CLS}>
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
                  <label className={LABEL_CLS} htmlFor="f-tags">
                    Tags
                  </label>
                  <MultiTagSelect
                    id="f-tags"
                    value={form.tagIds}
                    onChange={(ids) => setForm((p) => ({ ...p, tagIds: ids }))}
                    options={tags}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {tab === "content" && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS} htmlFor="f-content-en">
                  Content EN *{" "}
                  <span className="text-muted-foreground/50 normal-case font-normal">
                    (HTML / rich text)
                  </span>
                </label>
                <Textarea
                  id="f-content-en"
                  value={form.contentEn}
                  onChange={setField("contentEn")}
                  rows={16}
                  className={cn(
                    TEXTAREA_CLS,
                    "font-mono text-xs leading-relaxed",
                    errors.contentEn && "border-red-400",
                  )}
                  placeholder="<h2>Introduction</h2><p>Your content here…</p>"
                />
                {errors.contentEn && (
                  <p className="text-[10px] text-red-500 mt-0.5" role="alert">
                    {errors.contentEn}
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL_CLS} htmlFor="f-content-ar">
                  المحتوى AR{" "}
                  <span className="text-muted-foreground/50 normal-case font-normal">
                    (اختياري)
                  </span>
                </label>
                <Textarea
                  id="f-content-ar"
                  value={form.contentAr}
                  onChange={setField("contentAr")}
                  rows={10}
                  dir="rtl"
                  className={cn(
                    TEXTAREA_CLS,
                    "font-mono text-xs leading-relaxed",
                  )}
                  placeholder="<h2>مقدمة</h2><p>المحتوى هنا…</p>"
                />
              </div>
            </div>
          )}

          {/* Media */}
          {tab === "media" && isEdit && editPost && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Images
                </h3>
                <ImageManager
                  postId={editPost.id}
                  images={editPost.images}
                  onChanged={onDone}
                />
              </div>
              <div className="border-t pt-5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
                Images and videos can be added after creation.
              </p>
              <Button
                size="sm"
                className={`mt-4 ${BTN_PRIMARY}`}
                onClick={() => setTab("basic")}
              >
                Go to Basic
              </Button>
            </div>
          )}

          {/* SEO */}
          {tab === "seo" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  Optimise how this post appears in search engines and social
                  media.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleAutoSeo}
                  disabled={!isEdit}
                  aria-label="Auto-fill SEO"
                >
                  <Sparkles className="w-3 h-3" /> Auto-fill
                </Button>
              </div>
              {!isEdit && (
                <p className="text-[11px] text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
                  Auto-fill available after the post is saved.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS} htmlFor="f-meta-title-en">
                    Meta Title EN ({form.metaTitleEn.length}/60)
                  </label>
                  <Input
                    id="f-meta-title-en"
                    value={form.metaTitleEn}
                    onChange={setField("metaTitleEn")}
                    maxLength={60}
                    className={cn(
                      INPUT_CLS,
                      form.metaTitleEn.length > 55 && "border-amber-400",
                    )}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-meta-title-ar">
                    Meta Title AR ({form.metaTitleAr.length}/60)
                  </label>
                  <Input
                    id="f-meta-title-ar"
                    value={form.metaTitleAr}
                    onChange={setField("metaTitleAr")}
                    maxLength={60}
                    dir="rtl"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-meta-desc-en">
                    Meta Description EN ({form.metaDescriptionEn.length}/160)
                  </label>
                  <Textarea
                    id="f-meta-desc-en"
                    value={form.metaDescriptionEn}
                    onChange={setField("metaDescriptionEn")}
                    rows={2}
                    maxLength={160}
                    className={cn(
                      TEXTAREA_CLS,
                      form.metaDescriptionEn.length > 150 && "border-amber-400",
                    )}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-meta-desc-ar">
                    Meta Description AR ({form.metaDescriptionAr.length}/160)
                  </label>
                  <Textarea
                    id="f-meta-desc-ar"
                    value={form.metaDescriptionAr}
                    onChange={setField("metaDescriptionAr")}
                    rows={2}
                    dir="rtl"
                    className={TEXTAREA_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-og-image">
                    OG Image URL
                  </label>
                  <Input
                    id="f-og-image"
                    value={form.ogImageUrl}
                    onChange={setField("ogImageUrl")}
                    className={INPUT_CLS}
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-twitter-card">
                    Twitter Card
                  </label>
                  <Select
                    value={form.twitterCard}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, twitterCard: v }))
                    }
                  >
                    <SelectTrigger id="f-twitter-card" className={INPUT_CLS}>
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
                <div>
                  <label className={LABEL_CLS} htmlFor="f-og-alt-en">
                    OG Image Alt EN
                  </label>
                  <Input
                    id="f-og-alt-en"
                    value={form.ogImageAltEn}
                    onChange={setField("ogImageAltEn")}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="f-og-alt-ar">
                    OG Image Alt AR
                  </label>
                  <Input
                    id="f-og-alt-ar"
                    value={form.ogImageAltAr}
                    onChange={setField("ogImageAltAr")}
                    dir="rtl"
                    className={INPUT_CLS}
                  />
                </div>
                <div className="col-span-full">
                  <label className={LABEL_CLS} htmlFor="f-canonical">
                    Canonical URL
                  </label>
                  <Input
                    id="f-canonical"
                    value={form.canonicalUrl}
                    onChange={setField("canonicalUrl")}
                    className={INPUT_CLS}
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
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  tab === t
                    ? "bg-[#7b57fc] w-5"
                    : "bg-muted-foreground/20 w-2.5",
                )}
                aria-label={`Go to ${t} tab`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={isPending}
              className={`${BTN_PRIMARY} min-w-28`}
              onClick={handleSubmit}
              aria-busy={isPending}
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
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "restore" | "hard_delete" | null
  >(null);
  const primaryImg = post.images.find((i) => i.isPrimary) ?? post.images[0];

  const act = (fn: () => Promise<any>, msg: string, onSuccess?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.success) {
        toast.success(msg);
        onDone();
        onSuccess?.();
      } else toast.error(r.error || "Action failed");
    });

  const handleOpenMedia = async () => {
    const full = await getPostById(post.id);
    if (full.success) onManageMedia(full.data as SerializedPost);
    else toast.error("Could not load post data");
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "group relative rounded-2xl border bg-card overflow-hidden transition-all duration-200",
        selected
          ? "border-[#7b57fc]/50 ring-2 ring-[#7b57fc]/15 shadow-lg shadow-[#7b57fc]/5"
          : "border-border/50 hover:border-border/80 hover:shadow-md",
        post.isDeleted && "opacity-60",
      )}
    >
      {/* Checkbox */}
      <div className="absolute top-2.5 left-2.5 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className={cn(
            "w-4 h-4 rounded accent-[#7b57fc] cursor-pointer transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          aria-label={`Select: ${post.titleEn}`}
        />
      </div>

      {/* Cover */}
      <div className="relative h-44 bg-linear-to-br from-muted/30 to-muted/60 overflow-hidden">
        {primaryImg ? (
          <img
            src={primaryImg.url}
            alt={primaryImg.altText ?? post.titleEn}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-muted-foreground/10" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-2 right-2">
          <StatusBadge status={post.status} isDeleted={post.isDeleted} />
        </div>
        {/* Media count badges */}
        {(post._count.images > 0 || post._count.videos > 0) && (
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            {post._count.images > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-medium bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full">
                <ImageIcon className="w-2.5 h-2.5" /> {post._count.images}
              </span>
            )}
            {post._count.videos > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-medium bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full">
                <Video className="w-2.5 h-2.5" /> {post._count.videos}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
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
                className="h-7 w-7 rounded-lg -mt-0.5 shrink-0 cursor-pointer"
                aria-label={`Actions for: ${post.titleEn}`}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">
                Actions
              </DropdownMenuLabel>
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
              {post.status === "DRAFT" && !post.isDeleted && (
                <DropdownMenuItem
                  onClick={() => act(() => publishPost(post.id), "Published!")}
                  className="text-emerald-600"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-2" /> Publish
                </DropdownMenuItem>
              )}
              {post.status === "PUBLISHED" && !post.isDeleted && (
                <DropdownMenuItem
                  onClick={() =>
                    act(() => unpublishPost(post.id), "Moved to draft")
                  }
                >
                  <Eye className="w-3.5 h-3.5 mr-2" /> Unpublish
                </DropdownMenuItem>
              )}
              {post.status !== "ARCHIVED" && !post.isDeleted && (
                <DropdownMenuItem
                  onClick={() => act(() => archivePost(post.id), "Archived")}
                  className="text-amber-600"
                >
                  <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {!post.isDeleted ? (
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => setConfirmAction("delete")}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    className="text-emerald-600"
                    onClick={() => setConfirmAction("restore")}
                  >
                    <Undo2 className="w-3.5 h-3.5 mr-2" /> Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => setConfirmAction("hard_delete")}
                  >
                    <X className="w-3.5 h-3.5 mr-2" /> Delete permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {post.excerptEn && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerptEn}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5 border-t border-border/30">
          {post.category && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <FolderTree className="w-2.5 h-2.5" /> {post.category.nameEn}
            </span>
          )}
          {post.tags.length > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5" />
              {post.tags
                .slice(0, 2)
                .map((t) => t.tag.nameEn)
                .join(", ")}
              {post.tags.length > 2 && ` +${post.tags.length - 2}`}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <CommentManager
              postId={post.id}
              commentCount={post._count.comments}
              onChanged={onDone}
            />
            <ReactionSummary postId={post.id} />
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />{" "}
            <RelativeTime date={post.createdAt} />
          </p>
          {post.author && (
            <div className="flex items-center gap-1">
              <Avatar
                name={post.author.fullName}
                email={post.author.email}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirm overlay */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-card/96 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-4 z-20"
            role="dialog"
            aria-modal="true"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                confirmAction === "restore"
                  ? "bg-emerald-500/10"
                  : "bg-red-500/10",
              )}
            >
              {confirmAction === "restore" ? (
                <Undo2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-sm font-semibold text-center">
              {confirmAction === "restore"
                ? "Restore this post?"
                : confirmAction === "hard_delete"
                  ? "Permanently delete?"
                  : "Delete this post?"}
            </p>
            {confirmAction === "delete" && (
              <p className="text-xs text-muted-foreground text-center">
                Can be restored from the Deleted filter.
              </p>
            )}
            {confirmAction === "hard_delete" && (
              <p className="text-xs text-red-500/80 text-center">
                This action cannot be undone.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending}
                className={cn(
                  "h-8 px-4 rounded-xl text-white border-0",
                  confirmAction === "restore"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600",
                )}
                onClick={() =>
                  act(
                    () =>
                      confirmAction === "restore"
                        ? restorePost(post.id)
                        : confirmAction === "hard_delete"
                          ? hardDeletePost(post.id)
                          : softDeletePost(post.id),
                    confirmAction === "restore"
                      ? "Restored"
                      : confirmAction === "hard_delete"
                        ? "Permanently deleted"
                        : "Deleted",
                    () => setConfirmAction(null),
                  )
                }
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : confirmAction === "restore" ? (
                  "Restore"
                ) : (
                  "Confirm"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 rounded-xl"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#7b57fc]/8 text-[#7b57fc] border border-[#7b57fc]/20">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-[#5a3fcc]"
        aria-label={`Remove: ${label}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

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
  onBulkAction: (action: BulkPostAction | "hard_delete") => void;
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

  const BULK: {
    action: BulkPostAction | "hard_delete";
    label: string;
    cls?: string;
  }[] = [
    { action: "publish", label: "Publish all" },
    { action: "unpublish", label: "Unpublish all" },
    { action: "archive", label: "Archive all" },
    { action: "restore", label: "Restore all" },
    { action: "delete", label: "Soft delete all", cls: "text-amber-500" },
    { action: "hard_delete", label: "Permanently delete", cls: "text-red-500" },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {/* Bulk actions */}
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
                  className={`h-7 px-2.5 text-[11px] ${BTN_PRIMARY} gap-1`}
                  aria-label="Bulk actions"
                >
                  Actions <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {BULK.map(({ action, label, cls }) => (
                  <DropdownMenuItem
                    key={action}
                    className={cn("text-xs", cls)}
                    onClick={() => {
                      const requiresConfirm = [
                        "delete",
                        "hard_delete",
                      ].includes(action);
                      if (requiresConfirm) {
                        const msg =
                          action === "hard_delete"
                            ? "⚠️ Permanently delete all selected posts? This cannot be undone."
                            : "Soft delete all selected posts?";
                        if (!confirm(msg)) return;
                      }
                      onBulkAction(action);
                    }}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          )}
          <Input
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search posts…"
            className="pl-9 h-9 rounded-xl text-sm border-border/60"
            aria-label="Search posts"
          />
          {searchVal && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
                "border-[#7b57fc]/40 text-[#7b57fc] bg-[#7b57fc]/5",
            )}
            aria-label="Filter by status"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
          </SelectContent>
        </Select>

        {/* Category */}
        {categories.length > 0 && (
          <Select
            value={filters.categoryId ?? "__all__"}
            onValueChange={(v) =>
              onApply({
                categoryId: v === "__all__" ? undefined : v,
                page: "1",
              })
            }
          >
            <SelectTrigger
              className={cn(
                "h-9 rounded-xl border-border/60 text-xs w-36",
                filters.categoryId &&
                  "border-[#7b57fc]/40 text-[#7b57fc] bg-[#7b57fc]/5",
              )}
              aria-label="Filter by category"
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
          <SelectTrigger
            className="h-9 rounded-xl border-border/60 text-xs w-44"
            aria-label="Sort"
          >
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
            className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              setSearchVal("");
              onApply({
                status: undefined,
                categoryId: undefined,
                search: undefined,
                page: "1",
              });
            }}
          >
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {activeCount > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          role="list"
          aria-label="Active filters"
        >
          {filters.status && filters.status !== "all" && (
            <FilterChip
              label={`Status: ${filters.status}`}
              onRemove={() => onApply({ status: undefined, page: "1" })}
            />
          )}
          {filters.categoryId && (
            <FilterChip
              label={`Category: ${categories.find((c) => c.id === filters.categoryId)?.nameEn ?? filters.categoryId}`}
              onRemove={() => onApply({ categoryId: undefined, page: "1" })}
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

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA DIALOG (standalone)
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
      <DialogContent className="w-full max-w-none! sm:max-w-4xl! rounded-2xl flex flex-col max-h-[90vh] p-0 gap-0 [&>button:last-child]:hidden">
        <DialogHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 p-4 border-b shrink-0">
          <DialogTitle className="text-sm font-bold truncate">
            Media — {post?.titleEn}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {post && (
            <>
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Images
                </h3>
                <ImageManager
                  postId={post.id}
                  images={currentImages}
                  onChanged={refreshMedia}
                />
              </div>
              <div className="border-t pt-5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
// MAIN EXPORT - BlogPageClient
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
  filters: FilterParams;
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
  const searchParams = useSearchParams();
  const [isPending, start] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editPost, setEditPost] = useState<SerializedPost | null>(null);
  const [mediaPost, setMediaPost] = useState<SerializedPost | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const applyFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      start(() => {
        const params = new URLSearchParams(searchParams.toString());
        const current: Record<string, string | undefined> = {
          page: String(filters.page),
          status: filters.status,
          categoryId: filters.categoryId,
          search: filters.search,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        };
        const merged = { ...current, ...patch };
        Object.keys(merged).forEach((k) => params.delete(k));
        Object.entries(merged).forEach(([k, v]) => {
          if (v !== undefined && v !== "" && !(k === "page" && v === "1"))
            params.set(k, v);
        });
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [filters, router, pathname, searchParams],
  );

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  }, [router]);

  const toggleSelect = (id: string) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? initialPosts.map((p) => p.id) : []);
  const allSelected =
    initialPosts.length > 0 &&
    initialPosts.every((p) => selectedIds.includes(p.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleBulk = async (action: BulkPostAction | "hard_delete") => {
    if (!selectedIds.length) return;
    start(async () => {
      let r: { success: boolean; data?: any; error?: string };
      if (action === "hard_delete") {
        let count = 0;
        for (const id of selectedIds) {
          const res = await hardDeletePost(id);
          if (res.success) count++;
        }
        r = { success: true, data: { count } };
      } else {
        r = await bulkPostAction(selectedIds, action as BulkPostAction);
      }
      if (r.success) {
        toast.success(
          `${r.data.count} post(s) — ${action === "hard_delete" ? "permanently deleted" : action}ed`,
        );
        setSelectedIds([]);
        refresh();
      } else toast.error(r.error || "Bulk operation failed");
    });
  };

  useKeyboardShortcuts({
    onNewPost: () => {
      setEditPost(null);
      setFormOpen(true);
    },
    onSearch: () =>
      document
        .querySelector<HTMLInputElement>('input[placeholder*="Search"]')
        ?.focus(),
    onRefresh: refresh,
  });

  const isLoading = isRefreshing;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-5">
        {/* Stats */}
        {stats && <StatsStrip stats={stats} />}

        {/* Toolbar */}
        <div className="flex flex-wrap justify-between gap-2 items-center">
          <div className="flex gap-2 flex-wrap">
            <CategoryManager categories={categories} onChanged={refresh} />
            <TagManager tags={tags} onChanged={refresh} />
            <AdsManager onChanged={refresh} />
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-xl"
                  onClick={refresh}
                  disabled={isPending || isLoading}
                  aria-label="Refresh"
                >
                  <RefreshCw
                    className={cn(
                      "w-3.5 h-3.5",
                      (isPending || isLoading) && "animate-spin",
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh (⌘R)</TooltipContent>
            </Tooltip>
            <Button
              size="sm"
              className={`h-8 px-4 rounded-xl gap-1.5 text-xs ${BTN_PRIMARY}`}
              onClick={() => {
                setEditPost(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" /> New Post
            </Button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          categories={categories}
          onApply={applyFilters}
          isPending={isPending || isLoading}
          selectedCount={selectedIds.length}
          onBulkAction={handleBulk}
        />

        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(r) => {
                if (r) r.indeterminate = someSelected;
              }}
              onChange={(e) => toggleAll(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-[#7b57fc]"
              aria-label="Select all posts"
            />
            <span className="text-xs text-muted-foreground">
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : `${pagination.total.toLocaleString()} post${pagination.total !== 1 ? "s" : ""}`}
            </span>
          </label>
          <p className="text-[10px] text-muted-foreground hidden sm:block">
            ⌘N new · ⌘K search · ⌘R refresh
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : initialPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-24 rounded-2xl border border-dashed border-border/60 bg-card/30"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1">No posts found</p>
              <p className="text-xs text-muted-foreground">
                {filters.search ||
                (filters.status && filters.status !== "all") ||
                filters.categoryId
                  ? "Try adjusting your filters"
                  : "Create your first post to get started"}
              </p>
            </div>
            <Button
              className={BTN_PRIMARY}
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
            <AnimatePresence mode="popLayout">
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
                    } else toast.error("Failed to load post");
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

        {/* Dialogs */}
        <PostFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditPost(null);
          }}
          onDone={refresh}
          editPost={editPost}
          categories={categories}
          tags={tags}
        />
        <MediaDialog
          open={mediaOpen}
          post={mediaPost}
          onClose={() => setMediaOpen(false)}
          onDone={refresh}
        />
      </div>
    </TooltipProvider>
  );
}
