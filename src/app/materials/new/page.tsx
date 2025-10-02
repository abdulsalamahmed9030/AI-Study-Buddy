"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTextMaterialSchema,
  type CreateTextMaterialValues,
} from "@/lib/validation/materials";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function NewMaterialPage() {
  const router = useRouter();

  // Tab state
  const [tab, setTab] = useState<"text" | "pdf">("text");

  // Text form
  const textForm = useForm<CreateTextMaterialValues>({
    resolver: zodResolver(createTextMaterialSchema),
    defaultValues: { title: "", type: "text", content: "" },
    mode: "onBlur",
  });

  // PDF state
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submitText(values: CreateTextMaterialValues) {
    setErr(null);
    setLoading(true);

    // Save text material with title and content
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: values.title || "Untitled material", content: values.content }),
      credentials: "same-origin", // ✅ send Supabase auth cookies
    });

    setLoading(false);

    if (!res.ok) {
      const j = (await res.json()) as { error?: string; step?: string };
      setErr(`${j.step ?? "SERVER"}: ${j.error ?? "Failed to save"}`);
      return;
    }

    router.push("/materials");
  }

  async function submitPdf() {
    if (!pdfFile) {
      setErr("Choose a PDF file");
      return;
    }
    if (!pdfTitle.trim()) {
      setErr("Title is required");
      return;
    }
    if (pdfFile.size > 20 * 1024 * 1024) {
      setErr("PDF is too large (max ~20MB)");
      return;
    }

    setErr(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("title", pdfTitle);
    fd.append("file", pdfFile);

    const res = await fetch("/api/materials", {
      method: "POST",
      body: fd,
      credentials: "same-origin", // ✅ send Supabase auth cookies
    });

    setLoading(false);

    if (!res.ok) {
      const j = (await res.json()) as { error?: string; step?: string };
      setErr(`${j.step ?? "SERVER"}: ${j.error ?? "Failed to save"}`);
      return;
    }

    router.push("/materials");
  }

  return (
    <AppShell>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add Material</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tab === "text" ? "default" : "secondary"}
              onClick={() => setTab("text")}
              disabled={loading}
            >
              Text / Markdown
            </Button>
            <Button
              type="button"
              variant={tab === "pdf" ? "default" : "secondary"}
              onClick={() => setTab("pdf")}
              disabled={loading}
            >
              PDF Upload
            </Button>
          </div>

          {tab === "text" ? (
            <form
              className="space-y-4"
              onSubmit={textForm.handleSubmit(submitText)}
            >
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...textForm.register("title")}
                  placeholder="e.g. Chapter 3 Notes"
                  disabled={loading}
                />
                {textForm.formState.errors.title && (
                  <p className="text-sm text-red-600">
                    {textForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  {...textForm.register("content")}
                  className="min-h-[200px] w-full rounded-xl border bg-background p-3 font-mono text-sm"
                  placeholder="Paste your raw text or markdown here…"
                  disabled={loading}
                />
                {textForm.formState.errors.content && (
                  <p className="text-sm text-red-600">
                    {textForm.formState.errors.content.message}
                  </p>
                )}
              </div>

              {err && <p className="text-sm text-red-600">{err}</p>}

              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save Text Material"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-title">Title</Label>
                <Input
                  id="pdf-title"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="e.g. Lecture Slides Week 2"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-file">PDF File</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  disabled={loading}
                />
              </div>

              {err && <p className="text-sm text-red-600">{err}</p>}

              <Button type="button" onClick={submitPdf} disabled={loading}>
                {loading ? "Uploading…" : "Upload PDF & Extract"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
