import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { summarizeText } from "@/lib/ai/gemini";

export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

/**
 * POST /api/summaries
 * Body: { materialId: string }
 * Auth: required
 * Action: Summarize the material content with Gemini and store a row in `summaries`.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    // AuthN using Supabase Auth server (avoids the warning about getSession)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json(401, { step: "AUTH", error: userErr?.message ?? "Unauthorized" });
    }
    const userId = userData.user.id;

    let body: { materialId?: string } | undefined;
    try {
      body = (await req.json()) as { materialId?: string };
    } catch {
      return json(400, { step: "JSON_PARSE", error: "Invalid JSON" });
    }

    const materialId = body?.materialId;
    if (!materialId) {
      return json(400, { step: "VALIDATE", error: "materialId is required" });
    }

    // Fetch material (RLS enforces ownership)
    const { data: material, error: mErr } = await supabase
      .from("materials")
      .select("id, user_id, title, content")
      .eq("id", materialId)
      .single();

    if (mErr || !material) {
      return json(404, { step: "FETCH_MATERIAL", error: mErr?.message ?? "Material not found" });
    }

    if (material.user_id !== userId) {
      return json(403, { step: "OWNERSHIP", error: "Forbidden" });
    }

    // Summarize with Gemini
    let summary = "";
    try {
      summary = await summarizeText(material.content);
    } catch (e: unknown) {
      console.error("GEMINI_SUMMARY_ERROR", e);
      return json(502, { step: "GEMINI", error: "Failed to summarize" });
    }

    // Store summary (use a CURRENT model name, not the old 1.5 id)
    const { error: insErr } = await supabase.from("summaries").insert({
      material_id: material.id,
      user_id: userId,
      model: "models/gemini-2.0-flash",
      tokens: null,
      summary,
    });

    if (insErr) {
      console.error("SUMMARY_INSERT_ERROR", insErr);
      return json(400, { step: "DB_INSERT", error: insErr.message });
    }

    return json(201, { ok: true });
  } catch (err: unknown) {
    console.error("SUMMARIES_ROUTE_FATAL", err);
    return json(500, { step: "FATAL", error: "Internal error" });
  }
}

/**
 * GET /api/summaries?materialId=...
 * Auth: required
 * Action: Return the latest summary text for the given material.
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
    if (!materialId) {
      return json(400, { error: "materialId is required" });
    }

    // fetch latest summary for the material
    const { data, error } = await supabase
      .from("summaries")
      .select("summary")
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return json(404, { error: error?.message ?? "Summary not found" });
    }

    return json(200, { summary: data.summary });
  } catch (err: unknown) {
    console.error("SUMMARIES_GET_FATAL", err);
    return json(500, { error: "Internal error" });
  }
}
