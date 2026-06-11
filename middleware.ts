import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";

const API_PATTERNS = [
  "/api/generate-framework",
  "/api/review-draft",
  "/api/polish-section",
  "/api/expert-review",
  "/api/topic-guidance",
  "/api/suggest-outputs",
  "/api/generate-livepage",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAiRoute = API_PATTERNS.some((p) => pathname.startsWith(p));
  if (!isAiRoute) {
    return NextResponse.next();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const rawIp = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
  const hashedIp = await hashIp(rawIp);

  // TODO: re-enable rate limit after debugging
  const { allowed, retryAfterSeconds } = { allowed: true, retryAfterSeconds: undefined };
  if (!allowed) {
    return NextResponse.json(
      { error: `请求太频繁，请 ${retryAfterSeconds} 秒后重试。` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds || 60) }
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("x-hashed-ip", hashedIp);
  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};
