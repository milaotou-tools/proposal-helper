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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/feedback?p=${encodeURIComponent(password)}`);
      if (!res.ok) throw new Error("密码错误或无权访问");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 py-6 text-[#141413] sm:px-6">
      <section className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-extrabold">反馈管理</h1>
        <div className="mb-6 flex gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchStats()}
            placeholder="管理员密码"
            className="focus-ring h-10 rounded-md border border-[#E8E6E1] bg-white px-3 text-sm"
          />
          <button
            onClick={fetchStats}
            disabled={loading}
            className="focus-ring h-10 rounded-md bg-[#141413] px-5 text-sm font-bold text-white"
          >
            {loading ? "加载中..." : "查看"}
          </button>
        </div>
        {error && <p className="mb-4 text-sm text-[#DC2626]">{error}</p>}
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-md border border-[#E8E6E1] bg-white p-4 text-center">
                <div className="text-2xl font-extrabold">{stats.total}</div>
                <div className="text-xs text-[#6B7280]">总计</div>
              </div>
              <div className="rounded-md border border-[#E8E6E1] bg-white p-4 text-center">
                <div className="text-2xl font-extrabold text-[#16A34A]">{stats.praiseCount}</div>
                <div className="text-xs text-[#6B7280]">好评</div>
              </div>
              <div className="rounded-md border border-[#E8E6E1] bg-white p-4 text-center">
                <div className="text-2xl font-extrabold text-[#D97706]">{stats.suggestionCount}</div>
                <div className="text-xs text-[#6B7280]">建议</div>
              </div>
            </div>
            {stats.schools.length > 0 && (
              <div className="rounded-md border border-[#E8E6E1] bg-white p-4">
                <h2 className="mb-2 text-sm font-extrabold text-[#141413]">使用学校</h2>
                <div className="flex flex-wrap gap-2">
                  {stats.schools.map((s) => (
                    <span key={s} className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-2.5 py-1 text-xs text-[#141413]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {stats.recent.map((entry) => (
                <div key={entry.id} className="rounded-md border border-[#E8E6E1] bg-white p-4 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`font-bold ${entry.type === "praise" ? "text-[#16A34A]" : "text-[#D97706]"}`}>
                      {entry.type === "praise" ? "好评" : "建议"}
                    </span>
                    {entry.school && <span className="text-[#6B7280]">{entry.school}</span>}
                    <span className="text-[#9CA3AF] text-xs">{entry.timestamp}</span>
                  </div>
                  {entry.message && <p className="text-[#141413]">{entry.message}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
