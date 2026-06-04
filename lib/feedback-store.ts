import fs from "fs/promises";
import path from "path";

const FEEDBACK_DIR = process.env.FEEDBACK_DIR || path.join(process.cwd(), "data", "feedback");

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  type: "praise" | "suggestion";
  school?: string;
  message?: string;
}

export async function saveFeedback(entry: Omit<FeedbackEntry, "id" | "timestamp">): Promise<void> {
  await fs.mkdir(FEEDBACK_DIR, { recursive: true });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: FeedbackEntry = {
    ...entry,
    id,
    timestamp: new Date().toISOString()
  };

  const filePath = path.join(FEEDBACK_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
}

export async function getFeedbackStats(): Promise<{
  total: number;
  praiseCount: number;
  suggestionCount: number;
  schools: string[];
  recent: FeedbackEntry[];
}> {
  await fs.mkdir(FEEDBACK_DIR, { recursive: true });

  const files = await fs.readdir(FEEDBACK_DIR);
  const entries: FeedbackEntry[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const content = await fs.readFile(path.join(FEEDBACK_DIR, file), "utf-8");
      entries.push(JSON.parse(content) as FeedbackEntry);
    } catch {
      // skip corrupt files
    }
  }

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const schools = Array.from(
    new Set(entries.map((e) => e.school).filter((s): s is string => !!s))
  ).sort();

  return {
    total: entries.length,
    praiseCount: entries.filter((e) => e.type === "praise").length,
    suggestionCount: entries.filter((e) => e.type === "suggestion").length,
    schools,
    recent: entries.slice(0, 50)
  };
}
