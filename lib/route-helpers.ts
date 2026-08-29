import { NextResponse } from "next/server";
import { createChatCompletion, streamChatCompletion } from "@/lib/ai-client";
import { saveAnalyticsEvent } from "@/lib/analytics";
import { classifyAnalyticsError, sanitizeSessionId } from "@/lib/analytics-core";
import { resolveCollectionConsent } from "@/lib/collection-consent";
import { saveCollectionEntry } from "@/lib/data-collection";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";

const MAX_DRAFT_LENGTH = 50000;
const MAX_FIELD_LENGTH = 5000;

export function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateDraft(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length > MAX_DRAFT_LENGTH) {
    throw new InputTooLargeError(`输入内容超过最大长度限制 ${MAX_DRAFT_LENGTH} 字符。`);
  }
  return trimmed;
}

export function validateField(value: unknown): string {
  const trimmed = stringField(value);
  if (trimmed.length > MAX_FIELD_LENGTH) {
    throw new InputTooLargeError(`输入内容超过最大长度限制 ${MAX_FIELD_LENGTH} 字符。`);
  }
  return trimmed;
}

export class InputTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputTooLargeError";
  }
}

export async function safeBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error("请求体格式错误，请重试。");
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getCollectionConsent(request: Request, fallback?: boolean) {
  return resolveCollectionConsent(request.headers.get("x-allow-collection"), fallback);
}

function getAnalyticsSessionId(request: Request) {
  return sanitizeSessionId(request.headers.get("x-analytics-session-id"));
}

function errorKind(caught: unknown): "timeout" | "error" {
  const message = caught instanceof Error ? caught.message : String(caught || "");
  return classifyAnalyticsError(message);
}

export async function checkQuota(request: Request): Promise<NextResponse | null> {
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  const hashedIp = await hashIp(rawIp);
  const { allowed, retryAfterSeconds } = checkRateLimit(hashedIp);
  if (!allowed) {
    return NextResponse.json(
      { error: `今日用量已用完，${retryAfterSeconds ? `约${Math.ceil(retryAfterSeconds / 3600)}小时后重置` : "请明天再试"}` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds || 3600) } }
    );
  }
  return null;
}

export async function runPrompt(system: string, user: string) {
  try {
    const text = await createChatCompletion([
      { role: "system", content: system },
      { role: "user", content: user }
    ]);
    if (!text.trim()) throw new Error("AI 未返回内容，请重试。");

    return NextResponse.json({ text });
  } catch (caught) {
    if (caught instanceof InputTooLargeError) {
      return NextResponse.json({ error: caught.message }, { status: 413 });
    }
    const message = caught instanceof Error ? caught.message : "生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function runPromptWithCollection(
  system: string,
  user: string,
  action: string,
  inputSummary: Record<string, unknown>,
  request: Request,
  allowCollection?: boolean
) {
  const startedAt = Date.now();
  const sessionId = getAnalyticsSessionId(request);
  try {
    const hashedIp = request.headers.get("x-hashed-ip") || "unknown";
    const consent = getCollectionConsent(request, allowCollection);

    const text = await createChatCompletion([
      { role: "system", content: system },
      { role: "user", content: user }
    ]);
    if (!text.trim()) throw new Error("AI 未返回内容，请重试。");

    saveCollectionEntry({
      timestamp: new Date().toISOString(),
      hashedIp,
      sessionId,
      action,
      input: inputSummary,
      outputText: text,
      consent
    }).catch(() => {
      // silently ignore collection errors
    });

    saveAnalyticsEvent({
      timestamp: new Date().toISOString(),
      sessionId,
      action,
      status: "success",
      eventType: "ai",
      durationMs: Date.now() - startedAt
    }).catch(() => {});

    return NextResponse.json({ text });
  } catch (caught) {
    saveAnalyticsEvent({
      timestamp: new Date().toISOString(),
      sessionId,
      action,
      status: "error",
      eventType: "ai",
      durationMs: Date.now() - startedAt,
      errorKind: errorKind(caught)
    }).catch(() => {});
    if (caught instanceof InputTooLargeError) {
      return NextResponse.json({ error: caught.message }, { status: 413 });
    }
    const message = caught instanceof Error ? caught.message : "生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function runPromptStream(
  system: string,
  user: string,
  action: string,
  inputSummary: Record<string, unknown>,
  request: Request,
  allowCollection?: boolean
) {
  const hashedIp = request.headers.get("x-hashed-ip") || "unknown";
  const consent = getCollectionConsent(request, allowCollection);
  const sessionId = getAnalyticsSessionId(request);
  const startedAt = Date.now();

  const stream = streamChatCompletion([
    { role: "system", content: system },
    { role: "user", content: user }
  ]);

  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          fullText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        if (!fullText.trim()) throw new Error("AI 未返回内容，请重试。");
        controller.close();

        saveCollectionEntry({
          timestamp: new Date().toISOString(),
          hashedIp,
          sessionId,
          action,
          input: inputSummary,
          outputText: fullText,
          consent
        }).catch(() => {});
        saveAnalyticsEvent({
          timestamp: new Date().toISOString(),
          sessionId,
          action,
          status: "success",
          eventType: "ai",
          durationMs: Date.now() - startedAt
        }).catch(() => {});
      } catch (caught) {
        saveAnalyticsEvent({
          timestamp: new Date().toISOString(),
          sessionId,
          action,
          status: "error",
          eventType: "ai",
          durationMs: Date.now() - startedAt,
          errorKind: errorKind(caught)
        }).catch(() => {});
        const message = caught instanceof Error ? caught.message : "生成失败";
        controller.enqueue(encoder.encode(`\n[ERROR] ${message}`));
        controller.close();
      }
    }
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no"
    }
  });
}
