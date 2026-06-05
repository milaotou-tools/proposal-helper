"use client";

import { useCallback, useEffect, useState } from "react";

const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

type StoredValue<T> = {
  value: T;
  timestamp: number;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as StoredValue<T>;
    if (Date.now() - stored.timestamp > EXPIRY_MS) {
      window.localStorage.removeItem(key);
      return fallback;
    }
    return stored.value;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    const wrapped: StoredValue<T> = { value, timestamp: Date.now() };
    window.localStorage.setItem(key, JSON.stringify(wrapped));
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => read(key, initialValue));

  useEffect(() => {
    write(key, state);
  }, [key, state]);

  const reset = useCallback(() => {
    setState(initialValue);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }, [key, initialValue]);

  return [state, setState, reset] as const;
}
