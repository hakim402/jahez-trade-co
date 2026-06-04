// app/[locale]/page.tsx
import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Header } from "./_components/Header/Header";
import Pricing from "./_components/Pricing/Pricing";
import { FeatureSections } from "./_components/Features/FeaturesSection";
import { VideoBookingSections } from "./_components/Features/VideoBookingSection";
import { HomeHero } from "./_components/Hero/HomeHero";
import { HowItWorks } from "./_components/HowItWork/HowItWorks";
import { FooterSection } from "./_components/Footer/FooterSection";
import { TrendingProductsSection } from "./(pages)/products/_components/TrendingProductsSection";
import { FooterHero } from "./_components/Footer/FooterHero";
import { HowWeOperate } from "./(pages)/about/_components/HowWeOperate";
import { MissionValues } from "./(pages)/about/_components/MissionValues";
import { ServicesShowcase } from "./(pages)/services/_components/ServicesShowcase";
import HomeBlogShowCase from "./(pages)/blogs/_components/HomeBlogShowCase";
import { EmailAddress } from "@clerk/nextjs/server";
import EmployeeShowcase from "./_components/Employees/EmployeeShowcase";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = "https://jahez.online";

  const title =
    locale === "ar"
      ? "جاهز - متتبع منتجاتك الشخصية"
      : "JAHEZ - Your Personal Products Tracker";

  const description =
    locale === "ar"
      ? "جاهز هو تطبيق ويب متطور يساعدك على تتبع وإدارة منتجاتك المفضلة بسهولة. اكتشف المنتجات الرائجة واحصل على تحديثات فورية."
      : "JAHEZ is a cutting-edge web application designed to help you effortlessly track and manage your favorite products. Discover trending items and get real‑time updates.";

  const alternates = {
    canonical: `${baseUrl}/${locale}`,
    languages: {
      en: `${baseUrl}/en`,
      ar: `${baseUrl}/ar`,
    },
  };

  // Optional: Add a homepage-specific image
  const ogImage = {
    url: `${baseUrl}/images/home-og.jpg`, // Update with actual path
    width: 1200,
    height: 630,
    alt: locale === "ar" ? "جاهز - تتبع منتجاتك" : "JAHEZ - Track Your Products",
  };

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: locale === "ar" ? "جاهز" : "JAHEZ",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage,
    },
  };
}

export default async function Home() {
  const locale = await getLocale();
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
        heading={isAr ? 'خدماتنا' : 'Our Services'}
        subheading={isAr ? 'نقدم حلولاً مبتكرة وموثوقة وقابلة للتطوير، مصممة لتلبية احتياجات أعمالك ودفع نمو مستدام.' : 'We deliver innovative, reliable, and scalable solutions tailored to meet your business needs and drive sustainable growth.'}
      />
      <EmployeeShowcase locale={locale as 'en' | 'ar'} />
      <FooterHero />
      <FooterSection />
    </div>
  );
}