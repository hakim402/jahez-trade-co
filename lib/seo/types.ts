export type Locale = 'en' | 'ar';
export type TargetCountry = 'USA' | 'UAE' | 'DUBAI' | 'YEMEN' | 'GLOBAL';
export type PageType = 'home' | 'about' | 'service' | 'product' | 'blog' | 'contact';

export interface SeoMetadataOptions {
  pageType: PageType;
  locale: Locale;
  country?: TargetCountry;
  pathSegment?: string; // For dynamic routes: slug, id, etc.
  customTitle?: string | null;
  customDescription?: string | null;
  ogImageUrl?: string | null;
  ogImageAlt?: string | null;
  publishedDate?: string | null;
  modifiedDate?: string | null;
  authorName?: string | null;
}