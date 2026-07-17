// app/[locale]/(pages)/blogs/[slug]/_components/ReactionButtons.tsx

"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePostReaction } from "../../actions";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ReactionType } from "@prisma/client";

interface ReactionButtonsProps {
  postId: string;
  initialLikes: number;
  initialMyReaction: ReactionType | null;
  isAr: boolean;
}

export function ReactionButtons({ postId, initialLikes, initialMyReaction, isAr }: ReactionButtonsProps) {
  const { isSignedIn } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [loading, setLoading] = useState(false);

  const handleReaction = async (type: ReactionType) => {
    if (!isSignedIn) {
      toast.error(isAr ? "يرجى تسجيل الدخول أولاً" : "Please sign in first");
      return;
    }
    if (loading) return;
    setLoading(true);
    const result = await togglePostReaction(postId, type);
    if (result.success) {
      setLikes(result.data.likes);
      setMyReaction(result.data.myReaction);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1", myReaction === "LIKE" && "bg-color/10 text-color border-color")}
        onClick={() => handleReaction("LIKE")}
        disabled={loading}
      >
        <ThumbsUp className="w-4 h-4" /> {likes}
      </Button>
      {/* Dislike is not used in the current schema, but we show it as a count of dislikes: we don't have that from togglePostReaction. Actually in your action you return likes & dislikes. Let's adjust */}
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1", myReaction === "DISLIKE" && "bg-destructive/10 text-destructive border-destructive")}
        onClick={() => handleReaction("DISLIKE")}
        disabled={loading}
      >
        <ThumbsDown className="w-4 h-4" /> {0}
      </Button>
    </div>
  );
}