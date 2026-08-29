import { NextRequest, NextResponse } from "next/server";
import { getRecentCollectionRecords } from "@/lib/admin-records";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = body.p || body.password || "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  const records = await getRecentCollectionRecords(action);
  return NextResponse.json({ records });
}
