import { getPublishedPosts } from "@/app/[locale]/(pages)/blogs/actions";
import HomeBlogShowCaseClient from "./HomeBlogShowCaseClient";

export default async function HomeBlogShowCase({
  locale,
}: {
  locale?: "en" | "ar";
}) {

  const safeLocale = (locale === "en" || locale === "ar") ? locale : "ar";

  const result = await getPublishedPosts({
    locale: safeLocale,
    page: 1,
    limit: 7,
  });

  return (
    <HomeBlogShowCaseClient
      initialPosts={result.success ? result.data.posts : []}
      initialError={result.success ? null : result.error}
    />
  );
}