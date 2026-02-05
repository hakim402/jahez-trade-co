import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/app/_components/Theme/theme-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-2" />
    
        </div>
        <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}