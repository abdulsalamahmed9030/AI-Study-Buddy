import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getUserServer } from "@/lib/supabase/server";

type SummaryRow = {
  id: string;
  material_id: string | null;
  summary: string;
  title?: string | null; // ✅ material title
  model?: string | null;
  created_at?: string | null;
};

export const revalidate = 0;

export default async function SummariesPage() {
  const supabase = await createSupabaseServerClient();

  const user = await getUserServer();
  if (!user) redirect("/auth/sign-in");

  const { data, error } = await supabase
    .from("summaries")
    .select("id, material_id, title, summary, model, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Your summaries</h1>
        <div className="rounded border bg-red-50 p-4 text-sm text-red-700">
          Failed to load summaries: {error.message}
        </div>
      </main>
    );
  }

  const summaries = (data ?? []) as SummaryRow[];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your summaries</h1>
        <Link href="/materials" className="text-sm underline">
          Back to materials
        </Link>
      </div>

      {summaries.length === 0 ? (
        <div className="rounded border bg-muted p-6 text-sm">
          <p className="mb-2">You haven&apos;t created any summaries yet.</p>
          <p>
            Create one from a material page — go to{" "}
            <Link href="/materials" className="underline">
              Materials
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {summaries.map((s) => (
            <li key={s.id} className="rounded border p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-medium truncate">
                    {s.title ?? "Untitled material"} {/* ✅ display title */}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {s.summary}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{s.model ?? "unknown model"}</span>
                    <span>•</span>
                    <time dateTime={s.created_at ?? undefined}>
                      {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                    </time>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {s.material_id ? (
                    <Link
                      href={`/materials/${s.material_id}`}
                      className="rounded px-3 py-1 text-xs underline"
                    >
                      Open material
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">No material link</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
