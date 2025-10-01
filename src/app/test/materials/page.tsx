import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MaterialsTest() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/sign-in");

  const { data, error } = await supabase
    .from("materials")
    .select("id,title,type,created_at")
    .order("created_at", { ascending: false });

  return (
    <pre className="p-4 text-sm">
      {JSON.stringify({ error, count: data?.length ?? 0, sample: data?.[0] }, null, 2)}
    </pre>
  );
}
