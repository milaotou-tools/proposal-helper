import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const COLLECTION_DIR = process.env.COLLECTION_DIR || path.join(process.cwd(), "data", "collection");

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = body.p || body.password || "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = (body.action as string) || "review-draft";
  const limit = (body.limit as number) || 2;

  const results: Array<{ timestamp: string; outputText: string }> = [];

  try {
    const files = await fs.readdir(COLLECTION_DIR);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const content = await fs.readFile(path.join(COLLECTION_DIR, file), "utf-8");
        const lines = content.trim().split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          const entry = JSON.parse(line);
          if (entry.action === action) {
            results.push({ timestamp: entry.timestamp, outputText: entry.outputText });
            if (results.length >= limit) break;
          }
        }
      } catch { /* skip */ }
      if (results.length >= limit) break;
    }
  } catch {
    return NextResponse.json({ error: "No data directory" }, { status: 404 });
  }

  return NextResponse.json({ count: results.length, results });
}
