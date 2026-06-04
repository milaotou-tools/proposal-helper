import { NextRequest, NextResponse } from "next/server";
import { getFeedbackStats } from "@/lib/feedback-store";

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get("p") || request.headers.get("x-admin-password") || "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getFeedbackStats();
  return NextResponse.json(stats);
}
