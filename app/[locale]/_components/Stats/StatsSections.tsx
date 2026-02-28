import { Clock, MapPin, Users, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function StatsSection() {
  const t = await getTranslations("StatsSection");

  // Get stats array from translations
  const stats = [
    {
      value: t("stats.0.value"),
      label: t("stats.0.label"),
      description: t("stats.0.description"),
      icon: Clock,
    },
    {
      value: t("stats.1.value"),
      label: t("stats.1.label"),
      description: t("stats.1.description"),
      icon: MapPin,
    },
    {
      value: t("stats.2.value"),
      label: t("stats.2.label"),
      description: t("stats.2.description"),
      icon: Users,
    },
    {
      value: t("stats.3.value"),
      label: t("stats.3.label"),
      description: t("stats.3.description"),
      icon: TrendingUp,
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-neutral-950">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />

      {/* Gradient orbs for depth */}
      <div className="absolute top-0 -left-20 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />

      <div className="container relative mx-auto max-w-8xl px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold tracking-wider uppercase text-brand">
            {t("sectionSubtitle")}
          </span>
          <h2 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
            {t("sectionTitle")}
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative flex flex-col items-center text-center"
              >
                {/* Icon with glow */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full orb-brand opacity-20 transition-opacity group-hover:opacity-30" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                    <Icon className="h-8 w-8 text-brand transition-transform group-hover:scale-110" />
                  </div>
                </div>

                {/* Value */}
                <div className="text-5xl font-bold tracking-tight text-brand">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.label}
                </div>

                {/* Description */}
                {stat.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </p>
                )}

                {/* Animated underline on hover */}
                <div className="mt-4 h-0.5 w-12 rounded-full bg-brand transition-all duration-300 group-hover:w-20" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}