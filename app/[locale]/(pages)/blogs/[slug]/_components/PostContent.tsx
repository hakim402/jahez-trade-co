"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils"; 

interface PostContentProps {
  content: string;
  isAr: boolean;
}

export function PostContent({ content, isAr }: PostContentProps) {
  // You might want to sanitize HTML (e.g., using DOMPurify) for security
  // For now, assume content is safe (coming from your admin panel)
  return (
    <div
      className={cn(
        "prose prose-lg dark:prose-invert max-w-none",
        isAr && "prose-rtl"
      )}
      dangerouslySetInnerHTML={{ __html: content }}
      dir={isAr ? "rtl" : "ltr"}
    />
  );
}

// Add these global styles to your globals.css for proper rich text rendering
/*
.prose h1 { @apply text-3xl font-bold mt-8 mb-4; }
.prose h2 { @apply text-2xl font-bold mt-6 mb-3; }
.prose h3 { @apply text-xl font-semibold mt-5 mb-2; }
.prose p { @apply mb-4 leading-relaxed; }
.prose a { @apply text-color no-underline hover:underline; }
.prose img { @apply rounded-lg my-6; }
.prose ul, .prose ol { @apply my-4 pl-6; }
.prose li { @apply mb-1; }
.prose blockquote { @apply border-l-4 border-color pl-4 italic my-4; }
.prose code { @apply bg-muted px-1 py-0.5 rounded text-sm; }
.prose pre { @apply bg-muted p-4 rounded-lg overflow-x-auto text-sm; }
.prose-rtl { direction: rtl; text-align: right; }
.prose-rtl blockquote { border-left: none; border-right: 4px solid var(--brand); padding-left: 0; padding-right: 1rem; }
*/