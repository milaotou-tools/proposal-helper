
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first (requires HTTPS or localhost)
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy fallback
    }
  }
  // Legacy fallback for HTTP origins
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
}

const ANALYTICS_SESSION_KEY = "proposal-helper:analytics-session";
const ANALYTICS_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "unknown";

  try {
    const stored = window.localStorage.getItem(ANALYTICS_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { id?: string; createdAt?: number };
      if (typeof parsed.id === "string" && typeof parsed.createdAt === "number" && Date.now() - parsed.createdAt < ANALYTICS_SESSION_TTL_MS) {
        return parsed.id;
      }
    }

    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify({ id, createdAt: Date.now() }));
    return id;
  } catch {
    return "unknown";
  }
}

function aiHeaders(allowCollection?: boolean) {
  return {
    "Content-Type": "application/json",
    "x-allow-collection": allowCollection === false ? "0" : "1",
    "x-analytics-session-id": getAnalyticsSessionId()
  };
}

export async function postAi(url: string, payload: unknown, allowCollection?: boolean) {
  const res = await fetch(url, {
    method: "POST",
    headers: aiHeaders(allowCollection),
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `请求失败，状态码 ${res.status}`);
  }

  return data.text as string;
}

export async function postAiStream(
  url: string,
  payload: unknown,
  onChunk: (chunk: string) => void,
  allowCollection?: boolean
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: aiHeaders(allowCollection),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: `请求失败，状态码 ${res.status}` }));
    throw new Error(data.error || `请求失败，状态码 ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("响应体不可读");

  const decoder = new TextDecoder();
  let fullText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk(chunk);
  }
  // Detect server-side [ERROR] marker injected into stream body
  const errorMatch = fullText.match(/\[ERROR\]\s*(.+?)(?:\n|$)/);
  if (errorMatch) {
    throw new Error(errorMatch[1] || "AI 服务异常，请重试。");
  }
}
