// app/[locale]/_components/Header/Header.tsx
"use client";

import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ThemeToggle } from "../Theme/theme-toggle";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "../Language/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

// ── Dropdown nav link component ────────────────────────────────────────
function DropdownNavLink({
  label,
  href,
  isActive,
  subItems,
}: {
  label: string;
  href: string;
  isActive: boolean;
  subItems: readonly { name: string; href: string }[];
}) {
  return (
    <div className="group relative">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn(
          "gap-0.5",
          isActive && "text-primary bg-accent"
        )}
      >
        <Link href={href as any}>
          {label}
          <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-50 transition-transform duration-200 group-hover:rotate-180" />
        </Link>
      </Button>

      {/* Dropdown */}
      <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-border bg-background shadow-lg opacity-0 invisible translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50">
        <div className="py-1">
          {subItems.map((sub) => (
            <Link
              key={sub.href}
              href={sub.href as any}
              className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Header = () => {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // ── Active route helper ────────────────────────────────────────────────
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // ── Nav items ──────────────────────────────────────────────────────────
  const menuItems = [
    { name: t("home"), href: "/" },
    {
      name: t("products"),
      href: "/products",
      sub: [
        { name: t("products"), href: "/products" },
        { name: t("requestProduct"), href: "/products/request" },
      ],
    },
    {
      name: t("service"),
      href: "/services",
      sub: [
        { name: t("service"), href: "/services" },
        { name: t("requestConsultation"), href: "/services/request" },
      ],
    },
    { name: t("track"), href: "/track" },
    { name: t("bookings"), href: "/bookings" },
    { name: t("blogs"), href: "/blogs" },
    { name: t("about"), href: "/about" },
    { name: t("contact"), href: "/contact" },
  ] as const;

  const menuItemsSignedIn = [
    { name: t("dashboard"), href: "/dashboard" },
    {
      name: t("products"),
      href: "/products",
      sub: [
        { name: t("products"), href: "/products" },
        { name: t("requestProduct"), href: "/products/request" },
      ],
    },
    {
      name: t("service"),
      href: "/services",
      sub: [
        { name: t("service"), href: "/services" },
        { name: t("requestConsultation"), href: "/services/request" },
      ],
    },
    { name: t("track"), href: "/track" },
    { name: t("bookings"), href: "/bookings" },
    { name: t("blogs"), href: "/blogs" },
    { name: t("about"), href: "/about" },
    { name: t("contact"), href: "/contact" },
  ] as const;

  // ── Scroll + resize listeners ──────────────────────────────────────────
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
          "fixed top-4 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-border/40 backdrop-blur-lg border-b shadow-sm top-0 p-4"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/jahez.jpg"
                alt="Jahez Logo"
                width={120}
                height={50}
                className="h-20 md:h-26 lg:h-26 xl:h-26 w-auto object-contain -ml-4 md:ml-0 lg:ml-4 xl:ml-0"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              <SignedOut>
                {menuItems.map((item) => {
                  if ("sub" in item && item.sub) {
                    return (
                      <DropdownNavLink
                        key={item.href}
                        label={item.name}
                        href={item.href}
                        isActive={isActive(item.href)}
                        subItems={item.sub}
                      />
                    );
                  }
                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant="ghost"
                      size="sm"
                      className={cn(
                        isActive(item.href) && "text-primary bg-accent"
                      )}
                    >
                      <Link href={item.href}>{item.name}</Link>
                    </Button>
                  );
                })}
              </SignedOut>
              <SignedIn>
                {menuItemsSignedIn.map((item) => {
                  if ("sub" in item && item.sub) {
                    return (
                      <DropdownNavLink
                        key={item.href}
                        label={item.name}
                        href={item.href}
                        isActive={isActive(item.href)}
                        subItems={item.sub}
                      />
                    );
                  }
                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant="ghost"
                      size="sm"
                      className={cn(
                        isActive(item.href) && "text-primary bg-accent"
                      )}
                    >
                      <Link href={item.href}>{item.name}</Link>
                    </Button>
                  );
                })}
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
                  <React.Fragment key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "px-3 py-2 rounded-md hover:bg-accent transition-colors",
                        isActive(item.href)
                          ? "text-primary bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                    {"sub" in item && item.sub && (
                      <div className="ml-4 border-l-2 border-border/50 pl-3 space-y-1">
                        {item.sub.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "block px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
                              isActive(sub.href)
                                ? "text-primary bg-accent font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </SignedOut>
              <SignedIn>
                {menuItemsSignedIn.map((item) => (
                  <React.Fragment key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "px-3 py-2 rounded-md hover:bg-accent transition-colors",
                        isActive(item.href)
                          ? "text-primary bg-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                    {"sub" in item && item.sub && (
                      <div className="ml-4 border-l-2 border-border/50 pl-3 space-y-1">
                        {item.sub.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "block px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
                              isActive(sub.href)
                                ? "text-primary bg-accent font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
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
