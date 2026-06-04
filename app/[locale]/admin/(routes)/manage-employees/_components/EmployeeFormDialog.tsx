"use client";

// app/[locale]/admin/(routes)/manage-employees/_components/EmployeeFormDialog.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Save,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  User,
  AlignLeft,
  ImageIcon,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateEmployeeProfile, type EmployeeDetail } from "../actions";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#7b57fc]/10">
        <Icon size={11} className="text-[#7b57fc]" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

const inputCls =
  "h-8 text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all";

const textareaCls =
  "text-sm bg-muted/40 border-border/50 rounded-lg focus:bg-background focus:border-[#7b57fc]/40 focus:ring-1 focus:ring-[#7b57fc]/20 transition-all resize-none";

// ─────────────────────────────────────────────────────────────────────────────
// FORM STATE
// ─────────────────────────────────────────────────────────────────────────────

type FormState = {
  positionEn: string;
  positionAr: string;
  bioEn: string;
  bioAr: string;
  shortBioEn: string;
  shortBioAr: string;
  slug: string;
  photoUrl: string;
  photoAltEn: string;
  photoAltAr: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  snapchatUrl: string;
};

const emptyForm = (): FormState => ({
  positionEn: "",
  positionAr: "",
  bioEn: "",
  bioAr: "",
  shortBioEn: "",
  shortBioAr: "",
  slug: "",
  photoUrl: "",
  photoAltEn: "",
  photoAltAr: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
  snapchatUrl: "",
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface EmployeeFormDialogProps {
  employee: EmployeeDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function EmployeeFormDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: EmployeeFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!employee) { setForm(emptyForm()); return; }
    setForm({
      positionEn:   employee.positionEn   ?? "",
      positionAr:   employee.positionAr   ?? "",
      bioEn:        employee.bioEn        ?? "",
      bioAr:        employee.bioAr        ?? "",
      shortBioEn:   employee.shortBioEn   ?? "",
      shortBioAr:   employee.shortBioAr   ?? "",
      slug:         employee.slug         ?? "",
      photoUrl:     employee.photoUrl     ?? "",
      photoAltEn:   employee.photoAltEn   ?? "",
      photoAltAr:   employee.photoAltAr   ?? "",
      facebookUrl:  employee.facebookUrl  ?? "",
      instagramUrl: employee.instagramUrl ?? "",
      twitterUrl:   employee.twitterUrl   ?? "",
      linkedinUrl:  employee.linkedinUrl  ?? "",
      youtubeUrl:   employee.youtubeUrl   ?? "",
      tiktokUrl:    employee.tiktokUrl    ?? "",
      snapchatUrl:  employee.snapchatUrl  ?? "",
    });
  }, [employee]);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const nullable = (v: string) => (v.trim() === "" ? null : v.trim());

  const handleSave = async () => {
    if (!employee) return;
    setIsSaving(true);
    try {
      const result = await updateEmployeeProfile({
        id:           employee.id,
        positionEn:   nullable(form.positionEn),
        positionAr:   nullable(form.positionAr),
        bioEn:        nullable(form.bioEn),
        bioAr:        nullable(form.bioAr),
        shortBioEn:   nullable(form.shortBioEn),
        shortBioAr:   nullable(form.shortBioAr),
        slug:         nullable(form.slug),
        photoUrl:     nullable(form.photoUrl),
        photoAltEn:   nullable(form.photoAltEn),
        photoAltAr:   nullable(form.photoAltAr),
        facebookUrl:  nullable(form.facebookUrl),
        instagramUrl: nullable(form.instagramUrl),
        twitterUrl:   nullable(form.twitterUrl),
        linkedinUrl:  nullable(form.linkedinUrl),
        youtubeUrl:   nullable(form.youtubeUrl),
        tiktokUrl:    nullable(form.tiktokUrl),
        snapchatUrl:  nullable(form.snapchatUrl),
      });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Profile updated");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const socialFields: {
    key: keyof FormState;
    label: string;
    icon: any;
    placeholder: string;
  }[] = [
    { key: "facebookUrl",  label: "Facebook",    icon: Facebook,  placeholder: "https://facebook.com/…"  },
    { key: "instagramUrl", label: "Instagram",   icon: Instagram, placeholder: "https://instagram.com/…" },
    { key: "twitterUrl",   label: "Twitter / X", icon: Twitter,   placeholder: "https://x.com/…"          },
    { key: "linkedinUrl",  label: "LinkedIn",    icon: Linkedin,  placeholder: "https://linkedin.com/in/…"},
    { key: "youtubeUrl",   label: "YouTube",     icon: Youtube,   placeholder: "https://youtube.com/…"    },
    { key: "tiktokUrl",    label: "TikTok",      icon: Globe,     placeholder: "https://tiktok.com/@…"    },
    { key: "snapchatUrl",  label: "Snapchat",    icon: Globe,     placeholder: "https://snapchat.com/add/…"},
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[96vw] sm:max-w-2xl lg:max-w-3xl",
          "h-[92vh] overflow-hidden flex flex-col p-0",
          "bg-card border border-border/60 shadow-2xl rounded-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97]",
          "duration-200",
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7b57fc]/10">
            <User size={16} className="text-[#7b57fc]" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base font-semibold text-foreground">
              Edit Employee Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
              {employee?.user.fullName ?? employee?.user.email ?? "—"}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-8 text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 text-xs rounded-lg bg-[#7b57fc] hover:bg-[#6a48eb] text-white gap-1.5"
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save changes
            </Button>
          </div>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* Identity & Meta */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <SectionTitle icon={User} label="Identity & Meta" />
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Position (English)" htmlFor="positionEn">
                  <Input
                    id="positionEn"
                    value={form.positionEn}
                    onChange={set("positionEn")}
                    placeholder="e.g. Sourcing Manager"
                    className={inputCls}
                  />
                </Field>
                <Field label="Position (Arabic)" htmlFor="positionAr">
                  <Input
                    id="positionAr"
                    value={form.positionAr}
                    onChange={set("positionAr")}
                    placeholder="مدير التوريد"
                    className={inputCls}
                    dir="rtl"
                  />
                </Field>
              </div>
              <Field label="Slug" htmlFor="slug">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={set("slug")}
                  placeholder="john-doe"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Photo */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <SectionTitle icon={ImageIcon} label="Photo" />
            <div className="space-y-3">
              <Field label="Photo URL" htmlFor="photoUrl">
                <Input
                  id="photoUrl"
                  value={form.photoUrl}
                  onChange={set("photoUrl")}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Alt text (English)" htmlFor="photoAltEn">
                  <Input
                    id="photoAltEn"
                    value={form.photoAltEn}
                    onChange={set("photoAltEn")}
                    placeholder="Photo of John Doe"
                    className={inputCls}
                  />
                </Field>
                <Field label="Alt text (Arabic)" htmlFor="photoAltAr">
                  <Input
                    id="photoAltAr"
                    value={form.photoAltAr}
                    onChange={set("photoAltAr")}
                    placeholder="صورة جون دو"
                    className={inputCls}
                    dir="rtl"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <SectionTitle icon={AlignLeft} label="Biography" />
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Short Bio (English)" htmlFor="shortBioEn">
                  <Textarea
                    id="shortBioEn"
                    value={form.shortBioEn}
                    onChange={set("shortBioEn")}
                    rows={3}
                    placeholder="Brief introduction…"
                    className={textareaCls}
                  />
                </Field>
                <Field label="Short Bio (Arabic)" htmlFor="shortBioAr">
                  <Textarea
                    id="shortBioAr"
                    value={form.shortBioAr}
                    onChange={set("shortBioAr")}
                    rows={3}
                    placeholder="نبذة مختصرة…"
                    className={textareaCls}
                    dir="rtl"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Bio (English)" htmlFor="bioEn">
                  <Textarea
                    id="bioEn"
                    value={form.bioEn}
                    onChange={set("bioEn")}
                    rows={5}
                    placeholder="Full biography…"
                    className={textareaCls}
                  />
                </Field>
                <Field label="Full Bio (Arabic)" htmlFor="bioAr">
                  <Textarea
                    id="bioAr"
                    value={form.bioAr}
                    onChange={set("bioAr")}
                    rows={5}
                    placeholder="السيرة الذاتية الكاملة…"
                    className={textareaCls}
                    dir="rtl"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            <SectionTitle icon={Link} label="Social Links" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socialFields.map(({ key, label, icon: Icon, placeholder }) => (
                <Field key={key} label={label} htmlFor={key}>
                  <div className="relative">
                    <Icon
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <Input
                      id={key}
                      value={form[key]}
                      onChange={set(key)}
                      placeholder={placeholder}
                      className={cn(inputCls, "pl-7")}
                    />
                  </div>
                </Field>
              ))}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}