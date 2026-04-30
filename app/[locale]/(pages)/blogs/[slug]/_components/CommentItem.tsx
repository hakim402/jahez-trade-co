// app/[locale]/(pages)/blogs/[slug]/_components/CommentItem.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ThumbsUp, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { CommentForm } from "./CommentForm";
import type { PublicComment } from "../../actions";

interface CommentItemProps {
  comment: PublicComment;
  postId: string;
  isAr: boolean;
  onReply: (content: string, parentId: string) => Promise<void>;
  onToggleReaction: (commentId: string, type: "LIKE" | "DISLIKE") => Promise<void>;
}

export function CommentItem({ comment, postId, isAr, onReply, onToggleReaction }: CommentItemProps) {
  const { userId, isSignedIn } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localReactionCount, setLocalReactionCount] = useState(comment.reactionCount);
  const [localMyReaction, setLocalMyReaction] = useState(comment.myReaction);

  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!isSignedIn) {
      toast.error(isAr ? "تسجيل الدخول مطلوب" : "Login required");
      return;
    }
    await onToggleReaction(comment.id, type);
    // Optimistic update (will be re‑fetched by parent on success, but we do local to be responsive)
    setLocalMyReaction(localMyReaction === type ? null : type);
    setLocalReactionCount((prev) =>
      localMyReaction === type ? prev - 1 : localMyReaction === null ? prev + 1 : prev
    );
  };

  const handleReply = async (content: string) => {
    if (!isSignedIn) return;
    setSubmitting(true);
    await onReply(content, comment.id);
    setShowReplyForm(false);
    setSubmitting(false);
  };

  return (
    <div className="border-l-2 border-color/30 pl-4 ml-2">
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{comment.author.fullName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: isAr ? ar : enUS,
                })}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 text-xs ${localMyReaction === "LIKE" ? "text-color" : ""}`}
                onClick={() => handleReaction("LIKE")}
              >
                <ThumbsUp className="w-3 h-3" /> {localReactionCount}
              </Button>
              {isSignedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <Reply className="w-3 h-3" /> {isAr ? "رد" : "Reply"}
                </Button>
              )}
            </div>
          </div>
        </div>
        {showReplyForm && (
          <div className="mt-3 ml-6">
            <CommentForm
              onSubmit={handleReply}
              isAr={isAr}
              submitLabel={isAr ? "إرسال الرد" : "Post reply"}
              placeholder={isAr ? "اكتب ردك..." : "Write your reply..."}
              submitting={submitting}
            />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                isAr={isAr}
                onReply={onReply}
                onToggleReaction={onToggleReaction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}