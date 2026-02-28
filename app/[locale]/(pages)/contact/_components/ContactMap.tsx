import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ContactMap() {
  const t = await getTranslations("ContactPage.contactMap");

  return (
    <section className="py-16">
      <div className="space-y-8">
        {/* Map Card */}
        <Card className="group bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="relative w-full aspect-video md:h-80 bg-brand/5 flex items-center justify-center overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d436719.27637309686!2d121.47675279999999!3d31.22434895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35b27040b1f53c33%3A0x295129423c364a1!2sShanghai%2C%20China!5e0!3m2!1sen!2s!4v1771527082258!5m2!1sen!2s"
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              loading="lazy"
              title="Guangzhou, China Map"
            ></iframe>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm opacity-0 pointer-events-none">
              <MapPin className="w-12 h-12 text-brand animate-pulse" />
            </div>
          </div>
          <CardContent className="p-4 text-center border-t border-border/50">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              {t("caption")}
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
        </Card>
      </div>
    </section>
  );
}