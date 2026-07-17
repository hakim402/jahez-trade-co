"use client";

// app/[locale]/(pages)/blogs/[slug]/_components/PostContent.tsx

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PostContentProps {
  content: string;
  isAr: boolean;
}

export function PostContent({ content, isAr }: PostContentProps) {
  const [decoded, setDecoded] = useState<string>("");

  useEffect(() => {
    if (!content) return;

    // Decode HTML entities (supports &lt; &gt; &amp; &quot; etc.)
    const decodeHtml = (html: string): string => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.documentElement.textContent ?? html;
    };

    // Also try a more direct approach using a textarea
    const decodeWithTextarea = (html: string): string => {
      const txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    };

    // Try both methods; prefer the textarea method
    let result = decodeWithTextarea(content);
    // If still looks like HTML entities, decode again
    if (result.includes("&lt;") || result.includes("&gt;")) {
      result = decodeWithTextarea(result);
    }
    setDecoded(result);
  }, [content]);

  if (!decoded) return null;

  return (
    <div
      className={cn(
        "prose prose-lg dark:prose-invert max-w-none",
        isAr && "prose-rtl"
      )}
      dangerouslySetInnerHTML={{ __html: decoded }}
      dir={isAr ? "rtl" : "ltr"}
    />
  );
}