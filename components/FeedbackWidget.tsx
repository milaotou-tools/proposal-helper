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
      <div className="surface px-5 py-4 text-center text-sm text-slate-600">
        感谢你的反馈！
      </div>
    );
  }

  return (
    <div className="surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">谢谢你使用我做的工具，这个工具对你有帮助吗？</h3>
      <div className="mb-4 flex gap-3">
        <button
          type="button"
          onClick={() => setType("praise")}
          className={`focus-ring btn h-10 px-4 text-sm ${
            type === "praise"
              ? "btn-primary"
              : "btn-secondary"
          }`}
        >
          挺好用
        </button>
        <button
          type="button"
          onClick={() => setType("suggestion")}
          className={`focus-ring btn h-10 px-4 text-sm ${
            type === "suggestion"
              ? "btn-primary"
              : "btn-secondary"
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
            className="focus-ring control mb-3"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={type === "suggestion" ? "你的建议（选填）" : "想对作者说的话（选填）"}
            rows={3}
            className="focus-ring control-area mb-3"
          />
          {error && <p className="mb-3 text-xs text-rose-500">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="focus-ring btn btn-primary h-10 px-5"
          >
            {submitting ? "提交中..." : "提交反馈"}
          </button>
        </>
      )}
    </div>
  );
}
