import { redirect } from "next/navigation";
import { getUserServer } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// Server Component — no "use client" here
export default async function DashboardPage() {
  const user = await getUserServer();

  // If not logged in, kick to sign-in
  if (!user) {
    redirect("/auth/sign-in");
  }

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
