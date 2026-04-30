import { Eye, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactionButtons } from "./ReactionButtons";

interface PostMetaProps {
  post: any;
  isAr: boolean;
}

export function PostMeta({ post, isAr }: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-4 mb-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" /> {Math.floor(Math.random() * 1000) + 100} views
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4" /> {post.reactionCounts?.LIKE + post.reactionCounts?.DISLIKE || 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" /> {post.commentCount || 0} comments
        </span>
      </div>
      <ReactionButtons postId={post.id} initialCounts={post.reactionCounts} isAr={isAr} />
    </div>
  );
}