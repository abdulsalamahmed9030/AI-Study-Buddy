import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

/** ===== pdf-parse (primary) ===== */
type PdfParseFn = (input: Uint8Array | Buffer) => Promise<{ text: string }>;

async function loadPdfParse(): Promise<PdfParseFn | null> {
  const mod: unknown = await import("pdf-parse");
  if (typeof (mod as { default?: unknown }).default === "function") {
    return (mod as { default: PdfParseFn }).default;
  }
  if (typeof mod === "function") {
    return mod as PdfParseFn;
  }
  return null;
}

/** ===== pdfjs-dist (fallback, legacy build, no worker) ===== */
type PdfJsTextItem = { str?: string };
type PdfJsTextContent = { items: PdfJsTextItem[] };
type PdfJsPage = { getTextContent: () => Promise<PdfJsTextContent> };
type PdfJsDocument = { numPages: number; getPage: (n: number) => Promise<PdfJsPage> };
type PdfJsLoadingTask = { promise: Promise<PdfJsDocument> };

async function extractTextWithPdfJs(u8: Uint8Array): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task: PdfJsLoadingTask = getDocument({ data: u8, disableWorker: true });
  const doc: PdfJsDocument = await task.promise;

  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page: PdfJsPage = await doc.getPage(i);
    const text: PdfJsTextContent = await page.getTextContent();

    console.log(`PDFJS Page ${i} items count:`, text.items.length);
    console.log(`PDFJS Page ${i} items sample:`, text.items.slice(0, 10));

    let line = "";
    for (const item of text.items) {
      const s = item.str ?? "";
      if (s.length > 0) line += s;
    }
    out += line.trimEnd() + "\n";
  }
  return out.trim();
}

export async function GET() {
  try {
    const supabase = await createSupabaseRouteClient();

    const { data, error } = await supabase.auth.getUser(); // ✅ fixed name
    if (error || !data?.user) {
      return json(401, { step: "AUTH_GET", error: error?.message ?? "Unauthorized", session: false });
    }

    const { error: qErr } = await supabase
      .from("materials")
      .select("id", { count: "exact", head: true });

    if (qErr) {
      return json(400, { step: "DB_GET", error: qErr.message, session: true });
    }
    return json(200, { ok: true, session: true });
  } catch (err) {
    console.error("MATERIALS_ROUTE_FATAL_GET", err);
    return json(500, { step: "FATAL_GET", error: "Internal error" });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();

    const { data, error: userErr } = await supabase.auth.getUser();
    if (userErr || !data?.user) {
      return json(401, { step: "AUTH", error: userErr?.message ?? "Unauthorized" });
    }
    const userId = data.user.id;
    const contentType = req.headers.get("content-type") ?? "";

    // ---------- JSON ----------
    if (contentType.includes("application/json")) {
      let body: { title?: string; content?: string } | undefined;
      try {
        body = (await req.json()) as { title?: string; content?: string };
      } catch (err) {
        console.error("JSON_PARSE_ERROR", err);
        return json(400, { step: "JSON_PARSE", error: "Invalid JSON" });
      }

      const { title, content } = body ?? {};
      if (!title || !content) {
        return json(400, { step: "JSON_VALIDATE", error: "Missing title or content" });
      }

      const { error: insErr } = await supabase.from("materials").insert({
        user_id: userId,
        title,
        content,
        type: "text",
        storage_path: null,
      });

      if (insErr) {
        console.error("MATERIALS_INSERT_TEXT", insErr);
        return json(400, { step: "DB_INSERT_TEXT", error: insErr.message });
      }
      return json(201, { ok: true, type: "text" });
    }

    // ---------- multipart/form-data: PDF ----------
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = form.get("title");
      const file = form.get("file");

      if (typeof title !== "string" || !file || !(file instanceof File)) {
        return json(400, { step: "FORM_VALIDATE", error: "Invalid form data" });
      }
      if (!file.type || !file.type.includes("pdf")) {
        return json(400, { step: "FORM_FILETYPE", error: "File must be a PDF" });
      }

      let u8: Uint8Array;
      try {
        const arrayBuffer = await file.arrayBuffer();
        u8 = new Uint8Array(arrayBuffer);
      } catch (err) {
        console.error("PDF_ARRAYBUFFER_ERROR", err);
        return json(400, { step: "PDF_ARRAYBUFFER", error: "Failed to read uploaded file" });
      }

      let extractedText = "";
      try {
        const pdfParse = await loadPdfParse();
        if (pdfParse) {
          const parsed = await pdfParse(u8);
          extractedText = (parsed.text || "").trim();
        }
      } catch (err) {
        console.warn("PDF_PARSE_PRIMARY_FAIL (will try fallback)", err);
      }

      if (!extractedText) {
        try {
          extractedText = (await extractTextWithPdfJs(u8)).trim();
        } catch (err) {
          console.error("PDF_PARSE_FALLBACK_ERROR", err);
          return json(422, { step: "PDF_PARSE", error: "Could not extract text from PDF" });
        }
      }

      if (!extractedText) {
        return json(422, { step: "PDF_EMPTY", error: "No text found in PDF" });
      }

      const safeName = file.name.replace(/\s+/g, "_");
      const storagePath = `${userId}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("materials")
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (upErr) {
        console.error("STORAGE_UPLOAD_ERROR", upErr);
        return json(400, { step: "STORAGE_UPLOAD", error: upErr.message });
      }

      const { error: insErr } = await supabase.from("materials").insert({
        user_id: userId,
        title,
        content: extractedText,
        type: "pdf",
        storage_path: storagePath,
      });

      if (insErr) {
        console.error("MATERIALS_INSERT_PDF", insErr);
        await supabase.storage.from("materials").remove([storagePath]);
        return json(400, { step: "DB_INSERT_PDF", error: insErr.message });
      }
      return json(201, { ok: true, type: "pdf" });
    }

    return json(415, { step: "CONTENT_TYPE", error: "Unsupported content type" });
  } catch (err) {
    console.error("MATERIALS_ROUTE_FATAL_POST", err);
    return json(500, { step: "FATAL", error: "Internal error" });
  }
}
