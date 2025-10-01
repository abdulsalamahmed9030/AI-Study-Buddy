import { z } from "zod";

export const materialTypeEnum = z.enum(["text", "pdf"]);

export const createTextMaterialSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.literal("text"),
  content: z.string().min(1, "Content is required"),
});

export type CreateTextMaterialValues = z.infer<typeof createTextMaterialSchema>;
