"use client";

import { useEffect, useState } from "react";

interface FeedbackStats {
  total: number;
  praiseCount: number;
  suggestionCount: number;
  schools: string[];
  recent: Array<{
    id: string;
    timestamp: string;
    type: string;
    school?: string;
    message?: string;
  }>;
}

interface UsageStats {
  total: number;
  generateFramework: number;
  polishSection: number;
  reviewDraft: number;
  expertReview: number;
  originalDraft: number;
  finalOutput: number;
  uniqueUsers: number;
  trend: Array<{ date: string; count: number }>;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<FeedbackStats | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [fbRes, usageRes] = await Promise.all([
        fetch(`/api/admin/feedback?p=${encodeURIComponent(password)}`),
        fetch(`/api/admin/stats?p=${encodeURIComponent(password)}`)
      ]);

      if (!fbRes.ok || !usageRes.ok) throw new Error("密码错误或无权访问");

      setFeedback(await fbRes.json());
      setUsage(await usageRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setFeedback(null);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-[#FAF9F6] px-4 py-6 text-[#141413] sm:px-6">
      <section className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-extrabold">管理后台</h1>
        <div className="mb-6 flex gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAll()}
            placeholder="管理员密码"
            className="focus-ring h-10 rounded-md border border-[#E8E6E1] bg-white px-3 text-sm"
          />
          <button
            onClick={fetchAll}
            disabled={loading}
            className="focus-ring h-10 rounded-md bg-[#141413] px-5 text-sm font-bold text-white"
          >
            {loading ? "加载中..." : "查看"}
          </button>
        </div>
        {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}

        {usage && (
          <div className="space-y-6">
            {/* 使用数据 */}
            <div>
              <h2 className="mb-3 text-sm font-extrabold tracking-[0.12em] text-[#6B7280]">使用数据</h2>

              {/* 核心数字 */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold">{usage.total}</div>
                  <div className="text-xs text-[#6B7280]">AI 调用总计</div>
                </div>
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold">{usage.uniqueUsers}</div>
                  <div className="text-xs text-[#6B7280]">独立用户</div>
                </div>
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold">{usage.generateFramework}</div>
                  <div className="text-xs text-[#6B7280]">框架路径</div>
                </div>
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold">{usage.finalOutput}</div>
                  <div className="text-xs text-[#6B7280]">导出终稿</div>
                </div>
              </div>

              {/* 打磨路径明细 */}
              <div className="mb-4 rounded-md border border-[#E8E6E1] bg-white p-4">
                <h3 className="mb-2 text-xs font-bold text-[#6B7280]">打磨路径明细</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span>整体评阅 <strong>{usage.reviewDraft}</strong></span>
                  <span>逐栏打磨 <strong>{usage.polishSection}</strong></span>
                  <span>模拟预审 <strong>{usage.expertReview}</strong></span>
                  <span>上传草稿 <strong>{usage.originalDraft}</strong></span>
                </div>
              </div>

              {/* 7日趋势 */}
              <div className="rounded-md border border-[#E8E6E1] bg-white p-4">
                <h3 className="mb-2 text-xs font-bold text-[#6B7280]">近 7 天活动</h3>
                <div className="flex items-end gap-2 h-20">
                  {usage.trend.map((d) => {
                    const maxCount = Math.max(...usage.trend.map((t) => t.count), 1);
                    const height = Math.max(d.count > 0 ? (d.count / maxCount) * 100 : 2, 2);
                    return (
                      <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs font-bold text-[#141413]">{d.count}</span>
                        <div
                          className="w-full rounded-sm bg-[#141413] transition-all"
                          style={{ height: `${height}%`, minHeight: 4, opacity: d.count > 0 ? 1 : 0.15 }}
                        />
                        <span className="text-[10px] text-[#9CA3AF]">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {feedback && (
              <>
                <hr className="border-[#E8E6E1]" />

                {/* 反馈数据 */}
                <div>
                  <h2 className="mb-3 text-sm font-extrabold tracking-[0.12em] text-[#6B7280]">用户反馈</h2>

                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                      <div className="text-xl font-extrabold">{feedback.total}</div>
                      <div className="text-xs text-[#6B7280]">总计</div>
                    </div>
                    <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                      <div className="text-xl font-extrabold text-[#16A34A]">{feedback.praiseCount}</div>
                      <div className="text-xs text-[#6B7280]">挺好用</div>
                    </div>
                    <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                      <div className="text-xl font-extrabold text-[#D97706]">{feedback.suggestionCount}</div>
                      <div className="text-xs text-[#6B7280]">提建议</div>
                    </div>
                  </div>

                  {feedback.schools.length > 0 && (
                    <div className="mb-4 rounded-md border border-[#E8E6E1] bg-white p-4">
                      <h3 className="mb-2 text-xs font-bold text-[#6B7280]">使用学校</h3>
                      <div className="flex flex-wrap gap-2">
                        {feedback.schools.map((s) => (
                          <span key={s} className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-2.5 py-1 text-xs text-[#141413]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {feedback.recent.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-[#E8E6E1] bg-white p-4 text-sm">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`font-bold ${entry.type === "praise" ? "text-[#16A34A]" : "text-[#D97706]"}`}>
                            {entry.type === "praise" ? "挺好用" : "提建议"}
                          </span>
                          {entry.school && <span className="text-[#6B7280]">{entry.school}</span>}
                          <span className="text-[#9CA3AF] text-xs">{entry.timestamp.slice(0, 10)}</span>
                        </div>
                        {entry.message && <p className="text-[#141413]">{entry.message}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
