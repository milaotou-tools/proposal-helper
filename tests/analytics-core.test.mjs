import test from "node:test";
import assert from "node:assert/strict";
import { buildQualitySnapshot, classifyAnalyticsError, sanitizeSessionId } from "../lib/analytics-core.ts";
import { parseAnalyticsLines } from "../lib/analytics.ts";
import { buildGroupedPolishRecord, groupCollectionRecords, summarizeCollectionRecord } from "../lib/admin-records.ts";

test("sanitizes a browser session id and rejects an invalid identifier", () => {
  assert.equal(sanitizeSessionId("session_1234567890"), "session_1234567890");
  assert.equal(sanitizeSessionId("<script>"), "unknown");
});

test("classifies model timeout errors separately from other failures", () => {
  assert.equal(classifyAnalyticsError("模型接口响应超时，请稍后重试。"), "timeout");
  assert.equal(classifyAnalyticsError("upstream unavailable"), "error");
});

test("builds quality rates and unique-session funnels without content", () => {
  const events = [
    { timestamp: "2026-08-29T00:00:00.000Z", sessionId: "s-1", action: "generate-framework", status: "success", durationMs: 1000, eventType: "ai" },
    { timestamp: "2026-08-29T00:01:00.000Z", sessionId: "s-2", action: "generate-framework", status: "error", durationMs: 120000, errorKind: "timeout", eventType: "ai" },
    { timestamp: "2026-08-29T00:02:00.000Z", sessionId: "s-1", action: "review-draft", status: "success", durationMs: 2000, eventType: "ai" },
    { timestamp: "2026-08-29T00:03:00.000Z", sessionId: "s-1", action: "polish-section", status: "success", durationMs: 3000, eventType: "ai" },
    { timestamp: "2026-08-29T00:04:00.000Z", sessionId: "s-1", action: "expert-review", status: "success", durationMs: 4000, eventType: "ai" },
    { timestamp: "2026-08-29T00:05:00.000Z", sessionId: "s-1", action: "final-output", status: "success", eventType: "completion" },
    { timestamp: "2026-08-29T00:06:00.000Z", sessionId: "s-3", action: "expert-review", status: "success", durationMs: 1000, eventType: "ai" },
    { timestamp: "2026-08-29T00:07:00.000Z", sessionId: "s-3", action: "final-output", status: "success", eventType: "completion" }
  ];

  const snapshot = buildQualitySnapshot(events, new Date("2026-08-29T12:00:00.000Z"));

  assert.deepEqual(snapshot.all, { total: 6, successRate: 83, failureRate: 17, timeoutRate: 17, averageDurationMs: 2200 });
  assert.deepEqual(snapshot.frameworkFunnel, { requested: 2, succeeded: 1 });
  assert.deepEqual(snapshot.draftFunnel, { diagnosed: 1, polished: 1, reviewed: 1, exported: 1 });
});

test("reads only valid anonymous analytics events from JSONL", () => {
  const entries = parseAnalyticsLines([
    JSON.stringify({ timestamp: "2026-08-29T00:00:00.000Z", sessionId: "session_1234567890", action: "review-draft", status: "success", durationMs: 1234, eventType: "ai" }),
    "{broken json}",
    JSON.stringify({ timestamp: "not-a-date", sessionId: "session_1234567890", action: "review-draft", status: "success", eventType: "ai" })
  ].join("\n"));

  assert.equal(entries.length, 1);
  assert.equal(entries[0].durationMs, 1234);
});

test("summarizes consented generated content without returning its full text", () => {
  const summary = summarizeCollectionRecord({
    id: "MjAyNi0wOC0yOS5qc29uOjA",
    entry: {
      timestamp: "2026-08-29T00:00:00.000Z",
      sessionId: "session_1234567890",
      hashedIp: "legacy-ip-hash",
      action: "generate-framework",
      input: { idea: "A".repeat(200) },
      outputText: "B".repeat(400),
      consent: true
    }
  });

  assert.equal(summary.anonymousId, "会话 session_");
  assert.match(summary.inputPreview, /…$/);
  assert.match(summary.outputPreview, /…$/);
  assert.equal("outputText" in summary, false);
});

test("groups polish records only when they share the same draft work id", () => {
  const record = (id, workId, section) => ({
    id,
    entry: {
      timestamp: `2026-08-29T00:0${id}:00.000Z`, sessionId: "session_1234567890", hashedIp: "ip", action: "polish-section",
      input: { section, draft: "草稿" }, outputText: `${section}结果`, consent: true, workId
    }
  });

  const summaries = groupCollectionRecords([
    record("1", "draft_1234567890", "研究目标"),
    record("2", "draft_1234567890", "研究内容"),
    record("3", "draft_abcdefghij", "研究目标")
  ]);

  assert.equal(summaries.length, 2);
  const grouped = summaries.find((summary) => summary.inputPreview.includes("2 次"));
  assert.equal(grouped?.action, "polish-section");
});

test("keeps every section when building a grouped polish detail", () => {
  const record = (id, section) => ({
    id,
    entry: { timestamp: `2026-08-29T00:0${id}:00.000Z`, sessionId: "session_1234567890", hashedIp: "ip", action: "polish-section", input: { section }, outputText: `${section}结果`, consent: true, workId: "draft_1234567890" }
  });
  const detail = buildGroupedPolishRecord("draft_1234567890", [record("1", "研究目标"), record("2", "研究内容")]);

  assert.equal(detail.groupedItems.length, 2);
  assert.deepEqual(detail.groupedItems.map((item) => item.section), ["研究内容", "研究目标"]);
});
