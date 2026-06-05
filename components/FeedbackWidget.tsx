"use client";

import { useState } from "react";

export function FeedbackWidget() {
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
    return (
      <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-5 py-4 text-center text-sm text-[#6B7280]">
        感谢你的反馈！
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[#E8E6E1] bg-white p-5">
      <h3 className="mb-3 text-sm font-extrabold text-[#141413]">谢谢你使用我做的工具，这个工具对你有帮助吗？</h3>
      <div className="mb-4 flex gap-3">
        <button
          type="button"
          onClick={() => setType("praise")}
          className={`focus-ring h-10 rounded-md px-4 text-sm font-bold transition ${
            type === "praise"
              ? "bg-[#141413] text-white"
              : "border border-[#D1D5DB] bg-white text-[#141413] hover:bg-[#F3F2EF]"
          }`}
        >
          挺好用
        </button>
        <button
          type="button"
          onClick={() => setType("suggestion")}
          className={`focus-ring h-10 rounded-md px-4 text-sm font-bold transition ${
            type === "suggestion"
              ? "bg-[#141413] text-white"
              : "border border-[#D1D5DB] bg-white text-[#141413] hover:bg-[#F3F2EF]"
          }`}
        >
          提建议
        </button>
      </div>

      {type && (
        <>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="请填写您所在学校，帮助作者了解使用小工具的小伙伴在哪里～"
            className="focus-ring mb-3 h-10 w-full rounded-md border border-[#E8E6E1] bg-white px-3 text-sm text-[#141413] placeholder:text-[#9CA3AF]"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={type === "suggestion" ? "你的建议（选填）" : "想对作者说的话（选填）"}
            rows={3}
            className="focus-ring mb-3 w-full resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm text-[#141413] placeholder:text-[#9CA3AF]"
          />
          {error && <p className="mb-3 text-xs text-[#DC2626]">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="focus-ring h-10 rounded-md bg-[#141413] px-5 text-sm font-extrabold text-white transition hover:bg-[#2A2A28] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]"
          >
            {submitting ? "提交中..." : "提交反馈"}
          </button>
        </>
      )}
    </div>
  );
}
