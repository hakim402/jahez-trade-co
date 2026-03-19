// app/layout.tsx

import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Cairo, Roboto } from "next/font/google";
import "./globals.css";
import 'flag-icons/css/flag-icons.min.css';

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
  title: "MEWAN - Your Personal Products Tracker",
  description:
    "Mewan is a cutting-edge web application designed to help you effortlessly track and manage your favorite products.",
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
      </body>
    </html>
  );
}
