import { NextRequest, NextResponse } from "next/server";
import { getFeedbackStats } from "@/lib/feedback-store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = body.p || body.password || "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getFeedbackStats();
  return NextResponse.json(stats);
}
