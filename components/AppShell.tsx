"use client";

import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { FrameworkSteps } from "@/components/FrameworkSteps";
import { DraftSteps } from "@/components/DraftSteps";

type PageState = "landing" | "framework" | "draft";

export function AppShell() {
  const [page, setPage] = useState<PageState>("landing");

  if (page === "landing") {
    return <LandingPage onSelectPath={(path) => setPage(path)} />;
  }

  if (page === "framework") {
    return <FrameworkSteps onBack={() => setPage("landing")} />;
  }

  return (
    <DraftSteps
      onBack={() => setPage("landing")}
    />
  );
}
