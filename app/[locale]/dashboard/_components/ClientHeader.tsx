// app/admin/_components/Header.tsx

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
          {/* Theme Toggle */}
          <div className="-mr-3">
            <ThemeToggle />
          </div>

          {/* Messages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground hover:bg-accent/10 cursor-pointer"
              >
                <Mail size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-color rounded-full text-xs flex items-center justify-center text-white font-medium">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 bg-popover border-border"
            >
              <DropdownMenuLabel className="text-popover-foreground">
                Messages
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {[1, 2, 3].map((i) => (
                <DropdownMenuItem
                  key={i}
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/10"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={`https://i.pravatar.cc/150?img=${i + 10}`}
                    />
                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                      U{i}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-popover-foreground">
                      User {i}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Hey, can we discuss the new project?
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">2m</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground hover:bg-accent/10 cursor-pointer"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-color rounded-full text-xs flex items-center justify-center text-white font-medium">
                  5
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 bg-popover border-border"
            >
              <DropdownMenuLabel className="text-popover-foreground">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-lg">$</span>
                </div>
                <div>
                  <p className="text-sm text-popover-foreground">
                    New payment received
                  </p>
                  <p className="text-xs text-muted-foreground">
                    $2,500 from Client A
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/10">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-violet-400 text-lg">+</span>
                </div>
                <div>
                  <p className="text-sm text-popover-foreground">
                    New user registered
                  </p>
                  <p className="text-xs text-muted-foreground">
                    John Doe joined the platform
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/10">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 text-lg">@</span>
                </div>
                <div>
                  <p className="text-sm text-popover-foreground">
                    Mentioned in comment
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sarah mentioned you in a task
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
