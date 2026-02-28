"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ContactForm() {
  const t = useTranslations("ContactPage.contactForm");

  return (
    <section className="px-6">
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />
      <div className="absolute top-0 -left-20 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <Card className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl dark:text-white">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium dark:text-white">
                  {t("fullName")}
                </label>
                <Input
                  id="name"
                  placeholder={t("fullNamePlaceholder")}
                  className="bg-background/50 border-border focus-visible:ring-brand"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium dark:text-white">
                  {t("email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className="bg-background/50 border-border focus-visible:ring-brand"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium dark:text-white">
                {t("subject")}
              </label>
              <Input
                id="subject"
                placeholder={t("subjectPlaceholder")}
                className="bg-background/50 border-border focus-visible:ring-brand"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium dark:text-white">
                {t("message")}
              </label>
              <Textarea
                id="message"
                placeholder={t("messagePlaceholder")}
                rows={6}
                className="bg-background/50 border-border focus-visible:ring-brand resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-white shadow-lg py-6 transition-all duration-200 hover:-translate-y-0.5"
            >
              {t("submit")}
              <Send className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {t("privacy")}{" "}
              <Link href="#" className="text-brand hover:underline">
                {t("privacyLink")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}