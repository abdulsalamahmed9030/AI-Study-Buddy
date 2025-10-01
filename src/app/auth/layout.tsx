import { ReactNode } from "react";
import { getUserServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getUserServer();

  if (user) {
    // If already logged in, bounce to dashboard
    redirect("/dashboard");
  }

  // Minimal layout (no AppShell) to keep auth pages focused
  return <>{children}</>;
}
