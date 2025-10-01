import { createSupabaseServerClient } from "@/lib/supabase/server";


export const dynamic = "force-dynamic";

export default async function SupabasePingPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Supabase Ping</h1>
      <div className="rounded-2xl border p-4">
        <p className="text-sm">
          URL: <code className="font-mono">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>
        </p>
        <p className="text-sm">
          Session present: <span className="font-mono">{Boolean(data.session).toString()}</span>
        </p>
        {error ? (
          <p className="text-sm text-red-600">Error: {error.message}</p>
        ) : (
          <p className="text-sm text-green-600">OK: client is initialized</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: If you’re logged out, Session will be false (expected).
      </p>
    </div>
  );
}
