import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-pro";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const rawIp = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
  const hashedIp = await hashIp(rawIp);

  const { allowed, retryAfterSeconds } = checkRateLimit(hashedIp + ":health", 10, 200);
  if (!allowed) {
    return NextResponse.json(
      { error: `请求太频繁，请 ${retryAfterSeconds} 秒后重试。` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds || 60) } }
    );
  }

  const keyConfigured = Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
  const baseUrl = normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL);
  const model = process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL;

  return NextResponse.json({
    ok: keyConfigured,
    provider: baseUrl.includes("deepseek") ? "DeepSeek" : "OpenAI-compatible",
    model,
    baseUrl,
    keyConfigured
  });
}
