"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  getPublicEmployeeBySlug,
  type PublicEmployee,
  type PublicEmployeeDetail,
} from "./actions";

type Locale = "en" | "ar";

const translations = {
  en: {
    eyebrow: "Our team",
    heading: "Meet our team members",
    description:
      "Meet the talented people behind our success. Our team combines innovation, experience, and passion to deliver outstanding solutions and drive meaningful impact every day.",

    applyNow: "Join Our Team",
    contactUs: "Contact Us",
    unnamed: "Unnamed",
    close: "Close",
    noEmployees: "No team members to show yet.",
    noBio: "No biography available.",
    employeeNotFound: "Employee details not available.",
  },
  ar: {
    eyebrow: "فريقنا",
    heading: "تعرف على أعضاء فريقنا",
    description:
      "تعرّف على فريقنا المتميز الذي يجمع بين الخبرة والإبداع والشغف. نعمل معًا لتقديم أفضل الحلول وتحقيق نتائج استثنائية لعملائنا وشركائنا.",

    applyNow: "انضم إلى فريقنا",
    contactUs: "تواصل معنا",
    unnamed: "بدون اسم",
    close: "إغلاق",
    noEmployees: "لا يوجد أعضاء لعرضهم بعد.",
    noBio: "لا توجد سيرة ذاتية متاحة.",
    employeeNotFound: "تفاصيل الموظف غير متاحة.",
  },
} as const;

const SocialIcons: Record<string, ReactNode> = {
  linkedin: <span className="text-xs font-bold">in</span>,
  twitter: <span className="text-xs font-bold">𝕏</span>,
  instagram: <span className="text-xs font-bold">◎</span>,
  facebook: <span className="text-xs font-bold">f</span>,
  youtube: <span className="text-xs font-bold">▶</span>,
};

const socialFieldToIcon = {
  linkedinUrl: "linkedin",
  twitterUrl: "twitter",
  instagramUrl: "instagram",
  facebookUrl: "facebook",
  youtubeUrl: "youtube",
} as const;

export default function EmployeeShowcaseClient({
  locale = "en",
  employees,
}: {
  locale?: Locale;
  employees: PublicEmployee[];
}) {
  const t = translations[locale];
  const isRtl = locale === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicEmployeeDetail | null>(null);

  const localize = useCallback(
    (arVal: string | null, enVal: string | null) =>
      isRtl ? (arVal ?? enVal ?? "") : (enVal ?? arVal ?? ""),
    [isRtl],
  );

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      return;
    }

    getPublicEmployeeBySlug(selectedSlug)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedSlug]);

  if (!employees.length) {
    return (
      <section
        className="bg-background px-6 py-24 text-center text-muted-foreground"
        dir={dir}
      >
        {t.noEmployees}
      </section>
    );
  }

  return (
    <section className="bg-background px-6 py-20 sm:py-24" dir={dir}>
      <div className="mx-auto max-w-6xl">
        <div className={isRtl ? "text-right" : "text-left"}>
          <span className="mb-4 inline-flex items-center rounded-full border border-(--brand)/20 bg-(--brand)/10 px-3 py-1 text-xs font-semibold text-(--brand)">
            {t.eyebrow}
          </span>

          <h2 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {t.heading}
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            {t.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/contact"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-secondary px-4 text-xs font-semibold text-secondary-foreground ring-1 ring-border transition hover:bg-accent"
            >
              {t.applyNow}
              <span>{isRtl ? "←" : "→"}</span>
            </a>

            {/* <a
              href="/contact"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-(--brand) px-4 text-xs font-semibold text-white transition hover:opacity-90"
            >
              {t.contactUs}
              <span>{isRtl ? "←" : "→"}</span>
            </a> */}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-x-7 gap-y-14 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {employees.map((emp, index) => {
            const name = emp.fullName || t.unnamed;
            const image =
              emp.photoUrl || emp.avatarUrl || "/placeholder-avatar.png";
            const position = localize(emp.positionAr, emp.positionEn);
            const bio = localize(emp.shortBioAr, emp.shortBioEn);

            return (
              <motion.button
                key={emp.id}
                type="button"
                disabled={!emp.slug}
                onClick={() => emp.slug && setSelectedSlug(emp.slug)}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group text-center outline-none disabled:cursor-default"
              >
                <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-full bg-muted ring-1 ring-border transition duration-300 group-hover:scale-[1.03] sm:h-40 sm:w-40">
                  <Image
                    src={image}
                    alt={localize(emp.photoAltAr, emp.photoAltEn) || name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="160px"
                  />
                </div>

                <h3 className="mt-5 text-sm font-extrabold text-foreground">
                  {name}
                </h3>

                {position && (
                  <p className="mt-1 text-xs font-bold text-(--brand)">
                    {position}
                  </p>
                )}

                {bio && (
                  <p className="mx-auto mt-3 line-clamp-2 max-w-44 text-xs leading-6 text-muted-foreground">
                    {bio}
                  </p>
                )}

                <div className="mt-4 flex justify-center gap-3 text-muted-foreground">
                  {SocialIcons.linkedin}
                  {SocialIcons.twitter}
                  {SocialIcons.instagram}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedSlug && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedSlug(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-4xl bg-card p-8 text-card-foreground shadow-2xl"
            dir={dir}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedSlug(null)}
              className={`absolute top-5 rounded-full bg-secondary px-3 py-1.5 text-muted-foreground transition hover:text-foreground ${
                isRtl ? "left-5" : "right-5"
              }`}
              aria-label={t.close}
            >
              ✕
            </button>

            {detail ? (
              <div className="grid gap-8 md:grid-cols-[180px_1fr]">
                <div className="relative h-44 w-44 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                  <Image
                    src={
                      detail.photoUrl ||
                      detail.avatarUrl ||
                      "/placeholder-avatar.png"
                    }
                    alt={
                      localize(detail.photoAltAr, detail.photoAltEn) ||
                      detail.fullName ||
                      t.unnamed
                    }
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="176px"
                  />
                </div>

                <div className={isRtl ? "text-right" : "text-left"}>
                  <h3 className="text-3xl font-black text-foreground">
                    {detail.fullName || t.unnamed}
                  </h3>

                  <p className="mt-2 text-sm font-bold text-(--brand)">
                    {localize(detail.positionAr, detail.positionEn)}
                  </p>

                  <p className="mt-5 whitespace-pre-line text-sm leading-8 text-muted-foreground">
                    {localize(detail.bioAr, detail.bioEn) ||
                      localize(detail.shortBioAr, detail.shortBioEn) ||
                      t.noBio}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {Object.entries(socialFieldToIcon).map(([field, icon]) => {
                      const url = detail[
                        field as keyof PublicEmployeeDetail
                      ] as string | null;
                      if (!url) return null;

                      return (
                        <a
                          key={field}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-(--brand)"
                          aria-label={icon}
                        >
                          {SocialIcons[icon]}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                {t.employeeNotFound}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
