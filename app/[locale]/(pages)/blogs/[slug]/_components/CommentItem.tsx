"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ThumbsUp, ThumbsDown, Trash2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleCommentReaction, softDeleteComment } from "../../actions";
import { CommentForm } from "./CommentForm";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";

export function CommentItem({ comment, postId, isAr, onReply }: any) {
  const { userId, isSignedIn } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [reactionCounts, setReactionCounts] = useState(comment._count?.reactions || { LIKE: 0, DISLIKE: 0 });
  const [userReaction, setUserReaction] = useState(null);

  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!isSignedIn) return toast.error(isAr ? "تسجيل الدخول مطلوب" : "Login required");
    const result = await toggleCommentReaction({ commentId: comment.id, type, locale: isAr ? "ar" : "en" });
    if (result.success) {
      setReactionCounts(result.data.reactionCounts);
      setUserReaction(result.data.userReaction);
    }
  };

  const handleDelete = async () => {
    if (!confirm(isAr ? "هل أنت متأكد؟" : "Are you sure?")) return;
    const result = await softDeleteComment({ commentId: comment.id, locale: isAr ? "ar" : "en" });
    if (result.success) {
      toast.success(isAr ? "تم الحذف" : "Deleted");
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  const canDelete = userId === comment.authorId || comment.author?.role === "ADMIN";

  return (
    <div className="border-l-2 border-color/30 pl-4 ml-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.author?.fullName || "Anonymous"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: isAr ? ar : enUS })}
            </span>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleReaction("LIKE")}>
              <ThumbsUp className="w-3 h-3" /> {reactionCounts.LIKE}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleReaction("DISLIKE")}>
              <ThumbsDown className="w-3 h-3" /> {reactionCounts.DISLIKE}
            </Button>
            {isSignedIn && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowReplyForm(!showReplyForm)}>
                <Reply className="w-3 h-3" /> {isAr ? "رد" : "Reply"}
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive" onClick={handleDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          {showReplyForm && (
            <div className="mt-3 ml-6">
              <CommentForm onSubmit={(content) => onReply(content, comment.id)} isAr={isAr} submitLabel={isAr ? "إرسال الرد" : "Post reply"} />
            </div>
          )}
        </div>
      </div>
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply: any) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} isAr={isAr} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}