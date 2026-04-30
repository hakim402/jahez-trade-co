"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { listComments, addComment } from "../../actions";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CommentsSectionProps {
  postId: string;
  postSlug: string;
  isAr: boolean;
}

export function CommentsSection({ postId, isAr }: CommentsSectionProps) {
  const { isSignedIn } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async (p: number, append = false) => {
    setLoading(true);
    const result = await listComments({ postId, page: p, pageSize: 10 });
    if (result.success) {
      const newComments = result.data.comments;
      if (append) {
        setComments((prev) => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }
      setHasMore(result.data.page < result.data.totalPages);
      setPage(result.data.page);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComments(1);
  }, [postId]);

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!isSignedIn) return;
    setSubmitting(true);
    const result = await addComment({ postId, content, parentId, locale: isAr ? "ar" : "en" });
    if (result.success) {
      // Reload comments to show the new one
      await loadComments(1);
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-16 border-t border-border/40 pt-8">
      <h2 className="text-2xl font-bold mb-6">{isAr ? "التعليقات" : "Comments"} ({comments.length})</h2>

      {isSignedIn ? (
        <CommentForm onSubmit={handleAddComment} isAr={isAr} submitting={submitting} />
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          {isAr ? "يرجى تسجيل الدخول لإضافة تعليق." : "Please sign in to leave a comment."}
        </p>
      )}

      <div className="space-y-6 mt-8">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} isAr={isAr} onReply={handleAddComment} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => loadComments(page + 1, true)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "تحميل المزيد" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}