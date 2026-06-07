import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const COLLECTION_DIR = process.env.COLLECTION_DIR || path.join(process.cwd(), "data", "collection");

interface CollectionEntry {
  timestamp: string;
  hashedIp: string;
  action: string;
  input: Record<string, unknown>;
  outputText: string;
  consent: boolean;
}

async function getCollectionStats() {
  const entries: CollectionEntry[] = [];

  try {
    const files = await fs.readdir(COLLECTION_DIR);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const content = await fs.readFile(path.join(COLLECTION_DIR, file), "utf-8");
        const lines = content.trim().split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          entries.push(JSON.parse(line) as CollectionEntry);
        }
      } catch {
        // skip corrupt files
      }
    }
  } catch {
    return null; // directory doesn't exist yet
  }

  const actionCounts: Record<string, number> = {};
  const ips = new Set<string>();
  const dailyMap: Record<string, number> = {};

  for (const entry of entries) {
    actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    if (entry.hashedIp && entry.hashedIp !== "unknown") {
      ips.add(entry.hashedIp);
    }
    const day = entry.timestamp.slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  }

  // Last 7 days trend
  const trend: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: dailyMap[key] || 0 });
  }

  return {
    total: entries.length,
    generateFramework: actionCounts["generate-framework"] || 0,
    polishSection: actionCounts["polish-section"] || 0,
    reviewDraft: actionCounts["review-draft"] || 0,
    expertReview: actionCounts["expert-review"] || 0,
    originalDraft: actionCounts["original-draft"] || 0,
    finalOutput: actionCounts["final-output"] || 0,
    uniqueUsers: ips.size,
    trend
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = body.p || body.password || "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getCollectionStats();
  return NextResponse.json(stats);
}
