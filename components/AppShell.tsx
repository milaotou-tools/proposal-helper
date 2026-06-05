"use client";

import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { ProposalHelperApp } from "@/components/ProposalHelperApp";

type PageState = "landing" | "framework" | "draft";

export function AppShell() {
  const [page, setPage] = useState<PageState>("landing");

  if (page === "landing") {
    return (
      <LandingPage
        onSelectPath={(path) => setPage(path)}
      />
    );
  }

  // Pass the initial mode to ProposalHelperApp so it opens in the right tab
  return (
    <div>
      <button
        type="button"
        onClick={() => setPage("landing")}
        className="fixed left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-md border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs font-bold text-[#6B7280] transition hover:border-[#D1D5DB] hover:text-[#141413]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 3L5 7L9 11" />
        </svg>
        返回首页
      </button>
      <ProposalHelperApp initialMode={page} />
    </div>
  );
}
