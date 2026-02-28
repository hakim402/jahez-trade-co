"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";
import Image, { StaticImageData } from "next/image";

type BadgeItem = {
  label: string; // Translated string from parent
  icon: ReactNode;
};

type HeroProps = {
  title: string;           // Translated string
  highlight: string;       // Translated string
  description: string;     // Translated string
  badges?: BadgeItem[];
  primaryButton?: {
    label: string;         // Translated string
    href: string;
  };
  secondaryButton?: {
    label: string;         // Translated string
    href: string;
  };
  image?: string | StaticImageData;
};

export default function Hero({
  title,
  highlight,
  description,
  badges = [],
  primaryButton,
  secondaryButton,
  image,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden py-20 px-4 md:py-28 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/30">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 dark:opacity-20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-linear-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-linear-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="px-4 py-2 text-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
                >
                  {badge.icon}
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight">
            {title} <span className="text-color">{highlight}</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
            {description}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {primaryButton && (
              <Button
                asChild
                size="lg"
                className="bg-color hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-8"
              >
                <Link href={primaryButton.href}>
                  {primaryButton.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            {secondaryButton && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-8"
              >
                <Link href={secondaryButton.href}>{secondaryButton.label}</Link>
              </Button>
            )}
          </div>

          {image && (
            <div className="relative w-full max-w-5xl mx-auto">
              <Image
                src={image}
                alt="Hero Image"
                width={800}
                height={300}
                className="object-contain mx-auto rounded-4xl"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}