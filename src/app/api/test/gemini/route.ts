import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

function j(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

export async function GET() {
  try {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
      return j(400, { ok: false, step: "ENV", error: "GOOGLE_GENERATIVE_AI_API_KEY is missing" });
    }

    const genAI = new GoogleGenerativeAI(key);

    // ✅ Correct model ID format
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
    // Or: "models/gemini-pro-latest"
    // Or: "models/gemini-2.5-flash"

    const resp = await model.generateContent("Say OK");
    const text = resp.response.text().trim();

    return j(200, { ok: true, text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return j(502, { ok: false, step: "GEMINI_PING", error: msg });
  }
}
