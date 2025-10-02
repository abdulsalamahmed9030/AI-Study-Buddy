"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MeResponse = {
  email: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          setErrorMsg("Unauthorized");
          setMe(null);
          return;
        }
        const data: MeResponse = await res.json();
        if (!mounted) return;
        setMe(data);
        setUsername(data.username ?? "");
      } catch {
        setErrorMsg("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const initials = (() => {
    const name = me?.username ?? me?.email ?? "";
    const [a = "", b = ""] = name.split(/\s+/);
    return (a[0] ?? "").concat(b[0] ?? "").toUpperCase() || "U";
  })();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setOkMsg(null);
    try {
      const form = new FormData();
      form.append("username", username);
      if (avatarFile) form.append("avatar", avatarFile);

      const res = await fetch("/api/profile", {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Failed to update profile");
        return;
      }

      setOkMsg("Profile updated!");
      // refresh Navbar data
      router.refresh();
    } catch {
      setErrorMsg("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!me) {
    return <div className="p-6">You must be signed in.</div>;
  }

  return (
    <div className="p-6">
      <Card className="max-w-xl rounded-2xl">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {okMsg && <p className="text-sm text-green-600">{okMsg}</p>}

          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={me.avatar_url ?? undefined} alt={me.username ?? me.email ?? "User"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium">{me.email}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your display name"
                maxLength={64}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Square images look best (e.g., 256×256).
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.refresh()}>
                Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
