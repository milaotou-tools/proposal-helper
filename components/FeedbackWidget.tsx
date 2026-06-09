"use client";

import { useState } from "react";

export function FeedbackWidget() {
  const [showForm, setShowForm] = useState(false);
  const [school, setSchool] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "suggestion", school: school || undefined, message: message || undefined })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "提交失败");
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p className="text-xs text-[#9CA3AF]">感谢反馈。</p>;
  }

  if (!showForm) {
    return (
      <button type="button" onClick={() => setShowForm(true)} className="text-sm text-[#6B7280] transition hover:text-[#141413]">
        我要反馈
      </button>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      {error && <p className="text-[#DC2626]">{error}</p>}
      <input
        value={school}
        onChange={(e) => setSchool(e.target.value)}
        placeholder="学校（选填）"
        className="w-full rounded border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm text-[#141413] placeholder:text-[#9CA3AF]"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="建议或评价..."
        rows={2}
        className="w-full rounded border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm text-[#141413] placeholder:text-[#9CA3AF] resize-none"
      />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setShowForm(false); setError(""); }}
          className="rounded border border-[#E8E6E1] bg-white px-5 py-1.5 text-sm text-[#9CA3AF] transition hover:text-[#6B7280]"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded border border-[#D1D5DB] bg-white px-5 py-1.5 text-sm text-[#141413] transition hover:bg-[#F3F2EF] disabled:opacity-40"
        >
          {submitting ? "提交中..." : "提交"}
        </button>
      </div>
    </div>
  );
}
