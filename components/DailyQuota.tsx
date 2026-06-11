"use client";

import { useEffect, useState } from "react";

export function DailyQuota({ refreshKey }: { refreshKey?: number }) {
  const [quota, setQuota] = useState<{ remaining: number; dailyLimit: number } | null>(null);

  useEffect(() => {
    fetch("/api/quota")
      .then((res) => res.json())
      .then((data: { remaining: number; dailyLimit: number }) => setQuota(data))
      .catch(() => {});
  }, [refreshKey]);

  if (!quota) return null;

  const low = quota.remaining <= 5;

  return (
    <p className={`mb-3 text-[11px] ${low ? "text-[#DC2626]" : "text-[#9CA3AF]"}`}>
      今日剩余 {quota.remaining}/{quota.dailyLimit} 次
      {low && " · 即将用完"}
    </p>
  );
}
