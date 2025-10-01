import { getUserServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SupabasePingPage() {
  const user = await getUserServer();

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Supabase Ping</h1>
      <div className="rounded-2xl border p-4">
        <p className="text-sm">
          URL: <code className="font-mono">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>
        </p>
        <p className="text-sm">
          Session present: <span className="font-mono">{Boolean(user).toString()}</span>
        </p>
        {user ? (
          <p className="text-sm text-green-600">OK: logged in as {user.email}</p>
        ) : (
          <p className="text-sm text-red-600">Not logged in (expected if signed out)</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: This checks server-side auth with <code>getUserServer()</code>.
      </p>
    </div>
  );
}
