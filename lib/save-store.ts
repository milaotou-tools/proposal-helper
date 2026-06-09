import fs from "fs/promises";
import path from "path";

const SAVE_DIR = process.env.SAVE_DIR || path.join(process.cwd(), "data", "saves");

// Exclude 0/O, 1/I/l for readability
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const EXPIRY_DAYS = 30;

export type SaveSnapshot = {
  type: "framework" | "draft";
  // Framework fields
  frameworkForm?: {
    stage: string;
    stageSubject: string;
    idea: string;
    problem: string;
    researchObjects: string;
    practiceBase: string;
    expectedOutputs: string;
  };
  frameworkResult?: string;
  frameworkCurrentStep?: number;
  // Draft fields
  draft?: string;
  polishedDraft?: string;
  polishCache?: Record<string, string>;
  detectedSections?: Array<{
    standard: string;
    heading: string | null;
    content: string | null;
  }>;
  draftCurrentStep?: number | string;
  resultTitle?: string;
  resultText?: string;
  livePageResult?: string;
  // Metadata
  createdAt: string;
  expiresAt: string;
};

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function codeExists(code: string): Promise<boolean> {
  try {
    await fs.access(path.join(SAVE_DIR, `${code}.json`));
    return true;
  } catch {
    return false;
  }
}

export async function saveWork(
  snapshot: Omit<SaveSnapshot, "createdAt" | "expiresAt">,
  existingCode?: string,
): Promise<string> {
  await fs.mkdir(SAVE_DIR, { recursive: true });

  const now = Date.now();
  const record: SaveSnapshot = {
    ...snapshot,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(now + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };

  // If an existing code is provided and still valid, merge and update
  if (existingCode) {
    const sanitized = existingCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (sanitized.length === CODE_LENGTH) {
      const existing = await loadWork(sanitized);
      if (existing) {
        // Merge: new fields overwrite existing, but keep fields not in the new snapshot
        const merged: SaveSnapshot = { ...existing, ...snapshot, createdAt: existing.createdAt, expiresAt: record.expiresAt };
        await fs.writeFile(
          path.join(SAVE_DIR, `${sanitized}.json`),
          JSON.stringify(merged, null, 2),
          "utf-8",
        );
        return sanitized;
      }
    }
  }

  // Otherwise generate a new code
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) throw new Error("无法生成唯一保存码，请稍后重试。");
  } while (await codeExists(code));

  await fs.writeFile(
    path.join(SAVE_DIR, `${code}.json`),
    JSON.stringify(record, null, 2),
    "utf-8",
  );
  return code;
}

export async function loadWork(code: string): Promise<SaveSnapshot | null> {
  const sanitized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (sanitized.length !== CODE_LENGTH) return null;

  try {
    const content = await fs.readFile(
      path.join(SAVE_DIR, `${sanitized}.json`),
      "utf-8",
    );
    const snapshot = JSON.parse(content) as SaveSnapshot;

    if (new Date(snapshot.expiresAt) < new Date()) {
      return null;
    }

    return snapshot;
  } catch {
    return null;
  }
}
