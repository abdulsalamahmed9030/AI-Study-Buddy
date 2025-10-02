// src/app/materials/page.tsx
import AppShell from "@/components/layout/AppShell";
import { createSupabaseServerClient, getUserServer } from "@/lib/supabase/server";
import Link from "next/link";
import { SummarizeButton } from "./SummarizeButton";

type MaterialRow = {
  id: string;
  title: string;
  type: "text" | "pdf";
  created_at: string;
};

const PAGE_SIZE = 8;

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // Server-verified user (no getSession)
  const user = await getUserServer();
  if (!user) {
    return <div className="p-6">Not signed in.</div>;
  }

  const page = Number(searchParams?.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // RSC read-only client for DB reads
  const supabase = await createSupabaseServerClient();

  const { data, error, count } = await supabase
    .from("materials")
    .select("id, title, type, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rows: MaterialRow[] = (data ?? []) as MaterialRow[];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppShell>
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">My Materials</h1>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No materials yet. Add one!</p>
        ) : (
          <>
            <ul className="space-y-3">
              {rows.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border p-4"
                >
                  <div>
                    {/* Title links to the detail page */}
                    <Link
                      href={`/materials/${m.id}`}
                      className="font-medium hover:underline"
                    >
                      {m.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {m.type.toUpperCase()} ·{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                  <SummarizeButton materialId={m.id} />
                </li>
              ))}
            </ul>

            {/* Pagination controls */}
            <div className="flex justify-between pt-4">
              {page > 1 ? (
                <Link
                  href={`/materials?page=${page - 1}`}
                  className="rounded-lg border px-3 py-1 text-sm"
                >
                  ← Prev
                </Link>
              ) : (
                <span />
              )}

              {page < totalPages ? (
                <Link
                  href={`/materials?page=${page + 1}`}
                  className="rounded-lg border px-3 py-1 text-sm"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
