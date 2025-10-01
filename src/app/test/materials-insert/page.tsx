"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MaterialRow = {
  id: string;
  title: string;
  created_at: string;
} | null;

export default function MaterialsInsertTest() {
  const supabase = createSupabaseBrowserClient();
  const [result, setResult] = useState<MaterialRow>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleInsert() {
    setErr(null);
    setResult(null);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      setErr(`AUTH: ${userErr?.message ?? "No user"}`);
      return;
    }

    const { user } = userData;

    const { data, error } = await supabase
      .from("materials")
      .insert({
        user_id: user.id,
        title: "Direct insert test",
        content: "Hello from browser client",
        type: "text",
        storage_path: null,
      })
      .select("id,title,created_at")
      .single();

    if (error) {
      setErr(`DB_INSERT: ${error.message}`);
      return;
    }
    setResult(data);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Materials Direct Insert Test</h1>
      <button
        onClick={handleInsert}
        className="rounded-lg border px-4 py-2"
      >
        Insert via Supabase (no API)
      </button>

      {err && <pre className="text-red-600 text-sm">{err}</pre>}
      {result && (
        <pre className="text-xs mt-2 rounded bg-black/5 p-3">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
