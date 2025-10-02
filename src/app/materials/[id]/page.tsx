// src/app/materials/[id]/page.tsx
import AppShell from "@/components/layout/AppShell";
import { createSupabaseServerClient, getUserServer } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Suspense } from "react";
import { SummarizeButton } from "../SummarizeButton";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteMaterialButton } from "@/components/DeleteMaterialButton";

type Material = {
  id: string;
  user_id: string;
  title: string;
  type: "text" | "pdf";
  content: string | null;
  created_at: string;
};

type AnyRow = Record<string, unknown>;

type SummaryResolved = {
  id: string;
  material_id: string;
  created_at: string;
  model?: string | null;
  content: string | null;
};

async function getMaterial(id: string): Promise<Material | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("materials")
    .select("id,user_id,title,type,content,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Material) ?? null;
}

/** Pick the first non-empty string among likely content columns. */
function resolveSummaryContent(row: AnyRow | null | undefined): string | null {
  if (!row) return null;
  const candidates = ["content", "summary", "text", "body", "markdown", "result", "output"] as const;
  for (const key of candidates) {
    const v = row[key as keyof AnyRow];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

async function getLatestSummaryFromDB(materialId: string): Promise<SummaryResolved | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("material_id", materialId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const row = data[0] as AnyRow;

  return {
    id: (row.id ?? "") as string,
    material_id: (row.material_id ?? "") as string,
    created_at: (row.created_at ?? "") as string,
    model: typeof row.model === "string" ? row.model : null,
    content: resolveSummaryContent(row),
  };
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 15: params is a Promise — you MUST await it
  const { id } = await params;

  const user = await getUserServer();
  if (!user) {
    return (
      <AppShell>
        <div className="p-6">Not signed in.</div>
      </AppShell>
    );
  }

  const material = await getMaterial(id);
  if (!material) {
    return (
      <AppShell>
        <div className="p-6">Material not found.</div>
      </AppShell>
    );
  }

  // UI guard (RLS still protects)
  if (material.user_id !== user.id) {
    return (
      <AppShell>
        <div className="p-6">You do not have access to this material.</div>
      </AppShell>
    );
  }

  const latestSummary = await getLatestSummaryFromDB(material.id);

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{material.title}</h1>
            <p className="text-xs text-muted-foreground">
              {material.type.toUpperCase()} · {new Date(material.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/materials" className="text-sm underline">
              ← Back to Materials
            </Link>
            <SummarizeButton materialId={material.id} />
            <button className="rounded-2xl border px-3 py-2 text-sm" disabled title="Coming soon">
              Generate Flashcards
            </button>
            <button className="rounded-2xl border px-3 py-2 text-sm" disabled title="Coming soon">
              Generate Quiz
            </button>
            <DeleteMaterialButton materialId={material.id} />
          </div>
        </div>

        {/* Summary */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Latest Summary</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none dark:prose-invert">
            <Suspense fallback={<Skeleton className="h-20 w-full rounded-2xl" />}>
              {latestSummary?.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {latestSummary.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No summary yet. Click <span className="font-medium">Summarize</span> to generate one.
                </p>
              )}
            </Suspense>
          </CardContent>
        </Card>

        {/* Full Content */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none dark:prose-invert">
            <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
              {material.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{material.content}</ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">No content extracted.</p>
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
