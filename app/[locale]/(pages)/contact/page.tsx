import { getLocale } from "next-intl/server";
import { ContactHero } from "./_components/ContactHero";
import { ContactForm } from "./_components/ContactForm";
import { ContactMap } from "./_components/ContactMap";
import { ContactInfo } from "./_components/ContactInfo";
import type { Metadata } from "next";
import { Header } from "../../_components/Header/Header";
import { FooterHero } from "../../_components/Footer/FooterHero";
import { FooterSection } from "../../_components/Footer/FooterSection";

export const metadata: Metadata = {
  title: "Contact Us | تواصل معنا",
  description:
    "Get in touch with the Mewan team for product sourcing, video bookings, or business consulting.",
};

export default async function ContactPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <ContactHero isAr={isAr} locale={locale} />

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 pb-20">
            {/* Left — contact info + map */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <ContactInfo isAr={isAr} locale={locale} />
              {/* <ContactMap isAr={isAr} /> */}
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3">
              <ContactForm isAr={isAr} locale={locale} />
            </div>
          </div>
          <ContactMap isAr={isAr} />
        </div>
      </section>
      <FooterHero />
      <FooterSection />
    </main>
  );
}