// app/layout.tsx

import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Cairo, Roboto } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ShippingEstimationButton } from "./[locale]/_components/ShippingEstimation/ShippingEstimationButton";

const inter = Roboto({
  subsets: ["latin"],
  variable: "--font-en",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-ar",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jahez.online"),
  title: {
    template: "%s | JAHEZ TRADE CO",
    default: "JAHEZ TRADE CO China Product Sourcing & Import Services",
  },
  description:
    "JAHEZ TRADE CO helps businesses source products from China, request quotations, book live market video calls, and get product sourcing, inspection, shipping, and business consulting services.",
  verification: {
    google: "nZi9ngdAitHA46eBbJIOdPwpAQcfe7a2PRaB1R6LR68",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
          <WhatsAppButton />
          <ShippingEstimationButton />
        </ThemeProvider>

        <GoogleAnalytics gaId="G-BTTGNXH9T3" />
      </body>
    </html>
  );
}