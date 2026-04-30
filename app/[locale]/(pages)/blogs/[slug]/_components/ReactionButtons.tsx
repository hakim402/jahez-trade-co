"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePostReaction } from "../../actions";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReactionButtonsProps {
  postId: string;
  initialCounts: { LIKE: number; DISLIKE: number };
  isAr: boolean;
}

export function ReactionButtons({ postId, initialCounts, isAr }: ReactionButtonsProps) {
  const { isSignedIn } = useAuth();
  const [counts, setCounts] = useState(initialCounts);
  const [userReaction, setUserReaction] = useState<"LIKE" | "DISLIKE" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!isSignedIn) {
      toast.error(isAr ? "يرجى تسجيل الدخول أولاً" : "Please sign in first");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const result = await togglePostReaction({ postId, type, locale: isAr ? "ar" : "en" });
      if (result.success) {
        setCounts(result.data.reactionCounts);
        setUserReaction(result.data.userReaction);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(isAr ? "حدث خطأ" : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1", userReaction === "LIKE" && "bg-color/10 text-color border-color")}
        onClick={() => handleReaction("LIKE")}
        disabled={loading}
      >
        <ThumbsUp className="w-4 h-4" /> {counts.LIKE}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1", userReaction === "DISLIKE" && "bg-destructive/10 text-destructive border-destructive")}
        onClick={() => handleReaction("DISLIKE")}
        disabled={loading}
      >
        <ThumbsDown className="w-4 h-4" /> {counts.DISLIKE}
      </Button>
    </div>
  );
}