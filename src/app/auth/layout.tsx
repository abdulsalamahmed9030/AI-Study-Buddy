import { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    redirect("/dashboard");
  }
  // Minimal layout (no AppShell) to keep auth pages focused
  return <>{children}</>;
}
