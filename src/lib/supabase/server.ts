"use server";

import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

// Minimal tuple shape for setAll
type SupabaseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Read-only Supabase client for Server Components (RSC).
 * - Next 15: cookies() is async → we await it.
 * - Uses new cookie API (getAll/setAll) required by @supabase/ssr@0.7.0.
 * - Does NOT mutate cookies in RSC (setAll is a no-op).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // <-- async in Next 15

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Explicit types to avoid implicit any in destructuring
        const all = cookieStore.getAll();
        return all.map((c: { name: string; value: string }) => ({
          name: c.name,
          value: c.value,
        }));
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        // RSC is read-only: NO cookie mutations here.
        // Touch the variable so eslint doesn't mark it unused.
        void cookiesToSet;
      },
    },
  });

  return client;
}

/**
 * Server-verified current user for Server Components (RSC).
 * Returns strictly `User | null` — no `any`.
 */
export async function getUserServer(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
