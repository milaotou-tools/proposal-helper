import fs from "fs/promises";
import path from "path";
import { sanitizeSessionId } from "./analytics-core.ts";
import type { AnalyticsEvent, AnalyticsEventType, AnalyticsStatus } from "./analytics-core.ts";

const ANALYTICS_DIR = process.env.ANALYTICS_DIR || path.join(process.cwd(), "data", "analytics");
const ACTION_PATTERN = /^[a-z0-9-]{2,64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeEvent(value: unknown): AnalyticsEvent | null {
  if (!isRecord(value)) return null;
  const timestamp = typeof value.timestamp === "string" ? value.timestamp : "";
  const action = typeof value.action === "string" ? value.action : "";
  const status = value.status as AnalyticsStatus;
  const eventType = value.eventType as AnalyticsEventType;
  const timestampMs = new Date(timestamp).getTime();

  if (!Number.isFinite(timestampMs) || !ACTION_PATTERN.test(action)) return null;
  if (status !== "success" && status !== "error") return null;
  if (eventType !== "ai" && eventType !== "completion") return null;

  const durationMs = typeof value.durationMs === "number" && Number.isFinite(value.durationMs) && value.durationMs >= 0
    ? Math.round(value.durationMs)
    : undefined;
  const errorKind = value.errorKind === "timeout" || value.errorKind === "error" ? value.errorKind : undefined;

  return {
    timestamp,
    sessionId: sanitizeSessionId(typeof value.sessionId === "string" ? value.sessionId : undefined),
    action,
    status,
    eventType,
    ...(durationMs === undefined ? {} : { durationMs }),
    ...(errorKind ? { errorKind } : {})
  };
}

export function parseAnalyticsLines(content: string): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const event = normalizeEvent(JSON.parse(line));
      if (event) events.push(event);
    } catch {
      // One corrupt line should never hide the remaining anonymous metrics.
    }
  }
  return events;
}

export async function saveAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const normalized = normalizeEvent(event);
  if (!normalized) return;

  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  const day = new Date(normalized.timestamp).toISOString().slice(0, 10);
  await fs.appendFile(path.join(ANALYTICS_DIR, `${day}.json`), `${JSON.stringify(normalized)}\n`, "utf-8");
}

export async function getAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  let fileNames: string[];
  try {
    fileNames = await fs.readdir(ANALYTICS_DIR);
  } catch {
    return [];
  }

  const events: AnalyticsEvent[] = [];
  for (const fileName of fileNames.sort()) {
    if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(fileName)) continue;
    try {
      const content = await fs.readFile(path.join(ANALYTICS_DIR, fileName), "utf-8");
      events.push(...parseAnalyticsLines(content));
    } catch {
      // Skip unreadable daily files while keeping other dates available.
    }
  }
  return events;
}
