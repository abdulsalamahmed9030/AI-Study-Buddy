import AppShell from "@/components/layout/AppShell";

export default function Home() {
  return (
    <AppShell>
      <div className="rounded-2xl border p-4">
        <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 text-white">
          <p className="text-lg font-semibold tracking-wide">
            Tailwind v4 ✅ — gradient box
          </p>
          <p className="text-sm opacity-90">
            Shell online. Next: Supabase setup.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to navigate. We’ll wire routes as features land.
        </p>
      </div>
    </AppShell>
  );
}
