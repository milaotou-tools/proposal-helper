"use client";

import { useState } from "react";

export function FeedbackWidget() {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"praise" | "suggestion" | null>(null);
  const [school, setSchool] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!type) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, school: school || undefined, message: message || undefined })
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
      <button type="button" onClick={() => setShowForm(true)} className="text-xs text-[#9CA3AF] transition hover:text-[#141413]">
        反馈
      </button>
    );
  }

  return (
    <div className="space-y-2 text-xs text-[#9CA3AF]">
      {error && <p className="text-[#DC2626]">{error}</p>}
      <div className="flex items-center gap-2">
        <span>类型：</span>
        <button
          type="button"
          onClick={() => setType(type === "praise" ? null : "praise")}
          className={`rounded border px-2 py-0.5 transition ${type === "praise" ? "border-[#141413] bg-[#141413] text-white" : "border-[#D1D5DB] bg-white text-[#141413] hover:bg-[#F3F2EF]"}`}
        >
          好用
        </button>
        <button
          type="button"
          onClick={() => setType(type === "suggestion" ? null : "suggestion")}
          className={`rounded border px-2 py-0.5 transition ${type === "suggestion" ? "border-[#141413] bg-[#141413] text-white" : "border-[#D1D5DB] bg-white text-[#141413] hover:bg-[#F3F2EF]"}`}
        >
          提建议
        </button>
      </div>
      <input
        value={school}
        onChange={(e) => setSchool(e.target.value)}
        placeholder="学校（选填）"
        className="w-full rounded border border-[#E8E6E1] bg-white px-2 py-1 text-xs text-[#141413] placeholder:text-[#D1D5DB]"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={type === "suggestion" ? "建议（选填）" : "评价（选填）"}
        rows={2}
        className="w-full rounded border border-[#E8E6E1] bg-white px-2 py-1 text-xs text-[#141413] placeholder:text-[#D1D5DB] resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded border border-[#D1D5DB] bg-white px-2 py-0.5 text-xs text-[#141413] transition hover:bg-[#F3F2EF] disabled:opacity-50"
        >
          {submitting ? "提交中..." : "提交"}
        </button>
        <button
          type="button"
          onClick={() => { setShowForm(false); setType(null); setError(""); }}
          className="text-[#D1D5DB] hover:text-[#9CA3AF]"
        >
          取消
        </button>
      </div>
    </div>
  );
}
