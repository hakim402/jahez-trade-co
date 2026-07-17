// app/[locale]/(pages)/blogs/[slug]/_components/PostMeta.tsx

import { Eye, Heart, MessageCircle } from "lucide-react";
import type { PublicPostDetail } from "../../actions";
import { ReactionButtons } from "./ReactionButtons";

interface PostMetaProps {
  post: PublicPostDetail;
  isAr: boolean;
}

export function PostMeta({ post, isAr }: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-4 mb-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" /> {post.viewCount}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4" /> {post.reactionCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" /> {post.commentCount}
        </span>
      </div>
      <ReactionButtons
        postId={post.id}
        initialLikes={post.reactionCount}
        initialMyReaction={post.myReaction}
        isAr={isAr}
      />
    </div>
  );
}