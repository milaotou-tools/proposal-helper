import fs from "fs/promises";
import path from "path";
import { sanitizeWorkId } from "./work-id.ts";

const COLLECTION_DIR = process.env.COLLECTION_DIR || path.join(process.cwd(), "data", "collection");
const RECORD_ID_PATTERN = /^(\d{4}-\d{2}-\d{2}\.json):(\d+)$/;

export interface StoredCollectionEntry {
  timestamp: string;
  hashedIp: string;
  sessionId?: string;
  workId?: string;
  action: string;
  input: Record<string, unknown>;
  outputText: string;
  consent: boolean;
}

export interface CollectionRecord {
  id: string;
  entry: StoredCollectionEntry;
}

export interface CollectionRecordSummary {
  id: string;
  timestamp: string;
  anonymousId: string;
  action: string;
  inputPreview: string;
  outputPreview: string;
}

export interface GroupedPolishRecord extends CollectionRecord {
  groupedItems: Array<{ section: string; input: Record<string, unknown>; outputText: string; timestamp: string }>;
}

function preview(value: unknown, length: number) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized;
}

function encodeRecordId(fileName: string, lineIndex: number) {
  return Buffer.from(`${fileName}:${lineIndex}`, "utf-8").toString("base64url");
}

function encodeGroupId(workId: string) {
  return Buffer.from(`group:${workId}`, "utf-8").toString("base64url");
}

function decodeRecordId(id: string) {
  try {
    const decoded = Buffer.from(id, "base64url").toString("utf-8");
    return RECORD_ID_PATTERN.exec(decoded);
  } catch {
    return null;
  }
}

function decodeGroupId(id: string) {
  try {
    const decoded = Buffer.from(id, "base64url").toString("utf-8");
    return decoded.startsWith("group:") ? sanitizeWorkId(decoded.slice("group:".length)) : undefined;
  } catch {
    return undefined;
  }
}

function isRecordEntry(value: unknown): value is StoredCollectionEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<StoredCollectionEntry>;
  return typeof entry.timestamp === "string"
    && typeof entry.action === "string"
    && typeof entry.outputText === "string"
    && typeof entry.consent === "boolean"
    && typeof entry.input === "object"
    && entry.input !== null;
}

function isVisibleGeneratedRecord(entry: StoredCollectionEntry) {
  return entry.consent && entry.action !== "original-draft" && entry.outputText.trim().length > 0;
}

function anonymousId(entry: StoredCollectionEntry) {
  if (entry.sessionId && entry.sessionId !== "unknown") return `会话 ${entry.sessionId.slice(0, 8)}`;
  if (entry.hashedIp && entry.hashedIp !== "unknown") return `历史 ${entry.hashedIp.slice(0, 8)}`;
  return "历史匿名";
}

export function summarizeCollectionRecord(record: CollectionRecord): CollectionRecordSummary {
  return {
    id: record.id,
    timestamp: record.entry.timestamp,
    anonymousId: anonymousId(record.entry),
    action: record.entry.action,
    inputPreview: preview(record.entry.input, 120),
    outputPreview: preview(record.entry.outputText, 180)
  };
}

export function groupCollectionRecords(records: CollectionRecord[]): CollectionRecordSummary[] {
  const grouped = new Map<string, CollectionRecord[]>();
  const summaries: CollectionRecordSummary[] = [];

  for (const record of records) {
    const workId = record.entry.workId;
    if (record.entry.action === "polish-section" && workId) {
      const current = grouped.get(workId) || [];
      current.push(record);
      grouped.set(workId, current);
    } else {
      summaries.push(summarizeCollectionRecord(record));
    }
  }

  for (const [workId, group] of grouped) {
    const ordered = [...group].sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime());
    const latest = ordered[0];
    const sections = Array.from(new Set(ordered.map((record) => typeof record.entry.input.section === "string" ? record.entry.input.section : "未命名栏目")));
    summaries.push({
      ...summarizeCollectionRecord(latest),
      id: encodeGroupId(workId),
      inputPreview: `已合并 ${group.length} 次逐栏打磨：${sections.join("、")}`,
      outputPreview: `最近结果：${preview(latest.entry.outputText, 150)}`
    });
  }

  return summaries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function buildGroupedPolishRecord(workId: string, records: CollectionRecord[]): GroupedPolishRecord {
  const ordered = [...records].sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime());
  const latest = ordered[0];
  return {
    id: encodeGroupId(workId),
    entry: latest.entry,
    groupedItems: ordered.map((record) => ({
      section: typeof record.entry.input.section === "string" ? record.entry.input.section : "未命名栏目",
      input: record.entry.input,
      outputText: record.entry.outputText,
      timestamp: record.entry.timestamp
    }))
  };
}

async function readRecordsFromFile(fileName: string): Promise<CollectionRecord[]> {
  let content: string;
  try {
    content = await fs.readFile(path.join(COLLECTION_DIR, fileName), "utf-8");
  } catch {
    return [];
  }

  const records: CollectionRecord[] = [];
  for (const [lineIndex, line] of content.split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (isRecordEntry(parsed) && isVisibleGeneratedRecord(parsed)) {
        records.push({ id: encodeRecordId(fileName, lineIndex), entry: parsed });
      }
    } catch {
      // Ignore only the malformed historical line.
    }
  }
  return records;
}

async function readAllCollectionRecords(): Promise<CollectionRecord[]> {
  let files: string[];
  try {
    files = await fs.readdir(COLLECTION_DIR);
  } catch {
    return [];
  }

  return (await Promise.all(
    files.filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).map(readRecordsFromFile)
  )).flat();
}

export async function getRecentCollectionRecords(action?: string) {
  const records = await readAllCollectionRecords();

  return groupCollectionRecords(records
    .filter((record) => !action || record.entry.action === action)
  ).slice(0, 50);
}

export async function getCollectionRecord(id: string): Promise<CollectionRecord | GroupedPolishRecord | null> {
  const workId = decodeGroupId(id);
  if (workId) {
    const records = await readAllCollectionRecords();
    const grouped = records.filter((record) => record.entry.action === "polish-section" && record.entry.workId === workId);
    return grouped.length ? buildGroupedPolishRecord(workId, grouped) : null;
  }

  const match = decodeRecordId(id);
  if (!match) return null;
  const [, fileName, rawLineIndex] = match;
  const lineIndex = Number(rawLineIndex);
  const records = await readRecordsFromFile(fileName);
  return records.find((record) => record.id === encodeRecordId(fileName, lineIndex)) || null;
}
