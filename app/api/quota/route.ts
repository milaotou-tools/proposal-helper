import { NextResponse } from "next/server";
import { getQuota, hashIp, DAILY_LIMIT } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  const hashedIp = await hashIp(rawIp);
  const quota = getQuota(hashedIp);

  return NextResponse.json({
    remaining: quota.remaining,
    dailyLimit: quota.dailyLimit,
    resetAt: new Date(quota.resetAt).toISOString(),
  });
}
