"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isAr: boolean;
  submitLabel?: string;
  placeholder?: string;
}

export function CommentForm({ onSubmit, isAr, submitLabel, placeholder }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await onSubmit(content);
    setContent("");
    setLoading(false);
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
      <Button type="submit" disabled={loading || !content.trim()} className="bg-color hover:bg-color/90">
        {submitLabel || (isAr ? "إرسال التعليق" : "Post comment")}
      </Button>
    </form>
  );
}