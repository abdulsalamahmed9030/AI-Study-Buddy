import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "models/gemini-2.0-flash"; // ✅ use a supported model

export async function summarizeText(content: string): Promise<string> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const truncated = content.slice(0, 8000);

  const prompt = `
Summarize the following into concise study notes (max 150 words).
Text:
${truncated}
  `.trim();

  try {
    const resp = await model.generateContent(prompt);
    const text = resp.response.text().trim();

    if (!text) {
      throw new Error("Gemini returned empty summary");
    }

    return text;
  } catch (err: unknown) {
    console.error("🚨 GEMINI_SUMMARY_FAIL RAW >>>", err);
    throw new Error("Failed to summarize with Gemini");
  }
}
