import { Globe, Shield, Target, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function MissionVision() {
  const t = await getTranslations("AboutPage.missionVision");

  const goals = t.raw("goals") as string[];
  const reasons = t.raw("reasons") as Array<{ title: string; description: string }>;

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0 bg-brand-pattern opacity-5" />
      <div className="absolute top-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />
      <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply" />

      <div className="container relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Mission */}
          <div>
            <span className="text-sm font-semibold tracking-wider uppercase text-brand mb-2 inline-block">
              {t("subtitle")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 dark:text-white">
              {t("missionTitle")}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {t("missionDescription")}
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-brand mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground dark:text-white">
                    {t("goalsTitle")}
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {goals.map((goal, index) => (
                      <li key={index}>• {goal}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Why Choose Us */}
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-2xl font-bold mb-6 dark:text-white">
              {t("whyChooseTitle")}
            </h3>
            <div className="space-y-4">
              {reasons.map((reason, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-border/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div className="p-2 rounded-full bg-brand/10 group-hover:bg-brand/20 transition-colors">
                    {index === 0 && <Shield className="w-5 h-5 text-brand" />}
                    {index === 1 && <Zap className="w-5 h-5 text-brand" />}
                    {index === 2 && <Globe className="w-5 h-5 text-brand" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground dark:text-white">
                      {reason.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}