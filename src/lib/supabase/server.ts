import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Use this only in Server Components (pages/layouts).
 * It never mutates cookies to satisfy Next.js rules.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // ⛔ Server Components cannot modify cookies.
        set() {
          /* no-op in RSC */
        },
        remove() {
          /* no-op in RSC */
        },
      },
    }
  );
}
