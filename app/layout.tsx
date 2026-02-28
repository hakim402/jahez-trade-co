import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <ClerkProvider
          appearance={{
            cssLayerName: "clerk",
            variables: {
              colorBackground: "var(--primary-foreground)",
              colorForeground: "var(--primary)",
              colorInput: "var(--color-input)",
              colorPrimary: "var(--indigo)",
              colorText: "var(--foreground)",
            },
          }}
        >
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}