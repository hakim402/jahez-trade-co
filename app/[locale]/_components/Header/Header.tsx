// app/[locale]/_components/Header/Header.tsx
"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ThemeToggle } from "../Theme/theme-toggle";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "../Language/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export const Header = () => {
  const t = useTranslations("Header");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Use as const to preserve literal types for href
  const menuItems = [
    { name: t("home"), href: "/" },
    { name: t("products"), href: "/products" },
    { name: t("service"), href: "/services" },
    { name: t("about"), href: "/about" },
    { name: t("contact"), href: "/contact" },
  ] as const;

  const menuItemsSignedIn = [
    { name: t("home"), href: "/" },
    { name: t("profile"), href: "/dashboard" },
    { name: t("products"), href: "/products" },
    { name: t("service"), href: "/services" },
    { name: t("about"), href: "/about" },
    { name: t("contact"), href: "/contact" },
  ] as const;

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header>
      <nav
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-border/40 backdrop-blur-lg border-b shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/mewan.jpg"
                alt="Mewan Logo"
                width={120}
                height={50}
                className="h-28 md:h-36 lg:h-36 xl:h-36 w-auto object-contain -ml-4 md:ml-0 lg:ml-4 xl:ml-0"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              <SignedOut>
                {menuItems.map((item) => (
                  <Button key={item.href} asChild variant="ghost" size="sm">
                    <Link href={item.href}>{item.name}</Link>
                  </Button>
                ))}
              </SignedOut>
              <SignedIn>
                {menuItemsSignedIn.map((item) => (
                  <Button key={item.href} asChild variant="ghost" size="sm">
                    <Link href={item.href}>{item.name}</Link>
                  </Button>
                ))}
              </SignedIn>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />

              <SignedOut>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex border border-input hover:bg-accent hover:text-accent-foreground"
                >
                  <Link href="/sign-in">{t("login")}</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden sm:inline-flex bg-linear-to-r bg-color hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Link href="/sign-up">{t("signUp")}</Link>
                </Button>
              </SignedOut>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          className={cn(
            "absolute left-0 right-0 top-16 bg-background border-border border-b shadow-lg transition-all duration-300 lg:hidden",
            menuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <div className="container mx-auto px-4 py-6 space-y-4">
            <div className="flex flex-col space-y-2">
              <SignedOut>
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </SignedOut>
              <SignedIn>
                {menuItemsSignedIn.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </SignedIn>
            </div>

            <SignedOut>
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                    {t("login")}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                    {t("signUp")}
                  </Link>
                </Button>
              </div>
            </SignedOut>
          </div>
        </div>
      </nav>
    </header>
  );
};