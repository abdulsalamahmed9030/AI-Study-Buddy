import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

type UpdateResult = {
  username?: string | null;
  avatar_url?: string | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userData.user.id;

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 415 });
    }

    const form = await req.formData();
    const usernameRaw = form.get("username");
    const avatar = form.get("avatar");

    const update: UpdateResult = {};

    // 1) Optional avatar upload -> must live under avatars/{uid}/...
    if (avatar && avatar instanceof File && avatar.size > 0) {
      const filename = avatar.name || "avatar";
      const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "png";
      const objectPath = `${userId}/avatar.${ext}`; // <-- folder prefix for RLS

      const { data: uploadRes, error: upErr } = await supabase
        .storage
        .from("avatars")
        .upload(objectPath, avatar, {
          upsert: true,
          contentType: avatar.type || "image/*",
        });

      if (upErr) {
        return NextResponse.json({ error: `Avatar upload failed: ${upErr.message}` }, { status: 400 });
      }

      // Public bucket → public URL
      const { data: publicUrl } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(uploadRes.path);

      update.avatar_url = publicUrl.publicUrl ?? null;
    }

    // 2) Optional username change
    if (typeof usernameRaw === "string") {
      const username = usernameRaw.trim();
      if (username.length > 0 && username.length <= 64) {
        update.username = username;
      }
    }

    // Nothing to update?
    if (!("username" in update) && !("avatar_url" in update)) {
      return NextResponse.json({ ok: true, updated: false });
    }

    // 3) Update profiles (id = auth.uid())
    let ok = false;
    if (!ok) {
      const { error: upErr1 } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", userId);
      ok = !upErr1;
    }

    // 4) Fallback schema: user_id = auth.uid()
    if (!ok) {
      const { error: upErr2 } = await supabase
        .from("profiles")
        .update(update)
        .eq("user_id", userId);
      ok = !upErr2;
    }

    return NextResponse.json({ ok: true, updated: true, ...update });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
