"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SummarizeButton({ materialId }: { materialId: string }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleClick() {
    setErr(null);
    setSummary(null);
    setState("working");

    try {
      // 🔹 Trigger Gemini summarization
      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ materialId }),
      });

      const j = await res.json();

      if (!res.ok) {
        setErr(`${j.step ?? "SERVER"}: ${j.error ?? "Failed"}`);
        setState("error");
        return;
      }

      // 🔹 Fetch stored summary from Supabase
      const sRes = await fetch(`/api/summaries?materialId=${materialId}`, {
        credentials: "same-origin",
      });
      const sJson = await sRes.json();

      if (sRes.ok && sJson.summary) {
        setSummary(sJson.summary);
        setState("done");
      } else {
        setErr(sJson.error ?? "Summary not found");
        setState("error");
      }
    } catch (e: unknown) {
      console.error("SummarizeButton error:", e);
      setErr("Network error");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" onClick={handleClick} disabled={state === "working"}>
        {state === "working"
          ? "Summarizing…"
          : state === "done"
          ? "Summarized"
          : "Summarize"}
      </Button>

      {err && <span className="text-xs text-red-600">{err}</span>}

      {summary && (
        <div className="rounded bg-muted p-2 text-xs max-w-sm text-left">
          <strong>Summary:</strong> {summary}
        </div>
      )}
    </div>
  );
}
