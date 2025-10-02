import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

type ProfileRow = {
  username: string | null;
  avatar_url: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export async function GET() {
  try {
    const supabase = await createSupabaseRouteClient();

    // Server-verified auth
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userData.user.id;

    // 1) Try the common schema: profiles.id = auth.uid()
    let profile: ProfileRow | null = null;

    {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, updated_at, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        // ignore here; we’ll try alternative schema next
      } else if (data) {
        profile = data;
      }
    }

    // 2) If not found, try alternative schema: profiles.user_id = auth.uid()
    if (!profile) {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, updated_at, created_at")
        .eq("user_id", userId) // alternative schema
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        profile = data[0] as ProfileRow;
      }
    }

    // If still null, return minimal user info (email only)
    return NextResponse.json({
      email: userData.user.email ?? null,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
