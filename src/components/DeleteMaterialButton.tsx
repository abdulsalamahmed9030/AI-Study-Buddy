"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteMaterialButton({ materialId }: { materialId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    if (!confirm("Are you sure you want to delete this material? This cannot be undone.")) {
      return;
    }

    setSubmitting(true);
    try {
      // Your API route is /api/materials/[id]/delete
      const res = await fetch(`/api/materials/${materialId}/delete`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/materials");
        router.refresh();
      } else {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        alert("Delete failed: " + (json?.error ?? res.statusText));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleDelete}>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-2xl border px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-900/30"
      >
        {submitting ? "Deleting…" : "Delete"}
      </button>
    </form>
  );
}
