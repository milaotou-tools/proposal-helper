"use client";

import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { FrameworkSteps } from "@/components/FrameworkSteps";
import { DraftSteps } from "@/components/DraftSteps";
import { TopicGuidance } from "@/components/TopicGuidance";
import type { SaveSnapshot } from "@/lib/save-store";

type PageState = "landing" | "guidance" | "framework" | "draft";

function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

function restoreAllToLocalStorage(snapshot: SaveSnapshot) {
  // Framework data
  if (snapshot.frameworkForm) {
    writeLocal("ph-framework-form", snapshot.frameworkForm);
  }
  if (snapshot.frameworkResult !== undefined) {
    writeLocal("ph-framework-result", snapshot.frameworkResult);
  }
  // Draft data
  if (snapshot.draft !== undefined) {
    writeLocal("ph-draft", snapshot.draft);
  }
  if (snapshot.polishedDraft !== undefined) {
    writeLocal("ph-polished", snapshot.polishedDraft);
  }
  if (snapshot.polishCache) {
    writeLocal("ph-polish-cache", snapshot.polishCache);
  }
  if (snapshot.detectedSections && snapshot.detectedSections.length > 0) {
    writeLocal("ph-detected-sections", snapshot.detectedSections);
  }
}

export function AppShell() {
  const [page, setPage] = useState<PageState>("landing");
  const [restoredSnapshot, setRestoredSnapshot] = useState<SaveSnapshot | null>(null);
  const [guidancePrefill, setGuidancePrefill] = useState<{
    stageSubject: string;
    idea: string;
    problem: string;
  } | null>(null);

  if (page === "landing") {
    return (
      <LandingPage
        onSelectPath={(path) => {
          setPage(path);
          setRestoredSnapshot(null);
          setGuidancePrefill(null);
        }}
        onStartGuidance={() => setPage("guidance")}
        onRestore={(snapshot) => {
          restoreAllToLocalStorage(snapshot);
          setRestoredSnapshot(snapshot);
          setPage(snapshot.type);
        }}
      />
    );
  }

  if (page === "guidance") {
    return (
      <TopicGuidance
        onBack={() => setPage("landing")}
        onUseTopic={(prefill) => {
          setGuidancePrefill(prefill);
          setPage("framework");
        }}
      />
    );
  }

  if (page === "framework") {
    return (
      <FrameworkSteps
        onBack={() => setPage("landing")}
        restoredSnapshot={restoredSnapshot}
        guidancePrefill={guidancePrefill}
      />
    );
  }

  return (
    <DraftSteps
      onBack={() => setPage("landing")}
      restoredSnapshot={restoredSnapshot}
    />
  );
}
