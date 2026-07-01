// app/[locale]/page.tsx

import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Header } from "./_components/Header/Header";
import { FeatureSections } from "./_components/Features/FeaturesSection";
import { VideoBookingSections } from "./_components/Features/VideoBookingSection";
import { HomeHero } from "./_components/Hero/HomeHero";
import { HowItWorks } from "./_components/HowItWork/HowItWorks";
import { FooterSection } from "./_components/Footer/FooterSection";
import { TrendingProductsSection } from "./_components/TrendingProducts/TrendingProductsSection";
import { FooterHero } from "./_components/Footer/FooterHero";
import { HowWeOperate } from "./(pages)/about/_components/HowWeOperate";
import { MissionValues } from "./(pages)/about/_components/MissionValues";
import { ServicesShowcase } from "./(pages)/services/_components/ServicesShowcase";
import HomeBlogShowCase from "./(pages)/blogs/_components/HomeBlogShowCase";
import EmployeeShowcase from "./_components/Employees/EmployeeShowcase";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = "https://jahez.online";
  const isAr = locale === "ar";

  const title = isAr
    ? "جاهز خدمات التوريد من الصين والاستيراد"
    : "China Product Sourcing & Import Services";

  const description = isAr
    ? "جاهز تساعدك في البحث عن المنتجات من الصين، طلب عروض الأسعار، حجز مكالمات فيديو مباشرة من الأسواق، وخدمات الاستيراد والاستشارات التجارية."
    : "Source products from China with JAHEZ TRADE CO. Request quotations, find suppliers, book live market video calls, explore trending products, and get import and business consulting services.";

  const pageUrl = `${baseUrl}/${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
        "x-default": `${baseUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: isAr ? "جاهز" : "JAHEZ",
      locale: isAr ? "ar_SA" : "en_US",
      type: "website",
      images: [
        {
          url: `${baseUrl}/images/home-og.jpg`,
          width: 1200,
          height: 630,
          alt: isAr
            ? "جاهز - خدمات التوريد من الصين"
            : "JAHEZ - China Product Sourcing Services",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/images/home-og.jpg`],
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === "ar";

  return (
    <div>
      <Header />
      <HomeHero />
      <TrendingProductsSection />
      <FeatureSections />
      <HowWeOperate isAr={isAr} locale={locale} />
      <HomeBlogShowCase />
      <VideoBookingSections />
      <MissionValues isAr={isAr} />
      <HowItWorks />
      <ServicesShowcase
        isAr={isAr}
        heading={isAr ? "خدماتنا" : "Our Services"}
        subheading={
          isAr
            ? "نقدم حلول توريد واستيراد واستشارات تجارية موثوقة لمساعدة أعمالك على النمو."
            : "We provide reliable sourcing, import, and business consulting solutions to help your business grow."
        }
      />
      <EmployeeShowcase locale={locale as "en" | "ar"} />
      <FooterHero />
      <FooterSection />
    </div>
  );
}