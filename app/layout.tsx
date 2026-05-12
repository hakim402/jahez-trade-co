import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Cairo, Roboto } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
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

// ✅ COMPLETE METADATA WITH FAVICON CONFIG
export const metadata: Metadata = {
  title: {
    template: "%s | JAHEZ",
    default: "JAHEZ - Your Personal Products Tracker",
  },
  description:
    "JAHEZ is a cutting-edge web application designed to help you effortlessly track and manage your favorite products.",
  verification: {
    google:
      "google-site-verification=nZi9ngdAitHA46eBbJIOdPwpAQcfe7a2PRaB1R6LR68",
  },
  
  // ✅ FAVICON CONFIGURATION (Required for App Router)
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
        sizes: 'any',
      },
    ],
    shortcut: '/favicon.ico',
    apple: [
      {
        url: '/favicon.ico',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  
  // ✅ OpenGraph/Twitter (optional but recommended)
  openGraph: {
    title: "JAHEZ - Your Personal Products Tracker",
    description: "Track your favorite products effortlessly",
    url: "https://jahez.online",
    siteName: "JAHEZ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JAHEZ - Your Personal Products Tracker",
    description: "Track your favorite products effortlessly",
  },
};

// ✅ VIEWPORT CONFIG (Helps mobile favicon rendering)
export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      lang="en"
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>

        {/* ✅ JSON-LD Structured Data - Rendered AFTER ThemeProvider */}
        <Script
          id="schema-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "JAHEZ",
              url: "https://jahez.online",
              inLanguage: ["en", "ar"],
              potentialAction: {
                "@type": "SearchAction",
                target: "https://jahez.online/{locale}/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* ✅ Google Analytics 4 */}
        <GoogleAnalytics gaId="G-BTTGNXH9T3" />
      </body>
    </html>
  );
}