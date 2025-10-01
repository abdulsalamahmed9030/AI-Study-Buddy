"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarLinks } from "./Sidebar";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="sr-only">Navigation</SheetHeader>
              <SidebarLinks />
            </SheetContent>
          </Sheet>
          <Link href="/" className="font-semibold">
            AI Study Buddy
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DarkModeToggle />

          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard">Dashboard</Link>
          </Button>

          {/* Sign out posts to our server route for a clean logout */}
          <form method="post" action="/auth/sign-out">
            <Button type="submit" size="sm" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
