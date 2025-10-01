import { redirect } from "next/navigation";
import { createSupabaseServerClient, getUserServer } from "@/lib/supabase/server";

export default async function MaterialsTest() {
  const user = await getUserServer();
  if (!user) redirect("/auth/sign-in");

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("materials")
    .select("id, title, type, created_at")
    .order("created_at", { ascending: false });

  return (
    <pre className="p-4 text-sm">
      {JSON.stringify({ error, count: data?.length ?? 0, sample: data?.[0] }, null, 2)}
    </pre>
  );
}
