// app/[locale]/(pages)/blogs/[slug]/_components/CommentsSection.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { getPostComments, createComment, toggleCommentReaction } from "../../actions";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { PublicComment } from "../../actions";

interface CommentsSectionProps {
  postId: string;
  isAr: boolean;
}

export function CommentsSection({ postId, isAr }: CommentsSectionProps) {
  const { isSignedIn } = useAuth();
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(
    async (p: number, append = false) => {
      setLoading(true);
      const result = await getPostComments({ postId, page: p, limit: 10, sortOrder: "desc" });
      if (result.success) {
        const newComments = result.data.comments;
        if (append) {
          setComments((prev) => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }
        setHasNext(result.data.hasNext);
        setPage(result.data.page);
      }
      setLoading(false);
    },
    [postId]
  );

  useEffect(() => {
    loadComments(1);
  }, [loadComments]);

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!isSignedIn) return;
    setSubmitting(true);
    const result = await createComment({ postId, content, parentId, locale: isAr ? "ar" : "en" });
    if (result.success) {
      // Reload comments to show the new one (or optimistically insert – we'll reload for simplicity)
      await loadComments(1);
    }
    setSubmitting(false);
  };

  const handleToggleReaction = async (commentId: string, type: "LIKE" | "DISLIKE") => {
    const result = await toggleCommentReaction(commentId, type);
    if (result.success) {
      // Update the comment's reaction count and myReaction in the local state
      const updateCommentReactions = (commentsList: PublicComment[]): PublicComment[] =>
        commentsList.map((c: PublicComment) => {
          if (c.id === commentId) {
            return {
              ...c,
              reactionCount: result.data.total,
              myReaction: result.data.myReaction,
            };
          }
          if (c.replies?.length) {
            return { ...c, replies: updateCommentReactions(c.replies) };
          }
          return c;
        });
      setComments(updateCommentReactions(comments));
    }
  };

  return (
    <div className="mt-16 border-t border-border/40 pt-8">
      <h2 className="text-2xl font-bold mb-6">
        {isAr ? "التعليقات" : "Comments"} ({comments.length})
      </h2>

      {isSignedIn ? (
        <CommentForm onSubmit={handleAddComment} isAr={isAr} />
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          {isAr ? "يرجى تسجيل الدخول لإضافة تعليق." : "Please sign in to leave a comment."}
        </p>
      )}

      <div className="space-y-6 mt-8">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            isAr={isAr}
            onReply={handleAddComment}
            onToggleReaction={handleToggleReaction}
          />
        ))}
      </div>

      {hasNext && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => loadComments(page + 1, true)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isAr ? "تحميل المزيد" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}