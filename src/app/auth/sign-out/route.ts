import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    // Optional: allow ?next=/somewhere to redirect after sign-out
    const url = new URL(req.url);
    const next = url.searchParams.get("next") ?? "/auth/sign-in";

    const { error } = await supabase.auth.signOut();
    if (error) {
      // Fail closed but still move the user away from protected pages
      return NextResponse.redirect(new URL("/auth/sign-in", url.origin), { status: 302 });
    }

    return NextResponse.redirect(new URL(next, url.origin), { status: 302 });
  } catch {
  return NextResponse.redirect(new URL("/auth/sign-in", new URL(req.url).origin), {
    status: 302,
  });
}
}
