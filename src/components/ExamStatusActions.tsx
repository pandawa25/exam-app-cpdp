"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExamStatusActions({ examId, status }: { examId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    await fetch(`/api/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  if (status === "DRAFT") {
    return (
      <button
        onClick={() => setStatus("PUBLISHED")}
        disabled={loading}
        className="action link disabled:opacity-50"
      >
        Publish
      </button>
    );
  }
  if (status === "PUBLISHED") {
    return (
      <button
        onClick={() => setStatus("CLOSED")}
        disabled={loading}
        className="action text-ink-soft hover:underline disabled:opacity-50"
      >
        Tutup
      </button>
    );
  }
  return <span className="action text-ink-mute">Ditutup</span>;
}
