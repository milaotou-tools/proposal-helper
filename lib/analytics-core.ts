export type AnalyticsEventType = "ai" | "completion";
export type AnalyticsStatus = "success" | "error";

export interface AnalyticsEvent {
  timestamp: string;
  sessionId: string;
  action: string;
  status: AnalyticsStatus;
  eventType: AnalyticsEventType;
  durationMs?: number;
  errorKind?: "timeout" | "error";
}

export interface QualityMetric {
  total: number;
  successRate: number;
  failureRate: number;
  timeoutRate: number;
  averageDurationMs: number | null;
}

export interface QualitySnapshot {
  recent: QualityMetric;
  all: QualityMetric;
  frameworkFunnel: { requested: number; succeeded: number };
  draftFunnel: { diagnosed: number; polished: number; reviewed: number; exported: number };
}

const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{10,128}$/;

export function sanitizeSessionId(value: string | null | undefined): string {
  return value && SESSION_ID_PATTERN.test(value) ? value : "unknown";
}

export function classifyAnalyticsError(message: string): "timeout" | "error" {
  return /超时|timeout/i.test(message) ? "timeout" : "error";
}

function isKnownSession(event: AnalyticsEvent) {
  return event.sessionId !== "unknown";
}

function toMetric(events: AnalyticsEvent[]): QualityMetric {
  const aiEvents = events.filter((event) => event.eventType === "ai");
  const successEvents = aiEvents.filter((event) => event.status === "success");
  const timeoutEvents = aiEvents.filter((event) => event.errorKind === "timeout");
  const durations = successEvents
    .map((event) => event.durationMs)
    .filter((duration): duration is number => typeof duration === "number" && duration >= 0);

  return {
    total: aiEvents.length,
    successRate: aiEvents.length ? Math.round((successEvents.length / aiEvents.length) * 100) : 0,
    failureRate: aiEvents.length ? Math.round(((aiEvents.length - successEvents.length) / aiEvents.length) * 100) : 0,
    timeoutRate: aiEvents.length ? Math.round((timeoutEvents.length / aiEvents.length) * 100) : 0,
    averageDurationMs: durations.length ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length) : null
  };
}

function uniqueSessions(events: AnalyticsEvent[]) {
  return new Set(events.filter(isKnownSession).map((event) => event.sessionId)).size;
}

function buildDraftFunnel(events: AnalyticsEvent[]) {
  const sessions = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    if (!isKnownSession(event)) continue;
    const current = sessions.get(event.sessionId) || [];
    current.push(event);
    sessions.set(event.sessionId, current);
  }

  let diagnosed = 0;
  let polished = 0;
  let reviewed = 0;
  let exported = 0;

  for (const sessionEvents of sessions.values()) {
    const ordered = [...sessionEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const findSuccessAfter = (action: string, after?: AnalyticsEvent) => ordered.find((event) => (
      event.action === action
      && event.status === "success"
      && (!after || new Date(event.timestamp).getTime() > new Date(after.timestamp).getTime())
    ));

    const diagnosis = findSuccessAfter("review-draft");
    if (!diagnosis) continue;
    diagnosed++;

    const polish = findSuccessAfter("polish-section", diagnosis);
    if (!polish) continue;
    polished++;

    const review = findSuccessAfter("expert-review", polish);
    if (!review) continue;
    reviewed++;

    const finalOutput = findSuccessAfter("final-output", review);
    if (finalOutput) exported++;
  }

  return { diagnosed, polished, reviewed, exported };
}

export function buildQualitySnapshot(events: AnalyticsEvent[], now = new Date()): QualitySnapshot {
  const recentStart = new Date(now);
  recentStart.setDate(recentStart.getDate() - 6);
  recentStart.setHours(0, 0, 0, 0);
  const recentEvents = events.filter((event) => new Date(event.timestamp).getTime() >= recentStart.getTime());

  const successful = (action: string) => events.filter((event) => event.action === action && event.status === "success");

  return {
    recent: toMetric(recentEvents),
    all: toMetric(events),
    frameworkFunnel: {
      requested: uniqueSessions(events.filter((event) => event.action === "generate-framework" && event.eventType === "ai")),
      succeeded: uniqueSessions(successful("generate-framework"))
    },
    draftFunnel: buildDraftFunnel(events)
  };
}
