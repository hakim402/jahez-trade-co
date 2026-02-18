import { Card } from "@/components/ui/card";

export default function StatsSection() {
  return (
    <section>
      <div className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Card className="mt-8 grid grid-cols-2 gap-4 md:mt-16 md:grid-cols-4 px-12">
            <div>
              <div className="text-foreground text-4xl font-bold text-gradient">24h</div>
              <p className="text-muted-foreground">Quote Delivery</p>
            </div>
            <div>
              <div className="text-foreground text-4xl font-bold text-gradient">3+</div>
              <p className="text-muted-foreground">China Markets Covered</p>
            </div>
            <div>
              <div className="text-foreground text-4xl font-bold text-gradient">100%</div>
              <p className="text-muted-foreground">Human-Verified Sourcing</p>
            </div>
            <div>
              <div className="text-foreground text-4xl font-bold text-gradient">∞</div>
              <p className="text-muted-foreground">Scalable for Growth</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
