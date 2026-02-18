// app/_components/Pricing/Pricing.tsx

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getPlans } from "./actions";

type Plan = { 
  id: string;
  displayName: string;
  price: number;
  description: string;
  features: string[];
};

export default async function Pricing() {
  const rawPlans = await getPlans();
  const plans: Plan[] = rawPlans.map((plan: any) => ({
    id: plan.id,
    displayName: plan.displayName,
    price: plan.price,
    description: plan.description ?? "",
    features: Array.isArray(plan.features) ? plan.features : [],
  }));

  return (
    <div className="relative py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold md:text-5xl">
            Simple Plans <br /> for Serious Buyers
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Choose a plan that fits your sourcing needs and get fast,
            transparent access to real suppliers in China.
          </p>
        </div>

        <div className="@container relative mt-12 md:mt-20">
          <div className="@4xl:grid-cols-3 grid">
            {plans.map((plan: Plan, index: number) => {
              const isHighlighted = index === 1; // middle plan gets the "Pro" styling

              if (isHighlighted) {
                return (
                  <div
                    key={plan.id}
                    className="ring-foreground/10 bg-background rounded-lg @3xl:mx-0 @3xl:-my-3 -mx-1 border-transparent shadow ring-1"
                  >
                    <div className="@3xl:py-3 @3xl:px-0 relative px-1">
                      <CardHeader className="p-8">
                        <CardTitle className="font-medium">
                          {plan.displayName}
                        </CardTitle>
                        <span className="mb-0.5 mt-2 block text-2xl font-semibold">
                          ${plan.price} / mo
                        </span>
                        <CardDescription className="text-sm">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <div className="@3xl:mx-0 -mx-1 border-y px-8 py-4">
                        <Button asChild className="w-full bg-color">
                          <Link href="#">Get Started</Link>
                        </Button>
                      </div>

                      <ul role="list" className="space-y-3 p-8">
                        {plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check
                              className="text-primary size-3"
                              strokeWidth={3.5}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }

              // Normal plan (first and third)
              return (
                <div key={plan.id}>
                  <CardHeader className="p-8">
                    <CardTitle className="font-medium">
                      {plan.displayName}
                    </CardTitle>
                    <span className="mb-0.5 mt-2 block text-2xl font-semibold">
                      ${plan.price} / mo
                    </span>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <div className="border-y px-8 py-4">
                    <Button asChild className="w-full" variant="outline">
                      <Link href="#">Get Started</Link>
                    </Button>
                  </div>

                  <ul role="list" className="space-y-3 p-8">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check
                          className="text-primary size-3"
                          strokeWidth={3.5}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}