import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

async function doDelete(id: string) {
  const supabase = await createSupabaseRouteClient();

  // Auth (server-verified)
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: authErr?.message ?? "Unauthorized" }, { status: 401 });
  }

  // Fetch material (ownership check)
  const { data: material, error: fetchErr } = await supabase
    .from("materials")
    .select("id, user_id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !material) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (material.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove file in storage if present
  if (material.storage_path) {
    await supabase.storage.from("materials").remove([material.storage_path]);
  }

  // Delete row
  const { error: delErr } = await supabase.from("materials").delete().eq("id", id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// Next.js 15: params is a Promise you must await
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return doDelete(id);
}

// Optional: also accept POST for flexibility (e.g., HTML forms)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return doDelete(id);
}
