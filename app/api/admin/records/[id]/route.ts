import { NextRequest, NextResponse } from "next/server";
import { getCollectionRecord } from "@/lib/admin-records";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const password = body.p || body.password || "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await getCollectionRecord(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const groupedItems = "groupedItems" in record ? record.groupedItems : undefined;

  return NextResponse.json({
    id: record.id,
    timestamp: record.entry.timestamp,
    action: record.entry.action,
    input: record.entry.input,
    outputText: record.entry.outputText,
    ...(groupedItems ? { groupedItems } : {})
  });
}
