"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Layers3,
  PlusCircle,
  Sparkles,
  SquareStack, // ✅ use this instead of 'Cards'
  BookOpen,
  SquarePen,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/materials", label: "Materials", icon: Layers3 },
  { href: "/materials/new", label: "Add Material", icon: PlusCircle },
  { href: "/summaries", label: "Summaries", icon: Sparkles },
  { href: "/flashcards", label: "Flashcards", icon: SquareStack }, // ✅ fixed
  { href: "/quizzes", label: "Quizzes", icon: BookOpen },
  { href: "/notes", label: "Notes", icon: SquarePen },
];

export function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="px-2 pb-2 pt-3 text-sm font-semibold text-muted-foreground">
        Study Buddy
      </div>
      <ul className="mt-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden border-r lg:block lg:w-64" aria-label="Sidebar">
      <SidebarLinks />
    </aside>
  );
}
