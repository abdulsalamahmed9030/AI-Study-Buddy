"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ApiPostResponse = {
  ok?: boolean;
  step?: string;
  error?: string;
  // older behavior or simple api: summary can be string
  summary?: string | SummaryRow;
};

type SummaryRow = {
  id: string;
  summary: string;
  model?: string | null;
  created_at?: string | null;
};

export function SummarizeButton({ materialId }: { materialId: string }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function handleClick() {
    setErr(null);
    setSummary(null);
    setState("working");

    try {
      // Trigger Gemini summarization & DB write
      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ materialId }),
      });

      const j = (await res.json()) as ApiPostResponse;

      if (!res.ok) {
        setErr(`${j.step ?? "SERVER"}: ${j.error ?? "Failed"}`);
        setState("error");
        return;
      }

      // Fetch stored summary from Supabase (latest)
      const sRes = await fetch(`/api/summaries?materialId=${encodeURIComponent(materialId)}`, {
        credentials: "same-origin",
      });
      const sJson = (await sRes.json()) as ApiPostResponse;

      if (!sRes.ok) {
        setErr(sJson.error ?? "Failed to fetch summary");
        setState("error");
        return;
      }

      // sJson.summary might be:
      //  - a string
      //  - an object { id, summary, model, created_at }
      const raw = sJson.summary;

      if (!raw) {
        setErr("Summary not found");
        setState("error");
        return;
      }

      if (typeof raw === "string") {
        setSummary(raw);
        setState("done");
        return;
      }

      if (typeof raw === "object" && raw !== null) {
        // prefer the nested `summary` field
        if (typeof (raw as SummaryRow).summary === "string") {
          setSummary((raw as SummaryRow).summary);
          setState("done");
          return;
        } else {
          // Fallback: stringify whole object if nested summary missing
          setSummary(JSON.stringify(raw));
          setState("done");
          return;
        }
      }

      // ultimate fallback
      setSummary(String(raw));
      setState("done");
    } catch (e: unknown) {
      console.error("SummarizeButton error:", e);
      setErr("Network error");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" onClick={handleClick} disabled={state === "working"}>
        {state === "working" ? "Summarizing…" : state === "done" ? "Summarized" : "Summarize"}
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
