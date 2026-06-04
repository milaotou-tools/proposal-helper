import fs from "fs/promises";
import path from "path";

const COLLECTION_DIR = process.env.COLLECTION_DIR || path.join(process.cwd(), "data", "collection");

export interface CollectionEntry {
  timestamp: string;
  hashedIp: string;
  action: string;
  input: Record<string, unknown>;
  outputText: string;
  consent: boolean;
}

export async function saveCollectionEntry(entry: CollectionEntry): Promise<void> {
  if (!entry.consent) return;

  await fs.mkdir(COLLECTION_DIR, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const filePath = path.join(COLLECTION_DIR, `${today}.json`);

  const line = JSON.stringify(entry) + "\n";
  await fs.appendFile(filePath, line, "utf-8");
}
