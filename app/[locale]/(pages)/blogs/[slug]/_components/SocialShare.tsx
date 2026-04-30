"use client";

import { Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;
  title: string;
  isAr: boolean;
}

export function SocialShare({ url, title, isAr }: SocialShareProps) {
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success(isAr ? "تم نسخ الرابط" : "Link copied!");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{isAr ? "مشاركة" : "Share"}</span>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
          <Twitter className="w-4 h-4" />
        </a>
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
          <Facebook className="w-4 h-4" />
        </a>
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">
          <Linkedin className="w-4 h-4" />
        </a>
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={copyLink}>
        <LinkIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}