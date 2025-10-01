"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpValues } from "@/lib/validation/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"; // ✅ FIXED

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient(); // ✅ client-safe
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", username: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: SignUpValues) {
    setErrorMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { username: values.username },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    const session = data.session;
    setLoading(false);
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/sign-in"); // email confirm flow
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Card className="w-full rounded-2xl">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Start studying smarter in minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...form.register("username")} placeholder="abdul_salam" />
              {form.formState.errors.username && (
                <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} placeholder="you@example.com" />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} placeholder="••••••••" />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
