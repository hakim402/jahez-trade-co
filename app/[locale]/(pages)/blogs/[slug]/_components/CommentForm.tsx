// app/[locale]/(pages)/blogs/[slug]/_components/CommentForm.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isAr: boolean;
  submitLabel?: string;
  placeholder?: string;
  submitting?: boolean;
}

export function CommentForm({ onSubmit, isAr, submitLabel, placeholder, submitting: externalSubmitting }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const isSubmitting = externalSubmitting ?? internalSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setInternalSubmitting(true);
    await onSubmit(content);
    setContent("");
    setInternalSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || (isAr ? "اكتب تعليقك..." : "Write your comment...")}
        rows={3}
        className="resize-none"
      />
      <Button type="submit" disabled={isSubmitting || !content.trim()} className="bg-color hover:bg-color/90">
        {submitLabel || (isAr ? "إرسال التعليق" : "Post comment")}
      </Button>
    </form>
  );
}