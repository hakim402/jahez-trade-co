"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import {
  PackageSearch,
  Video,
  BriefcaseBusiness,
  Truck,
  ChevronRight,
  Clock,
  MapPin,
  Hash,
  DollarSign,
  Loader2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUnifiedClientTasks,
} from "../actions";
import {
  getRequestStatusConfig,
  getBookingStatusConfig,
  type UnifiedTask,
  type UnifiedTaskType,
} from "./types";

// ── Type config ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<UnifiedTaskType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}> = {
  REQUEST:    { icon: PackageSearch, label: "Product Request", color: "from-indigo-500 to-purple-500" },
  BOOKING:    { icon: Video, label: "Video Booking", color: "from-sky-500 to-cyan-500" },
  CONSULTING: { icon: BriefcaseBusiness, label: "Consulting", color: "from-emerald-500 to-teal-500" },
  SHIPMENT:   { icon: Truck, label: "Shipment", color: "from-amber-500 to-orange-500" },
};

function getStatusConfig(type: UnifiedTaskType, status: string) {
  if (type === "REQUEST") return getRequestStatusConfig(status);
  if (type === "BOOKING") return getBookingStatusConfig(status);
  // For consulting & shipment, use simple fallback
  return { label: status, color: "bg-muted", textColor: "text-muted-foreground", dot: "bg-muted-foreground" };
}

// ── Single task card ─────────────────────────────────────────────────────

function TaskCard({ task }: { task: UnifiedTask }) {
  const cfg = TYPE_CONFIG[task.type];
  const Icon = cfg.icon;
  const statusCfg = getStatusConfig(task.type, task.status);

  return (
    <Link
      href={task.route}
      className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Icon */}
      <div className={cn("rounded-lg p-2 bg-linear-to-br text-white shadow-sm shrink-0", cfg.color)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {task.title}
          </h3>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", statusCfg.color, statusCfg.textColor)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
            {statusCfg.label}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
          </span>

          {task.meta?.price && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3 w-3" />
              {Number(task.meta.price).toLocaleString("en-US", { style: "currency", currency: task.meta.currency || "USD", maximumFractionDigits: 0 })}
            </span>
          )}

          {task.meta?.quantity && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              Qty: {task.meta.quantity}
            </span>
          )}

          {task.meta?.shippingCountry && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {task.meta.shippingCountry}
            </span>
          )}

          {task.meta?.trackingCode && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
              <Truck className="h-3 w-3" />
              {task.meta.trackingCode}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1 group-hover:text-indigo-500 transition-colors" />
    </Link>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────

function TaskFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 animate-pulse">
          <div className="rounded-lg bg-muted h-8 w-8 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No tasks yet</p>
      <p className="text-xs text-muted-foreground mt-1">
        Your requests, bookings, and shipments will appear here.
      </p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────

export function UnifiedTaskFeed() {
  const t = useTranslations("ClientDashboard");
  const [tasks, setTasks] = useState<UnifiedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUnifiedClientTasks().then((r) => {
      if (r.success) setTasks(r.data);
      else setError(r.error || "Failed to load tasks");
      setLoading(false);
    });
  }, []);

  if (loading) return <TaskFeedSkeleton />;
  if (error) return <p className="text-sm text-red-500 py-4">{error}</p>;
  if (!tasks.length) return <EmptyState />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-foreground">{t("myTasks")}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length} items</span>
      </div>
      {tasks.map((task) => (
        <TaskCard key={`${task.type}-${task.id}`} task={task} />
      ))}
    </div>
  );
}
