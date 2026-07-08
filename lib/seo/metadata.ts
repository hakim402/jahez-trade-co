import { Metadata } from 'next';
import { SeoMetadataOptions, Locale, TargetCountry } from './types';
import { getAlternates } from './alternates';

// ─── KEYWORD MATRIX ──────────────────────────────────────────────
const baseKeywords: Record<Locale, string[]> = {
  en: [
    'China sourcing agent',
    'trading company in China',
    'wholesale import from China',
    'China procurement services',
    'reliable China supplier',
  ],
  ar: [
    'مصادر الصين',
    'شركة تجارية في الصين',
    'استيراد بالجملة من الصين',
    'خدمات المشتريات من الصين',
    'مورد موثوق في الصين',
  ],
};

const geoKeywords: Record<TargetCountry, Record<Locale, string[]>> = {
  GLOBAL: {
    en: ['international trade', 'global supply chain', 'import export'],
    ar: ['تجارة دولية', 'سلسلة توريد عالمية', 'استيراد وتصدير'],
  },
  USA: {
    en: ['import from China to USA', 'China to Amazon FBA', 'US customs clearance'],
    ar: ['استيراد من الصين إلى أمريكا', 'الشحن إلى أمازون', 'التخليص الجمركي الأمريكي'],
  },
  UAE: {
    en: ['sourcing China to Dubai', 'Jebel Ali shipping', 'UAE trading license'],
    ar: ['مصادر الصين إلى دبي', 'شحن جبل علي', 'رخصة تجارة الإمارات'],
  },
  DUBAI: {
    en: ['Dubai re-export', 'China to Dubai logistics', 'Dubai procurement'],
    ar: ['إعادة التصدير دبي', 'لوجستيات الصين إلى دبي', 'مشتريات دبي'],
  },
  YEMEN: {
    en: ['trusted China partner Yemen', 'construction materials China', 'humanitarian goods China to Aden'],
    ar: ['شريك صيني موثوق لليمن', 'مواد بناء من الصين', 'بضائع إنسانية من الصين إلى عدن'],
  },
};

const pageKeywords: Record<string, Record<Locale, string[]>> = {
  home: {
    en: ['end-to-end supply chain', 'B2B sourcing', 'China wholesale'],
    ar: ['سلسلة توريد متكاملة', 'مصادر B2B', 'بيع الجملة في الصين'],
  },
  about: {
    en: ['company history', 'global trading partner'],
    ar: ['تاريخ الشركة', 'شريك تجاري عالمي'],
  },
  service: {
    en: ['factory audit', 'quality control', 'freight forwarding', 'OEM manufacturing'],
    ar: ['تدقيق المصانع', 'مراقبة الجودة', 'شحن بحري وجوي', 'تصنيع حسب الطلب'],
  },
  product: {
    en: ['bulk order', 'product customization', 'MOQ negotiation'],
    ar: ['طلب بالجملة', 'تخصيص المنتج', 'تفاوض على الكميات الدنيا'],
  },
  blog: {
    en: ['China trade insights', 'import guides', 'sourcing tips'],
    ar: ['رؤى التجارة الصينية', 'أدلة الاستيراد', 'نصائح التوريد'],
  },
  contact: {
    en: ['contact sourcing agent', 'get import quote'],
    ar: ['اتصل بوكيل التوريد', 'احصل على عرض سعر'],
  },
};

// ─── BILINGUAL TITLES & DESCRIPTIONS ──────────────────────────
const localizedMeta: Record<
  string,
  { en: { title: string; description: string }; ar: { title: string; description: string } }
> = {
  home: {
    en: {
      title: 'JAHEZ TRADE CO | China Sourcing & Import Services',
      description:
        'Expert China sourcing agent serving USA, UAE, Dubai, and Yemen. Full procurement, quality control, and shipping solutions.',
    },
    ar: {
      title: 'جاهز | خدمات التوريد والاستيراد من الصين',
      description:
        'وكيل مصادر خبير في الصين يخدم الولايات المتحدة والإمارات ودبي واليمن. حلول مشتريات ومراقبة جودة وشحن كاملة.',
    },
  },
  about: {
    en: {
      title: 'About Us | Trusted China Trading Partner',
      description:
        'Learn about JAHEZ TRADE CO, a leading trading company in China delivering reliable supply chain solutions across the Middle East and America.',
    },
    ar: {
      title: 'من نحن | شريك تجاري موثوق في الصين',
      description:
        'تعرف على شركة جاهز، شركة تجارية رائدة في الصين تقدم حلول سلسلة توريد موثوقة في الشرق الأوسط وأمريكا.',
    },
  },
  service: {
    en: {
      title: 'Sourcing & Logistics Services | China to USA, UAE, Yemen',
      description:
        'End-to-end services: factory audits, product customization, freight forwarding, and customs clearance from China to your doorstep.',
    },
    ar: {
      title: 'خدمات التوريد واللوجستيات | من الصين إلى أمريكا والإمارات واليمن',
      description:
        'خدمات شاملة: تدقيق المصانع، تخصيص المنتجات، الشحن، والتخليص الجمركي من الصين إلى عتبة بابك.',
    },
  },
  product: {
    en: {
      title: 'Bulk Products & OEM Manufacturing from China',
      description:
        'Source high-quality products with low MOQs from China. Custom OEM/ODM manufacturing tailored for your market.',
    },
    ar: {
      title: 'منتجات بالجملة وتصنيع حسب الطلب من الصين',
      description:
        'مصادر منتجات عالية الجودة بكميات دنيا من الصين. تصنيع حسب الطلب مخصص لسوقك.',
    },
  },
  blog: {
    en: {
      title: 'Import & Sourcing Insights | China Trade Blog',
      description:
        'Expert guides on importing from China, trade compliance, shipping costs, and supplier negotiation strategies.',
    },
    ar: {
      title: 'مدونة الاستيراد والتوريد | رؤى التجارة الصينية',
      description:
        'أدلة خبراء حول الاستيراد من الصين، الامتثال التجاري، تكاليف الشحن، واستراتيجيات التفاوض مع الموردين.',
    },
  },
  contact: {
    en: {
      title: 'Contact Us | Get a Quote for China Sourcing',
      description:
        'Reach out to our China sourcing experts for a free consultation on your next import project.',
    },
    ar: {
      title: 'اتصل بنا | احصل على عرض سعر للتوريد من الصين',
      description:
        'تواصل مع خبراء التوريد لدينا في الصين للحصول على استشارة مجانية لمشروع الاستيراد القادم.',
    },
  },
};

// ─── EXPORT FUNCTION ──────────────────────────────────────────
export function generatePageMetadata(options: SeoMetadataOptions): Metadata {
  const {
    pageType,
    locale,
    country = 'GLOBAL',
    pathSegment,
    customTitle,
    customDescription,
    ogImageUrl,
    ogImageAlt,
    publishedDate,
    modifiedDate,
    authorName,
  } = options;

  // 1. Base Localized Meta
  const metaData = localizedMeta[pageType] || localizedMeta.home;
  const localeMeta = metaData[locale as Locale] || metaData.en;

  let title = customTitle || localeMeta.title;
  let description = customDescription || localeMeta.description;

  // Append country suffix for English
  if (locale === 'en' && country !== 'GLOBAL' && !customTitle) {
    title = `${title} | Serving ${country}`;
  }
  if (locale === 'en' && country !== 'GLOBAL' && !customDescription) {
    description = `${description} Specializing in ${country} imports.`;
  }

  // Append Arabic suffix
  if (locale === 'ar' && country !== 'GLOBAL' && !customTitle) {
    const countryMap: Record<TargetCountry, string> = {
      GLOBAL: 'العالم',
      USA: 'أمريكا',
      UAE: 'الإمارات',
      DUBAI: 'دبي',
      YEMEN: 'اليمن',
    };
    title = `${title} - خدمة ${countryMap[country]}`;
  }

  // 2. Build Keywords
  const baseList = baseKeywords[locale] || baseKeywords.en;
  const pageList = pageKeywords[pageType]?.[locale] || pageKeywords[pageType]?.en || [];
  const geoList = geoKeywords[country]?.[locale] || geoKeywords[country]?.en || [];
  const combined = [...baseList, ...pageList, ...geoList];
  const uniqueKeywords = [...new Set(combined)].slice(0, 20).join(', ');

  // 3. Image
  const defaultOg = `https://jahez.online/images/home-og.jpg`;
  const imageUrl = ogImageUrl || defaultOg;
  const imageAlt = ogImageAlt || title;

  // 4. Return Metadata
  return {
    title: {
      absolute: title,
      template: `%s | JAHEZ TRADE CO`,
    },
    description,
    keywords: uniqueKeywords,
    alternates: getAlternates({ locale, pathSegment }),
    openGraph: {
      title,
      description,
      url: `https://jahez.online/${locale}${pathSegment ? `/${pathSegment}` : ''}`,
      siteName: locale === 'ar' ? 'جاهز' : 'JAHEZ TRADE CO',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      type: pageType === 'blog' ? 'article' : 'website',
      ...(publishedDate && { publishedTime: publishedDate }),
      ...(modifiedDate && { modifiedTime: modifiedDate }),
      ...(authorName && { authors: [authorName] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
    verification: {
      google: 'nZi9ngdAitHA46eBbJIOdPwpAQcfe7a2PRaB1R6LR68',
    },
  };
}