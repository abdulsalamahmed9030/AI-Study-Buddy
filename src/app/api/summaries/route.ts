import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { summarizeText } from "@/lib/ai/gemini";

export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

// Minimal row types
type MaterialRow = {
  id: string;
  user_id: string;
  title?: string | null;
  content: string;
};

type SummaryRow = {
  id: string;
  material_id: string;
  user_id: string;
  title: string;
  model: string;
  summary: string;
  tokens?: number | null;
  created_at?: string | null;
};

/**
 * POST /api/summaries
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });
    const userId = userData.user.id;

    const body = (await req.json()) as { materialId?: string };
    if (!body.materialId) return json(400, { error: "materialId is required" });

    // Fetch material
    const { data: material, error: mErr } = await supabase
      .from("materials")
      .select("id, user_id, title, content")
      .eq("id", body.materialId)
      .single<MaterialRow>();

    if (mErr || !material) return json(404, { error: "Material not found" });
    if (material.user_id !== userId) return json(403, { error: "Forbidden" });

    // Generate summary using Gemini
    const summary = await summarizeText(material.content);

    // Insert summary
    const { data: inserted, error: insErr } = await supabase
      .from("summaries")
      .insert({
        material_id: material.id,
        user_id: userId,
        title: material.title ?? "Untitled material",
        model: "models/gemini-2.0-flash",
        summary,
        tokens: null,
      })
      .select()
      .single<SummaryRow>();

    if (insErr) return json(400, { error: insErr.message });

    return json(201, { ok: true, summary: inserted });
  } catch (err) {
    console.error("SUMMARIES_ROUTE_FATAL", err);
    return json(500, { error: "Internal server error" });
  }
}

/**
 * GET /api/summaries?materialId=...
 */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });

    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get("materialId");
    if (!materialId) return json(400, { error: "materialId is required" });

    const { data, error } = await supabase
      .from("summaries")
      .select("summary")
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<SummaryRow>();

    if (error || !data) return json(404, { error: "Summary not found" });

    return json(200, { summary: data.summary });
  } catch (err) {
    console.error("SUMMARIES_GET_FATAL", err);
    return json(500, { error: "Internal server error" });
  }
}
