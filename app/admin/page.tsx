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
  quality: {
    recent: QualityMetric;
    all: QualityMetric;
    frameworkFunnel: { requested: number; succeeded: number };
    draftFunnel: { diagnosed: number; polished: number; reviewed: number; exported: number };
  };
}

interface QualityMetric {
  total: number;
  successRate: number;
  failureRate: number;
  timeoutRate: number;
  averageDurationMs: number | null;
}

interface RecordSummary {
  id: string;
  timestamp: string;
  anonymousId: string;
  action: string;
  inputPreview: string;
  outputPreview: string;
}

interface RecordDetail {
  id: string;
  timestamp: string;
  action: string;
  input: Record<string, unknown>;
  outputText: string;
}

const ACTION_LABELS: Record<string, string> = {
  "generate-framework": "生成框架",
  "review-draft": "整体诊断",
  "polish-section": "逐栏打磨",
  "expert-review": "模拟预审",
  "final-output": "导出终稿",
  "topic-guidance": "选题建议",
  "suggest-outputs": "成果建议",
  "generate-livepage": "生成展示页"
};

function formatBeijing(timestamp: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(timestamp));
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) return "—";
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)} 秒` : `${durationMs} 毫秒`;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<FeedbackStats | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [recordAction, setRecordAction] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RecordDetail | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [fbRes, usageRes, recordsRes] = await Promise.all([
        fetch("/api/admin/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ p: password })
        }),
        fetch("/api/admin/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ p: password })
        }),
        fetch("/api/admin/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ p: password, action: recordAction })
        })
      ]);

      if (!fbRes.ok || !usageRes.ok || !recordsRes.ok) throw new Error("密码错误或无权访问");

      setFeedback(await fbRes.json());
      setUsage(await usageRes.json());
      setRecords((await recordsRes.json()).records || []);
      setSelectedRecord(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setFeedback(null);
      setUsage(null);
      setRecords([]);
      setSelectedRecord(null);
    } finally {
      setLoading(false);
    }
  }

  async function changeRecordAction(action: string) {
    setRecordAction(action);
    setSelectedRecord(null);
    if (!usage) return;
    try {
      const response = await fetch("/api/admin/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p: password, action })
      });
      if (!response.ok) throw new Error("记录加载失败");
      setRecords((await response.json()).records || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "记录加载失败");
    }
  }

  async function openRecord(id: string) {
    setLoadingRecord(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/records/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p: password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error === "Unauthorized" ? "密码错误或无权访问" : "全文加载失败");
      setSelectedRecord(data as RecordDetail);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "全文加载失败");
    } finally {
      setLoadingRecord(false);
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

            <hr className="border-[#E8E6E1]" />

            <div>
              <h2 className="mb-3 text-sm font-extrabold tracking-[0.12em] text-[#6B7280]">运营质量</h2>
              <p className="mb-3 text-xs text-[#9CA3AF]">从本功能上线后开始统计；未同意内容收集的请求只计入这里的匿名指标。</p>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold text-[#16A34A]">{usage.quality.recent.successRate}%</div>
                  <div className="text-xs text-[#6B7280]">近 7 天成功率</div>
                  <div className="mt-1 text-[10px] text-[#9CA3AF]">累计 {usage.quality.all.successRate}%</div>
                </div>
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold text-[#DC2626]">{usage.quality.recent.failureRate}%</div>
                  <div className="text-xs text-[#6B7280]">近 7 天失败率</div>
                  <div className="mt-1 text-[10px] text-[#9CA3AF]">累计 {usage.quality.all.failureRate}%</div>
                </div>
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold text-[#D97706]">{usage.quality.recent.timeoutRate}%</div>
                  <div className="text-xs text-[#6B7280]">近 7 天超时率</div>
                  <div className="mt-1 text-[10px] text-[#9CA3AF]">累计 {usage.quality.all.timeoutRate}%</div>
                </div>
                <div className="rounded-md border border-[#E8E6E1] bg-white p-3 text-center">
                  <div className="text-xl font-extrabold">{formatDuration(usage.quality.recent.averageDurationMs)}</div>
                  <div className="text-xs text-[#6B7280]">近 7 天平均耗时</div>
                  <div className="mt-1 text-[10px] text-[#9CA3AF]">累计 {formatDuration(usage.quality.all.averageDurationMs)}</div>
                </div>
              </div>

              <div className="rounded-md border border-[#E8E6E1] bg-white p-4">
                <h3 className="mb-3 text-xs font-bold text-[#6B7280]">匿名会话完成漏斗</h3>
                <div className="mb-4">
                  <p className="mb-2 text-xs text-[#9CA3AF]">想法路径</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded border border-[#E8E6E1] p-2 text-center text-xs">框架请求 <strong className="block text-base">{usage.quality.frameworkFunnel.requested}</strong></div>
                    <div className="rounded border border-[#E8E6E1] p-2 text-center text-xs">框架成功 <strong className="block text-base">{usage.quality.frameworkFunnel.succeeded}</strong></div>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-[#9CA3AF]">草稿路径</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded border border-[#E8E6E1] p-2 text-center text-xs">整体诊断 <strong className="block text-base">{usage.quality.draftFunnel.diagnosed}</strong></div>
                    <div className="rounded border border-[#E8E6E1] p-2 text-center text-xs">至少打磨一次 <strong className="block text-base">{usage.quality.draftFunnel.polished}</strong></div>
                    <div className="rounded border border-[#E8E6E1] p-2 text-center text-xs">模拟预审 <strong className="block text-base">{usage.quality.draftFunnel.reviewed}</strong></div>
                    <div className="rounded border border-[#E8E6E1] p-2 text-center text-xs">导出终稿 <strong className="block text-base">{usage.quality.draftFunnel.exported}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#E8E6E1]" />

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold tracking-[0.12em] text-[#6B7280]">近期生成记录</h2>
                  <p className="mt-1 text-xs text-[#9CA3AF]">仅显示已同意内容收集的成功生成，最多 50 条。</p>
                </div>
                <select
                  value={recordAction}
                  onChange={(event) => changeRecordAction(event.target.value)}
                  className="focus-ring rounded-md border border-[#E8E6E1] bg-white px-3 py-2 text-sm"
                >
                  <option value="">全部操作</option>
                  {Object.entries(ACTION_LABELS).map(([action, label]) => <option key={action} value={action}>{label}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {records.length === 0 && <div className="rounded-md border border-dashed border-[#E8E6E1] bg-white p-4 text-sm text-[#6B7280]">暂无符合条件的内容记录。</div>}
                {records.map((record) => (
                  <div key={record.id} className="rounded-md border border-[#E8E6E1] bg-white p-4 text-sm">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
                        <strong className="text-[#141413]">{ACTION_LABELS[record.action] || record.action}</strong>
                        <span>{formatBeijing(record.timestamp)}</span>
                        <span>{record.anonymousId}</span>
                      </div>
                      <button onClick={() => openRecord(record.id)} disabled={loadingRecord} className="focus-ring rounded-md border border-[#E8E6E1] px-3 py-1.5 text-xs font-bold text-[#141413]">
                        {loadingRecord ? "加载中..." : "展开全文"}
                      </button>
                    </div>
                    <p className="mb-1 text-xs text-[#6B7280]">输入摘要：{record.inputPreview || "—"}</p>
                    <p className="text-xs text-[#6B7280]">结果摘要：{record.outputPreview || "—"}</p>
                  </div>
                ))}
              </div>

              {selectedRecord && (
                <div className="mt-4 rounded-md border border-[#141413] bg-white p-4 text-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-extrabold">{ACTION_LABELS[selectedRecord.action] || selectedRecord.action}全文</h3>
                    <button onClick={() => setSelectedRecord(null)} className="focus-ring text-xs text-[#6B7280]">收起</button>
                  </div>
                  <p className="mb-2 text-xs font-bold text-[#6B7280]">输入</p>
                  <pre className="mb-4 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-[#FAF9F6] p-3 text-xs leading-6">{JSON.stringify(selectedRecord.input, null, 2)}</pre>
                  <p className="mb-2 text-xs font-bold text-[#6B7280]">生成结果</p>
                  <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded bg-[#FAF9F6] p-3 text-xs leading-6">{selectedRecord.outputText}</pre>
                </div>
              )}
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
