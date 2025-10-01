// src/app/materials/page.tsx
import AppShell from "@/components/layout/AppShell";
import { createSupabaseServerClient, getUserServer } from "@/lib/supabase/server";
import { SummarizeButton } from "./SummarizeButton";

type MaterialRow = {
  id: string;
  title: string;
  type: "text" | "pdf"; // tighten type if these are the only values
  created_at: string;
};

export default async function MaterialsPage() {
  // Server-verified user (no getSession)
  const user = await getUserServer();
  if (!user) {
    return <div className="p-6">Not signed in.</div>;
  }

  // RSC read-only client for DB reads
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("materials")
    .select("id, title, type, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  const rows: MaterialRow[] = (data ?? []) as MaterialRow[];

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">My Materials</h1>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No materials yet. Add one!</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-2xl border p-4"
              >
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.type.toUpperCase()} · {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
                <SummarizeButton materialId={m.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
