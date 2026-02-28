"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BookingDialog } from "./Dialogs/BookingDialog";

export default function VideoCallTeaser() {
  const t = useTranslations("VideoBookingPage.teaser");

  return (
    <Card className="bg-linear-to-br from-brand/10 to-transparent border border-brand/20 backdrop-blur-sm mx-auto max-w-7xl px-6 mb-16">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/20 rounded-full">
            <Video className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h3 className="font-semibold text-lg dark:text-white">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <BookingDialog>
          <Button
            asChild
            className="bg-brand hover:bg-brand/90 text-white whitespace-nowrap"
          >
            <Link href="/video-booking">{t("button")}</Link>
          </Button>
        </BookingDialog>
      </CardContent>
    </Card>
  );
}