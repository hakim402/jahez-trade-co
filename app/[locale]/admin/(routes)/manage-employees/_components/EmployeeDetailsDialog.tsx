"use client";

// app/[locale]/admin/(routes)/manage-employees/_components/EmployeeDetailsDialog.tsx

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  Mail,
  Phone,
  Calendar,
  Hash,
  Activity,
  Eye,
  EyeOff,
  Link,
  AlignLeft,
  UserCircle,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getEmployeeById, type EmployeeDetail } from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string) {
  if (name)
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email.substring(0, 2).toUpperCase();
}

function avatarGradient(email: string) {
  const palette = [
    "from-violet-500 to-[#7b57fc]",
    "from-blue-500 to-cyan-500",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
    "from-fuchsia-500 to-purple-600",
  ];
  const idx = email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

function fmtDate(d: Date | string) {
  return format(new Date(d), "MMM d, yyyy");
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Icon size={13} className="text-muted-foreground" />
      </div>
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <span className={cn("text-sm font-medium text-foreground truncate", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#7b57fc]/10">
        <Icon size={11} className="text-[#7b57fc]" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

function SocialLink({ icon: Icon, url, label, color }: { icon: any; url: string | null; label: string; color: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/50 transition-colors text-xs font-medium group",
        color,
      )}
    >
      <Icon size={13} />
      <span className="truncate flex-1">{label}</span>
      <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
    </a>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
        <Icon size={20} className="opacity-30" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface EmployeeDetailsDialogProps {
  profileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DIALOG
// ─────────────────────────────────────────────────────────────────────────────

export function EmployeeDetailsDialog({
  profileId,
  open,
  onOpenChange,
  onRefresh,
}: EmployeeDetailsDialogProps) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !profileId) { setEmployee(null); return; }
    setLoading(true);
    getEmployeeById(profileId)
      .then((result) => {
        if (!result.success) { toast.error(result.error); return; }
        setEmployee(result.data.employee);
      })
      .catch(() => toast.error("Failed to load employee details"))
      .finally(() => setLoading(false));
  }, [profileId, open]);

  const isPublished = employee?.status === "PUBLISHED";

  // Collect social links for rendering
  const socialLinks = employee ? [
    { icon: Facebook,  url: employee.facebookUrl,  label: "Facebook",  color: "text-blue-600 dark:text-blue-400" },
    { icon: Instagram, url: employee.instagramUrl, label: "Instagram", color: "text-pink-500" },
    { icon: Twitter,   url: employee.twitterUrl,   label: "Twitter / X", color: "text-sky-500" },
    { icon: Linkedin,  url: employee.linkedinUrl,  label: "LinkedIn",  color: "text-blue-700 dark:text-blue-400" },
    { icon: Youtube,   url: employee.youtubeUrl,   label: "YouTube",   color: "text-red-500" },
    { icon: Globe,     url: employee.tiktokUrl,    label: "TikTok",    color: "text-foreground" },
    { icon: Globe,     url: employee.snapchatUrl,  label: "Snapchat",  color: "text-yellow-500" },
  ] : [];

  const otherLinks = Array.isArray(employee?.otherLinks)
    ? (employee.otherLinks as { platform: string; url: string }[])
    : [];

  const hasSocials = socialLinks.some((s) => !!s.url) || otherLinks.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[96vw] sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl",
          "h-[92vh] overflow-hidden flex flex-col p-0",
          "bg-card border border-border/60 shadow-2xl rounded-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
          "duration-200",
        )}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : employee ? (
          <>
            {/* ── HERO HEADER ──────────────────────────────────────────── */}
            <div className="relative overflow-hidden shrink-0">
              <div className={cn("absolute inset-0 bg-linear-to-r opacity-10", avatarGradient(employee.user.email))} />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-card" />

              <div className="relative flex flex-col sm:flex-row sm:items-start gap-5 px-6 pt-6 pb-5">
                {/* Photo / Avatar */}
                <div className="relative shrink-0">
                  <div className={cn("h-16 w-16 rounded-2xl bg-linear-to-br flex items-center justify-center ring-4 ring-background shadow-xl", avatarGradient(employee.user.email))}>
                    {employee.photoUrl ? (
                      <Avatar className="h-16 w-16 rounded-2xl">
                        <AvatarImage src={employee.photoUrl} alt={employee.photoAltEn ?? undefined} />
                        <AvatarFallback className={cn("rounded-2xl text-white text-xl font-bold bg-linear-to-br", avatarGradient(employee.user.email))}>
                          {getInitials(employee.user.fullName, employee.user.email)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {getInitials(employee.user.fullName, employee.user.email)}
                      </span>
                    )}
                  </div>
                  {/* Publish dot */}
                  <span className={cn(
                    "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                    isPublished ? "bg-emerald-400" : "bg-amber-400",
                  )} />
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground truncate">
                      {employee.user.fullName || "No name"}
                    </h2>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 shrink-0",
                      isPublished
                        ? "text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 bg-emerald-500/8"
                        : "text-amber-600 dark:text-amber-400 ring-amber-400/30 bg-amber-500/8",
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-emerald-400" : "bg-amber-400")} />
                      {isPublished ? "Published" : "Draft"}
                    </span>
                    {employee.slug && (
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        /{employee.slug}
                      </Badge>
                    )}
                  </div>

                  {/* Position */}
                  {(employee.positionEn || employee.positionAr) && (
                    <div className="flex items-center gap-2 mt-1">
                      {employee.positionEn && (
                        <p className="text-sm text-muted-foreground">{employee.positionEn}</p>
                      )}
                      {employee.positionAr && (
                        <p className="text-sm text-muted-foreground/60 font-medium" dir="rtl">
                          {employee.positionAr}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/60 font-mono mt-1">{employee.user.email}</p>
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  {[
                    { label: "Order", value: `#${employee.displayOrder}`, color: "bg-[#7b57fc]/8 text-[#7b57fc] ring-[#7b57fc]/20" },
                    { label: "Requests", value: employee.user._count.requests, color: "bg-blue-500/8 text-blue-600 dark:text-blue-400 ring-blue-400/20" },
                    { label: "Bookings", value: employee.user._count.clientBookings, color: "bg-violet-500/8 text-[#7b57fc] ring-[#7b57fc]/20" },
                    { label: "Chats", value: employee.user._count.chatSessions, color: "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 ring-emerald-400/20" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl ring-1 text-center min-w-12", color)}>
                      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
                      <p className="text-[10px] font-medium opacity-70 leading-none">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="shrink-0" />

            {/* ── BODY ─────────────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="px-6 py-5 space-y-6">

                {/* Contact + Profile Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* User contact */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                    <SectionTitle icon={UserCircle} label="User Account" />
                    <InfoRow icon={Mail} label="Email" value={employee.user.email} />
                    <InfoRow icon={Phone} label="Phone" value={employee.user.phone || "—"} />
                    <InfoRow icon={Calendar} label="Joined" value={fmtDate(employee.user.createdAt)} />
                    <InfoRow icon={Calendar} label="Profile" value={fmtDate(employee.createdAt)} />
                    <InfoRow icon={Hash} label="Clerk ID" value={employee.user.clerkId} mono />
                  </div>

                  {/* Profile meta */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                    <SectionTitle icon={ImageIcon} label="Profile Info" />
                    <InfoRow icon={Globe} label="Slug" value={employee.slug ? `/${employee.slug}` : "—"} mono />
                    <InfoRow
                      icon={isPublished ? Eye : EyeOff}
                      label="Status"
                      value={
                        <span className={cn("text-xs font-semibold", isPublished ? "text-emerald-500" : "text-amber-500")}>
                          {employee.status}
                        </span>
                      }
                    />
                    <InfoRow icon={Hash} label="Order" value={`#${employee.displayOrder}`} />
                    <InfoRow icon={Calendar} label="Updated" value={fmtDate(employee.updatedAt)} />
                    {employee.user.subscription && (
                      <InfoRow
                        icon={CheckCircle2}
                        label="Plan"
                        value={
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                            {employee.user.subscription.items[0]?.plan?.name ?? "Free"}
                          </Badge>
                        }
                      />
                    )}
                  </div>
                </div>

                {/* ── TABS ─────────────────────────────────────────────── */}
                <Tabs defaultValue="bio">
                  <div className="w-full overflow-x-auto">
                    <TabsList className="flex w-max h-9 rounded-xl bg-muted/50 p-0.5 gap-0.5">
                      {[
                        { value: "bio", label: "Biography" },
                        { value: "socials", label: "Social Links", count: socialLinks.filter((s) => s.url).length + otherLinks.length },
                        { value: "audit", label: "Audit Log" },
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative text-xs rounded-lg h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-[#7b57fc] gap-1.5"
                        >
                          {tab.label}
                          {tab.count != null && tab.count > 0 && (
                            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#7b57fc]/15 text-[#7b57fc] text-[9px] font-bold">
                              {tab.count}
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* ── Bio tab ──────────────────────────────────────── */}
                  <TabsContent value="bio" className="mt-4 space-y-4">
                    {/* Short bios */}
                    {(employee.shortBioEn || employee.shortBioAr) && (
                      <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                        <SectionTitle icon={AlignLeft} label="Short Bio" />
                        {employee.shortBioEn && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">English</p>
                            <p className="text-sm text-foreground/80 leading-relaxed">{employee.shortBioEn}</p>
                          </div>
                        )}
                        {employee.shortBioAr && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Arabic</p>
                            <p className="text-sm text-foreground/80 leading-relaxed text-right" dir="rtl">{employee.shortBioAr}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Full bios */}
                    {(employee.bioEn || employee.bioAr) ? (
                      <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-4">
                        <SectionTitle icon={AlignLeft} label="Full Biography" />
                        {employee.bioEn && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">English</p>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{employee.bioEn}</p>
                          </div>
                        )}
                        {employee.bioAr && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Arabic</p>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap text-right" dir="rtl">{employee.bioAr}</p>
                          </div>
                        )}
                      </div>
                    ) : !employee.shortBioEn && !employee.shortBioAr ? (
                      <EmptyState icon={AlignLeft} label="No biography added yet" />
                    ) : null}
                  </TabsContent>

                  {/* ── Socials tab ───────────────────────────────────── */}
                  <TabsContent value="socials" className="mt-4">
                    {!hasSocials ? (
                      <EmptyState icon={Link} label="No social links added" />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {socialLinks.map((s) => (
                          <SocialLink key={s.label} {...s} />
                        ))}
                        {otherLinks.map((link, i) => (
                          <SocialLink
                            key={`other-${i}`}
                            icon={Globe}
                            url={link.url}
                            label={link.platform}
                            color="text-muted-foreground"
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* ── Audit tab ─────────────────────────────────────── */}
                  <TabsContent value="audit" className="mt-4">
                    {employee.user._count.chatSessions === 0 ? (
                      <EmptyState icon={Activity} label="No audit events yet" />
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Audit log available in the audit panel.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        ) : null}

        <DialogHeader className="sr-only">
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>Full profile overview for this employee.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}