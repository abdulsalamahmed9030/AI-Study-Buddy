import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// Server Component — no "use client" here
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();

  // If not logged in, kick to sign-in
  if (error || !data.session) {
    redirect("/auth/sign-in");
  }

  const { user } = data.session;

  return (
    <AppShell>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            You’re signed in as <span className="font-mono">{user.email}</span>.
          </p>
          <p className="text-sm">
            Next up: profile, materials upload, PDF parsing, AI summary, flashcards, quizzes.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
