import { Card } from "@/components/ui/card";
import Image from "next/image";
import * as React from "react";
import {
  MdOutlineBrandingWatermark,
  MdOutlineSubscriptions,
  MdImageSearch,
} from "react-icons/md";
import { CiImport } from "react-icons/ci";
import { BsChatQuote } from "react-icons/bs";
import { SiMarketo } from "react-icons/si";

export default function Features() {
  return (
    <section>
      <div className="py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold md:text-5xl">
              Built for <span className=""><br/> Modern Product</span> Sourcing
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Everything you need to find products, verify suppliers, get
              quotes, and manage sourcing from China in one platform.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <IntegrationCard
              title="Product Search by Image or Link"
              description="Upload a product image or paste a link from Alibaba, 1688, or Amazon and let us find the right suppliers for you."
            >
              <MdImageSearch className="text-9xl text-color" />
            </IntegrationCard>

            <IntegrationCard
              title="24-Hour Price Quotation"
              description="We research and negotiate for you, then deliver a clear and transparent price quote within 24 hours."
            >
              <BsChatQuote className="text-9xl text-color" />
            </IntegrationCard>

            <IntegrationCard
              title="Live Market & Factory Calls"
              description="Book live video calls with markets or factories in China and inspect products in real time before ordering."
            >
              <SiMarketo className="text-9xl text-color" />
            </IntegrationCard>

            <IntegrationCard
              title="Branding & Customization"
              description="Request custom branding, packaging, quality checks, and product photography based on your needs."
            >
              <MdOutlineBrandingWatermark className="text-9xl text-color" />
            </IntegrationCard>

            <IntegrationCard
              title="Import Product Requests"
              description="Easily import product links, images, and details submitted by users and manage them in one centralized system."
            >
              <CiImport className="text-9xl text-color" />
            </IntegrationCard>

            <IntegrationCard
              title="Subscription Plans"
              description="Choose Basic, Advanced, or VIP plans to access premium features and filter serious buyers."
            >
              <MdOutlineSubscriptions className="text-9xl text-color" />
            </IntegrationCard>
          </div>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  title,
  description,
  children,
  link = "#",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  link?: string;
}) => {
  return (
    <Card className="p-6">
      <div className="relative">
        <div className="*:size-10">{children}</div>

        <div className="mt-6 space-y-1.5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </Card>
  );
};
