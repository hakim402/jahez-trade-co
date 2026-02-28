"use client";

import Link from "next/link";
import {
  Package,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function FooterSection() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  // Define link structures using translation keys
  const servicesLinks = [
    { key: "productSourcing", href: "/product-request" },
    { key: "videoBooking", href: "/video-booking" },
    { key: "pricingPlans", href: "/pricing" },
    { key: "qualityChecks", href: "/how-it-works" },
  ];

  const companyLinks = [
    { key: "aboutUs", href: "/about" },
    { key: "howItWorks", href: "/how-it-works" },
    { key: "contact", href: "/contact" },
    { key: "testimonials", href: "/about" },
  ];

  const supportLinks = [
    { key: "helpCenter", href: "/contact" },
    { key: "privacyPolicy", href: "#" },
    { key: "termsOfService", href: "#" },
    { key: "faq", href: "/how-it-works" },
  ];

  return (
    <footer className="relative overflow-hidden bg-white dark:bg-neutral-950 border-t border-border/50">
      {/* Background with animated blobs (unique to footer) */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/30">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 dark:opacity-20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-linear-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-linear-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="group">
              <div className="transition-transform group-hover:scale-110">
                <Image
                  src={"/logo/mewan.jpg"}
                  alt="Mewan Logo"
                  width={160}
                  height={100}
                />
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              {t("brand.description")}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-brand" />
                <span>hakimsafi402@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-brand" />
                <span>{t("brand.phone")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-brand" />
                <span>{t("brand.address")}</span>
              </div>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="font-semibold text-foreground dark:text-white mb-4">
              {t("columns.services.title")}
            </h3>
            <ul className="space-y-3">
              {servicesLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-brand transition-colors"
                  >
                    {t(`columns.services.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-foreground dark:text-white mb-4">
              {t("columns.company.title")}
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-brand transition-colors"
                  >
                    {t(`columns.company.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-semibold text-foreground dark:text-white mb-4">
              {t("columns.support.title")}
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-brand transition-colors"
                  >
                    {t(`columns.support.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("copyrightWithYear", {
              year: currentYear,
              rights: t("copyright")
            })}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-muted-foreground hover:text-brand transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-brand transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-brand transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-brand transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}