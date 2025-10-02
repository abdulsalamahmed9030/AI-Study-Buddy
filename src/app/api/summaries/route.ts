import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { summarizeText } from "@/lib/ai/gemini";

export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

const CURRENT_MODEL_ID = "models/gemini-2.0-flash";

type PostBody = { materialId?: string };

type MaterialRow = {
  id: string;
  user_id: string;
  title?: string | null;
  content: string;
};

type SummaryRow = {
  id: string;
  material_id: string | null;
  user_id: string;
  title: string | null;
  model: string | null;
  tokens?: number | null;
  summary: string;
  created_at?: string | null;
};

/**
 * POST /api/summaries
 * Body: { materialId: string }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json(401, { step: "AUTH", error: userErr?.message ?? "Unauthorized" });
    }
    const userId = userData.user.id;

    let body: PostBody | undefined;
    try {
      body = (await req.json()) as PostBody;
    } catch {
      return json(400, { step: "JSON_PARSE", error: "Invalid JSON" });
    }

    const materialId = body?.materialId;
    if (!materialId) {
      return json(400, { step: "VALIDATE", error: "materialId is required" });
    }

    const { data: material, error: mErr } = await supabase
      .from("materials")
      .select("id, user_id, title, content")
      .eq("id", materialId)
      .single<MaterialRow>();

    if (mErr || !material) {
      return json(404, { step: "FETCH_MATERIAL", error: mErr?.message ?? "Material not found" });
    }

    if (material.user_id !== userId) {
      return json(403, { step: "OWNERSHIP", error: "Forbidden" });
    }

    // Summarize
    let summaryText = "";
    try {
      summaryText = await summarizeText(material.content);
      if (typeof summaryText !== "string") summaryText = String(summaryText ?? "");
    } catch (e: unknown) {
      console.error("GEMINI_SUMMARY_ERROR", e);
      return json(502, { step: "GEMINI", error: "Failed to summarize" });
    }

    // Insert summary with material title
    const { data: inserted, error: insErr } = await supabase
      .from("summaries")
      .insert({
        material_id: material.id,
        user_id: userId,
        title: material.title ?? "Untitled material",
        model: CURRENT_MODEL_ID,
        tokens: null,
        summary: summaryText,
      })
      .select()
      .single<SummaryRow>();

    if (insErr) {
      console.error("SUMMARY_INSERT_ERROR", insErr);
      return json(400, { step: "DB_INSERT", error: insErr.message });
    }

    return json(201, { ok: true, summary: inserted });
  } catch (err: unknown) {
    console.error("SUMMARIES_ROUTE_FATAL", err);
    return json(500, { step: "FATAL", error: "Internal error" });
  }
}

/**
 * GET /api/summaries?materialId=...
 */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json(401, { error: userErr?.message ?? "Unauthorized" });
    }

    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get("materialId");
    if (!materialId) return json(400, { error: "materialId is required" });

    const { data, error } = await supabase
      .from("summaries")
      .select("id, title, summary, model, created_at")
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<SummaryRow>();

    if (error || !data) return json(404, { error: error?.message ?? "Summary not found" });

    return json(200, { summary: data });
  } catch (err: unknown) {
    console.error("SUMMARIES_GET_FATAL", err);
    return json(500, { error: "Internal error" });
  }
}
