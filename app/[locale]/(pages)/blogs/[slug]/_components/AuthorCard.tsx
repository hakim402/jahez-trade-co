// app/[locale]/(pages)/blogs/[slug]/_components/AuthorCard.tsx

import Image from "next/image";
import { User } from "lucide-react";

interface AuthorCardProps {
  author: { fullName: string | null; avatarUrl: string | null };
  isAr: boolean;
}

export function AuthorCard({ author, isAr }: AuthorCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
        {author.avatarUrl ? (
          <Image src={author.avatarUrl} alt={author.fullName || "Author"} width={40} height={40} className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className={isAr ? "text-right" : ""}>
        <p className="text-xs text-muted-foreground">{isAr ? "كتب بواسطة" : "Written by"}</p>
        <p className="text-sm font-medium">{author.fullName || "JAHEZ Team"}</p>
      </div>
    </div>
  );
}