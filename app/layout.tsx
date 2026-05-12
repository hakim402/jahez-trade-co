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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * suppressHydrationWarning on <html> is required by next-themes so the
     * server-rendered class/data-theme attribute doesn't cause a hydration
     * mismatch when the client theme is resolved.
     */
    <html
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body>
        {/*
         * ThemeProvider from next-themes injects a tiny inline <script> to
         * detect the user's theme before first paint (FOUC prevention).
         *
         * React 19 warns when it encounters a <script> inside a component
         * tree during client rendering. next-themes ≥ 0.4.0 resolves this by
         * using React 19's new script-hoisting API.
         *
         * ACTION REQUIRED if you still see the warning:
         *   npm install next-themes@latest
         *   (or: pnpm add next-themes@latest / yarn add next-themes@latest)
         *
         * After upgrading, make sure your ThemeProvider wrapper
         * (app/providers/theme-provider.tsx) passes:
         *   <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
         */}
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>

        {/* Google Analytics 4 – loads after page is interactive via next/script */}
        <GoogleAnalytics gaId="G-BTTGNXH9T3" />
      </body>
    </html>
  );
}