// app/[locale]/(pages)/blogs/[slug]/_components/PostVideo.tsx

"use client";

import type { PublicPostDetail } from "../../actions";

interface PostVideoProps {
  videos: PublicPostDetail["videos"];
  isAr: boolean;
  title?: string;
}

export function PostVideo({ videos, isAr, title }: PostVideoProps) {
  if (!videos.length) return null;

  const [firstVideo, ...restVideos] = videos;

  return (
    <div className="w-full my-12">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
          {title || (isAr ? "فيديوهات" : "Videos")}
        </h2>
      )}

      {/* First video – full width */}
      <div className="mb-8">
        <div className="relative pt-[56.25%] rounded-xl overflow-hidden bg-muted/20 shadow-lg">
          <iframe
            src={firstVideo.url}
            title={isAr ? "الفيديو الرئيسي" : "Main video"}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>

      {/* Additional videos – responsive grid (2 columns on mobile, 3 on desktop) */}
      {restVideos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restVideos.map((video, idx) => (
            <div key={video.id} className="w-full">
              <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-muted/20 shadow-md hover:shadow-lg transition-shadow duration-200">
                <iframe
                  src={video.url}
                  title={`Video ${idx + 2}`}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}