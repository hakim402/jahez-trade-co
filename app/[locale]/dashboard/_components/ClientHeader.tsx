// app/[locale]/dashboard/_components/ClientHeader.tsx

"use client";

import { Search, Bell, Mail, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/context/sidebar-context";
import { ThemeToggle } from "@/app/[locale]/_components/Theme/theme-toggle";
import { UserButton, useUser } from "@clerk/nextjs";
import { LanguageSwitcher } from "../../_components/Language/LanguageSwitcher";

export function ClientHeader() {
  const { toggleMobile } = useSidebar();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border px-4 lg:px-6">
      <div className="flex items-center justify-between h-full max-w-480 mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobile}
            className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent/10"
          >
            <Menu size={20} />
          </Button>

          {/* Search */}
          <div className="relative hidden sm:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="search"
              placeholder="Search anything..."
              className="w-64 lg:w-80 pl-10 bg-background/10 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border-2 border-indiago-500 -mt-1",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
