import { Shield, Zap, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent,  CardHeader, CardTitle } from '@/components/ui/card';


export default function CoreValues() {
  const values = [
    {
      title: "Transparency",
      description:
        "Clear pricing, no hidden fees, and full visibility into the sourcing process",
      icon: <Eye className="w-8 h-8" />,
    },
    {
      title: "Speed",
      description:
        "24-hour response time and quick turnaround on all sourcing requests",
      icon: <Zap className="w-8 h-8" />,
    },
    {
      title: "Trust",
      description:
        "Verified suppliers, quality checks, and professional intermediation",
      icon: <Shield className="w-8 h-8" />,
    },
    {
      title: "Scalability",
      description:
        "Designed to grow with your business from small orders to bulk sourcing",
      icon: <TrendingUp className="w-8 h-8" />,
    },
  ];
  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Our Core <span className="text-gradient">Values</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Principles that guide every interaction and transaction on our
            platform
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card
              key={index}
              className="border-2 hover:border-color transition-all duration-300"
            >
              <CardHeader>
                <div className="p-3 rounded-full bg-color/10 w-fit mb-4">
                  <div className="text-color">{value.icon}</div>
                </div>
                <CardTitle>{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
