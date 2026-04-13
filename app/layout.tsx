// app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Cairo, Roboto } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

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
  // Default metadata (overridden in locale layouts)
  title: {
    template: "%s | JAHEZ",
    default: "JAHEZ - Your Personal Products Tracker",
  },
  description:
    "JAHEZ is a cutting-edge web application designed to help you effortlessly track and manage your favorite products.",
  // Google Site Verification (replace with your actual verification code from GSC)
  verification: {
    google: "google-site-verification=nZi9ngdAitHA46eBbJIOdPwpAQcfe7a2PRaB1R6LR68",
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
        </ThemeProvider>
        {/* Google Analytics 4 – loads after page is interactive */}
        <GoogleAnalytics gaId="G-BTTGNXH9T3" />
      </body>
    </html>
  );
}