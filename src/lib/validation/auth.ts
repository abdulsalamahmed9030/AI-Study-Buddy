import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
  username: z
    .string()
    .min(2, "Min 2 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-z0-9_]+$/i, "Letters/numbers/underscore only"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
