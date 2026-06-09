"use client";

import { useEffect, useState } from "react";

export function DailyQuota() {
  const [quota, setQuota] = useState<{ remaining: number; dailyLimit: number } | null>(null);

  useEffect(() => {
    fetch("/api/quota")
      .then((res) => res.json())
      .then((data: { remaining: number; dailyLimit: number }) => setQuota(data))
      .catch(() => {});
  }, []);

  if (!quota) return null;

  return (
    <p className="mb-3 text-[11px] text-[#9CA3AF]">
      今日剩余 {quota.remaining}/{quota.dailyLimit} 次
    </p>
  );
}
