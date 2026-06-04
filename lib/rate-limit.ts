type RateLimitEntry = {
  minuteWindow: { count: number; resetAt: number };
  dayWindow: { count: number; resetAt: number };
};

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.dayWindow.resetAt < now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export function checkRateLimit(
  hashedIp: string,
  maxPerMinute = 5,
  maxPerDay = 50
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  let entry = store.get(hashedIp);

  if (!entry) {
    entry = {
      minuteWindow: { count: 0, resetAt: now + 60000 },
      dayWindow: { count: 0, resetAt: now + 86400000 }
    };
    store.set(hashedIp, entry);
  }

  if (entry.minuteWindow.resetAt < now) {
    entry.minuteWindow = { count: 0, resetAt: now + 60000 };
  }
  if (entry.dayWindow.resetAt < now) {
    entry.dayWindow = { count: 0, resetAt: now + 86400000 };
  }

  if (entry.dayWindow.count >= maxPerDay) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.dayWindow.resetAt - now) / 1000)
    };
  }

  if (entry.minuteWindow.count >= maxPerMinute) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.minuteWindow.resetAt - now) / 1000)
    };
  }

  entry.minuteWindow.count++;
  entry.dayWindow.count++;
  return { allowed: true };
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "proposal-helper-salt-2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
