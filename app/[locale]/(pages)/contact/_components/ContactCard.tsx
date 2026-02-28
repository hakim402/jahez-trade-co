"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function ContactCard() {
  const t = useTranslations("ContactPage.contactCard");

  return (
    <section className="px-6">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />

      {/* Gradient orbs for depth */}
      <div className="absolute top-0 -left-20 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="space-y-4 px-6 md:px-0">
        <Badge
          variant="outline"
          className="border-brand/30 bg-background/50 backdrop-blur-sm px-4 py-2 text-brand"
        >
          <MessageSquare className="w-4 h-4 mr-2 text-brand" />
          {t("badge")}
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold dark:text-white">
          {t("title")}{" "}
          <span className="text-brand">{t("titleHighlight")}</span>
        </h2>
        <p className="text-lg text-muted-foreground">{t("description")}</p>
      </div>

      {/* Contact Info Cards */}
      <div className="grid sm:grid-cols-3 gap-4 px-6 md:px-0">
        <Card className="group bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <CardContent className="p-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full orb-brand opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-brand" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 dark:text-white">{t("visitUs")}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {t("address")}
            </p>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
          </CardContent>
        </Card>

        <Card className="group bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <CardContent className="p-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full orb-brand opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-brand" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 dark:text-white">{t("callUs")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("phone")}
              <br />
              {t("hours")}
            </p>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
          </CardContent>
        </Card>

        <Card className="group bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <CardContent className="p-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full orb-brand opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-brand" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 dark:text-white">{t("emailUs")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("email1")}
              <br />
              {t("email2")}
            </p>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}