import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// The route bases you want protected
const PROTECTED_MATCHERS = [
  "/dashboard",
  "/materials",
  "/flashcards",
  "/quizzes",
  "/summaries",
  "/settings",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_MATCHERS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
}

// The cookie tuple shape expected by setAll (keep it minimal)
type SupabaseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  // IMPORTANT: create a response we can attach cookies to
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    const u = req.nextUrl.clone();
    u.pathname = "/auth/sign-in";
    u.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(u);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // NEW API in @supabase/ssr >= 0.5.x (you are on 0.7.0)
      getAll() {
        // NextRequest.cookies.getAll() → { name, value }[]
        // Map to the shape expected by @supabase/ssr
        return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        // Write each cookie onto the SAME response instance
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() revalidates with Supabase Auth server (safe for middleware)
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  if (error || !user) {
    const u = req.nextUrl.clone();
    u.pathname = "/auth/sign-in";
    u.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(u);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/materials/:path*",
    "/flashcards/:path*",
    "/quizzes/:path*",
    "/summaries/:path*",
    "/settings/:path*",
  ],
};
