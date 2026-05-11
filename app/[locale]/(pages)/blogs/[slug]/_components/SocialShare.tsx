"use client";

import { Twitter, Facebook, Linkedin, Link as LinkIcon, Instagram, Send, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;        // absolute URL (computed on server)
  title: string;
  isAr: boolean;
}

export function SocialShare({ url, title, isAr }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success(isAr ? "تم نسخ الرابط" : "Link copied!");
  };

  // Instagram does not have a direct share URL – we show a tooltip/open the post link
  const handleInstagram = () => {
    toast.info(isAr ? "انسخ الرابط والصقه في إنستغرام" : "Copy the link and paste it on Instagram");
  };

  // TikTok also lacks a direct share URL
  const handleTikTok = () => {
    toast.info(isAr ? "انسخ الرابط والصقه في تيك توك" : "Copy the link and paste it on TikTok");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{isAr ? "مشاركة" : "Share"}</span>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
          <Twitter className="w-4 h-4" />
        </a>
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <Facebook className="w-4 h-4" />
        </a>
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <Linkedin className="w-4 h-4" />
        </a>
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleInstagram} aria-label="Instagram">
        <Instagram className="w-4 h-4" />
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleTikTok} aria-label="TikTok">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.1 4.1 0 0 1-3.15-1.54 4.1 4.1 0 0 1-.77-2.18V3h-3v13.28a2.53 2.53 0 0 1-2.5 2.5 2.53 2.53 0 0 1-2.5-2.5 2.53 2.53 0 0 1 2.5-2.5c.26 0 .51.05.75.12v-3.2a5.48 5.48 0 0 0-3.75-.5 5.5 5.5 0 0 0-4.5 5.43 5.5 5.5 0 0 0 5.5 5.5 5.5 5.5 0 0 0 5.5-5.5v-6.5c.96.7 2.1 1.1 3.3 1.1h.2V8.5c-1.1 0-2-.4-2.8-1.1z"/>
        </svg>
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm0 18.23c-1.5 0-2.96-.4-4.23-1.11l-.3-.18-3.12.82.83-3.04-.2-.31c-.78-1.31-1.19-2.81-1.19-4.34 0-4.6 3.74-8.34 8.34-8.34 4.6 0 8.34 3.74 8.34 8.34 0 4.6-3.74 8.34-8.34 8.34zm4.56-6.25c-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.12-.16.24-.63.81-.77.98-.14.17-.28.19-.53.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.02-.47-.02-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.57.18 1.09.15 1.5.09.46-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.11-.22-.18-.47-.3z"/>
          </svg>
        </a>
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
        <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <Send className="w-4 h-4" />
        </a>
      </Button>

      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={copyLink} aria-label="Copy link">
        <LinkIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}