"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import Carousel from "../Carousel/carousel"; // Ensure this path points to your new carousel
import { useTranslations } from "next-intl";

export type Testimonial = {
  id: number | string;
  name: string;
  company: string;
  rating: number; // 1-5
  content: string;
};

type TestimonialsProps = {
  testimonials?: Testimonial[]; // optional – uses static fallback if not provided
};

export default function Testimonials({ testimonials: propTestimonials }: TestimonialsProps) {
  const t = useTranslations("Testimonials");

  // Static fallback data (English only for demo)
  const staticTestimonials: Testimonial[] = [
    {
      id: 1,
      name: "Alice Johnson",
      company: "Global Imports Co.",
      rating: 5,
      content:
        "Mewan Trading helped us source high-quality products from China efficiently. Their team is responsive and reliable.",
    },
    {
      id: 2,
      name: "Michael Lee",
      company: "Tech Supplies Ltd.",
      rating: 4,
      content:
        "Great experience working with Mewan Trading. They handled our bulk orders smoothly and the quality was top-notch.",
    },
    {
      id: 3,
      name: "Sofia Martinez",
      company: "Fashion Forward Inc.",
      rating: 5,
      content:
        "Their sourcing expertise saved us time and money. The team is professional and always available for queries.",
    },
    {
      id: 4,
      name: "David Kim",
      company: "ElectroWorld",
      rating: 4,
      content:
        "Reliable and trustworthy sourcing partner. Mewan Trading made the import process seamless for our electronics business.",
    },
    {
      id: 5,
      name: "Linda Chen",
      company: "Home Essentials Ltd.",
      rating: 5,
      content:
        "Fantastic sourcing experience! The team provided quick quotations and delivered exactly what we needed.",
    },
    {
      id: 6,
      name: "Raj Patel",
      company: "Global Gadgets Inc.",
      rating: 4,
      content:
        "Very professional service and excellent communication. They helped us navigate sourcing challenges efficiently.",
    },
    {
      id: 7,
      name: "Emma Williams",
      company: "Luxury Apparel Co.",
      rating: 5,
      content:
        "The quality of products is outstanding and the sourcing process was transparent. Highly recommended!",
    },
    {
      id: 8,
      name: "Carlos Ramirez",
      company: "Office Supplies Corp.",
      rating: 4,
      content:
        "Smooth and reliable sourcing. The team always answers questions quickly and ensures timely delivery.",
    },
  ];

  const testimonials = propTestimonials || staticTestimonials;

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-neutral-950">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />

      {/* Gradient orbs */}
      <div className="absolute top-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />

      <div className="container relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold tracking-wider uppercase text-brand">
            {t("subtitle")}
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold dark:text-white">
            {t("title")} <span className="text-brand">{t("titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            {t("description")}
          </p>
        </div>

        {/* Carousel for testimonials */}
        <Carousel
          autoplay
          autoplayDelay={4000}
          showDots={true}
          itemClassName="basis-full sm:basis-1/2 lg:basis-1/3 px-2"
          opts={{ loop: true }}
        >
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="group relative bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <CardContent className="p-6 flex flex-col h-full">
                {/* Star ratings */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Testimonial content */}
                <p className="text-sm text-muted-foreground flex-1 mb-4 leading-relaxed">
                  {testimonial.content.length > 100
                    ? testimonial.content.slice(0, 100) + "..."
                    : testimonial.content}
                </p>

                {/* Author info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full orb-brand opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="relative w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-brand">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.company}
                    </div>
                  </div>
                </div>

                {/* Decorative hover line */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
              </CardContent>
            </Card>
          ))}
        </Carousel>
      </div>
    </section>
  );
}