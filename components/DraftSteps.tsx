"use client";

import { useState, useRef, useEffect } from "react";
import { StepNavigation } from "@/components/StepNavigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { DailyQuota } from "@/components/DailyQuota";
import { usePersistedState } from "@/lib/use-persisted-state";
import { postAiStream, stripMarkdown, copyToClipboard } from "@/lib/utils";
import { formatOutput } from "@/lib/format-output";
import type { SaveSnapshot } from "@/lib/save-store";

const DRAFT_STEPS = [
  { label: "输入草稿", description: "粘贴你的申报书" },
  { label: "整体诊断", description: "发现结构问题" },
  { label: "逐栏打磨", description: "逐部分精修" },
  { label: "模拟预审", description: "专家视角审阅" }
];

const draftExamples: Array<{ label: string; value: string }> = [
  {
    label: "示例：完整申报书草稿",
    value: [
      "课题名称：人工智能支持小学数学概念图学习的实践研究",
      "",
      "选题依据：当前小学数学复习中，学生对知识点的掌握比较零散，不能很好地把单元知识联系起来。随着人工智能技术的发展，教师可以借助 AI 工具帮助学生整理知识结构，提高学生的数学学习能力。",
      "",
      "文献综述：",
      "1. 概念图在数学教学中的应用研究方面，Novak 最早提出概念图理论，国内外学者已将概念图应用于数学复习课、概念教学等场景，研究表明概念图有助于学生建立知识间的关联。",
      "2. 人工智能支持教学方面，AI 技术已在智能辅导、自动批改、个性化推荐等领域取得进展，但在概念图自动生成与评价方面的应用研究仍较少。",
      "3. 小学数学复习教学方面，现有研究多关注练习设计、错题管理等策略，将 AI 工具与概念图结合应用于单元复习的实践研究尚不多见。",
      "",
      "研究目标：",
      "1. 探索 AI 辅助学生绘制数学概念图的方法。",
      "2. 提高学生数学复习效率和知识整理能力。",
      "3. 形成可推广的课堂教学模式。",
      "",
      "研究内容：",
      "1. AI 工具支持概念图绘制的策略研究。",
      "2. 概念图在单元复习中的应用研究。",
      "3. 学生数学思维能力提升研究。",
      "",
      "研究方法：行动研究法、案例研究法、问卷调查法。",
      "",
      "实施步骤：",
      "1. 准备阶段：调研学生数学概念理解现状，筛选适合的 AI 概念图工具。",
      "2. 实施阶段：在五年级数学单元复习中开展 AI 辅助概念图教学实践。",
      "3. 总结阶段：收集学生反馈与成绩数据，提炼教学模式，撰写研究报告。",
      "",
      "预期成果：",
      "1. 形成一套 AI 辅助数学概念图教学的课堂实施方案。",
      "2. 学生数学复习效率和知识结构化水平显著提升。",
      "3. 完成一篇课题研究报告，争取发表相关论文。",
      "",
      "研究条件：学校已配备平板电脑教室，教师具备基本信息技术应用能力；课题组成员均有参与区级课题的经验；可利用学校已有的 AI 教学平台开展实践。",
      "",
      "创新点：将 AI 概念图工具与小学数学单元复习深度融合，以学生自主构建知识结构为核心，突破传统复习课以教师讲授为主的模式。"
    ].join("\n")
  }
];

const polishSections = [
  "课题名称",
  "摘要",
  "关键词",
  "选题依据",
  "核心概念界定",
  "文献综述",
  "研究目标",
  "研究内容",
  "研究方法",
  "实施步骤",
  "人员分工",
  "研究条件",
  "预期成果",
  "创新点",
  "经费预算",
  "参考文献"
];

const SECTION_GROUPS = [
  { name: "基础信息", sections: ["课题名称", "摘要", "关键词"] },
  { name: "选题论证", sections: ["选题依据", "核心概念界定", "文献综述"] },
  { name: "研究设计", sections: ["研究目标", "研究内容", "研究方法"] },
  { name: "实施保障", sections: ["实施步骤", "人员分工", "研究条件"] },
  { name: "产出与支撑", sections: ["预期成果", "创新点", "经费预算", "参考文献"] },
];

const loadingSteps = ["正在分析中", "正在整理思路", "正在生成结果"];

type Step = 0 | 1 | 2 | 3 | "free";

type DetectedSection = { standard: string; heading: string | null; content: string | null };

type PolishSectionState = {
  name: string;
  status: "pending" | "streaming" | "done" | "skipped" | "error";
  content: string;
};

function ensureIndent(text: string): string {
  if (!text) return text;
  return text.split("\n").map(line => {
    if (!line.trim()) return line;
    if (line.startsWith("　　")) return line;
    return "　　" + line.replace(/^\s*/, "");
  }).join("\n");
}

const CHINESE_NUMS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

function formatDiagnosticNumbering(text: string): string {
  return text.replace(/^(\d+)\.(\s*)(总体判断|问题诊断|优先修改建议|修改建议|改进建议|总体评价|优点|不足|风险提示|注意事项|总结建议)/gm,
    (_, num, _sp, title) => {
      const n = parseInt(num as string);
      const cn = n <= 10 ? CHINESE_NUMS[n] : String(num);
      return `${cn}、${title}`;
    }
  );
}

function parseSectionParts(content: string) {
  const labels = ["识别到的原文", "原栏目问题", "修改建议", "修改后文本"];
  const result: { heading: string; body: string }[] = [];
  let remaining = content;

  function tryFind(label: string, from: string): { idx: number; after: string } {
    // Try multiple marker formats
    const patterns = [
      `**${label}**`,
      `**${label}：**`,
      `**${label}:**`,
      `### ${label}`,
      `## ${label}`,
      `**${label}：`,
      `**${label}:`,
    ];
    for (const pat of patterns) {
      const i = from.indexOf(pat);
      if (i !== -1) return { idx: i, after: from.slice(i + pat.length) };
    }
    // Fuzzy: line that starts with or contains the label as a bold heading
    const re = new RegExp(`(?:^|\\n)\\s*\\*{0,2}${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[：:]?\\*{0,2}\\s*\\n`, 'm');
    const m = from.match(re);
    if (m && m.index !== undefined) {
      return { idx: m.index, after: from.slice(m.index + m[0].length) };
    }
    return { idx: -1, after: from };
  }

  for (let i = 0; i < labels.length; i++) {
    const found = tryFind(labels[i], remaining);
    if (found.idx === -1) { result.push({ heading: labels[i], body: "" }); continue; }
    let endIdx = -1;
    let endTagLen = 0;
    if (i + 1 < labels.length) {
      const next = tryFind(labels[i + 1], found.after);
      if (next.idx !== -1) {
        endIdx = next.idx;
        endTagLen = 0;
      }
    }
    const rawBody = (endIdx === -1 ? found.after : found.after.slice(0, endIdx)).trim();
    result.push({ heading: labels[i], body: rawBody.replace(/\*\*(.+?)\*\*/g, "$1") });
    remaining = endIdx === -1 ? "" : found.after.slice(endIdx);
  }
  return result;
}

type DraftStepsProps = {
  onBack: () => void;
  restoredSnapshot?: SaveSnapshot | null;
};

function findHeadingPos(draft: string, heading: string): number {
  // Build a list of variants to try: original, with/without colon, colon-normalized
  const variants: string[] = [heading];

  // Colon normalization: AI may include/exclude colon; user may edit either way
  if (heading.endsWith("：") || heading.endsWith(":")) {
    variants.push(heading.slice(0, -1));
  } else {
    variants.push(heading + "：");
    variants.push(heading + ":");
  }

  for (const variant of variants) {
    const idx = draft.indexOf(variant);
    if (idx !== -1) return idx;
  }

  // Normalize quotes (AI often returns curly quotes while draft has straight ones, or vice versa)
  const normHeading = heading.replace(/[""]/g, '"').replace(/['']/g, "'");
  const normDraft = draft.replace(/[""]/g, '"').replace(/['']/g, "'");
  if (normHeading !== heading) {
    for (const variant of [normHeading, normHeading.endsWith("：") || normHeading.endsWith(":") ? normHeading.slice(0, -1) : normHeading + "："]) {
      const nIdx = normDraft.indexOf(variant);
      if (nIdx !== -1) return nIdx;
    }
  }

  // Try with whitespace flexibility at punctuation boundaries
  const flexible = heading
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s*")
    .replace(/([、，。；：！？])\s*/g, "$1\\s*")
    .replace(/([一-鿿])([（(])/g, "$1\\s*$2")
    .replace(/([）)])([一-鿿])/g, "$1\\s*$2");
  const m = draft.match(new RegExp(flexible, "i"));
  if (m && m.index !== undefined) return m.index;

  // Also try flexible on normalized draft
  if (normHeading !== heading) {
    const m2 = normDraft.match(new RegExp(
      normHeading
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\s+/g, "\\s*")
        .replace(/([、，。；：！？])\s*/g, "$1\\s*")
        .replace(/([一-鿿])([（(])/g, "$1\\s*$2")
        .replace(/([）)])([一-鿿])/g, "$1\\s*$2"),
      "i"
    ));
    if (m2 && m2.index !== undefined) return m2.index;
  }

  // Strip non-numbered parenthetical annotation (e.g. "（末尾段）") and retry
  const stripped = heading.replace(/（[^）\d]*）\s*$/g, "").trim();
  if (stripped !== heading) return findHeadingPos(draft, stripped);

  return -1;
}

function extractSection(draft: string, section: string, detectedSections: DetectedSection[], skipAiContent?: boolean): string {
  // 课题名称 always extracts just the first line — never use AI content
  if (section === "课题名称") {
    // Find the first non-empty line that looks like a title
    const lines = draft.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Skip metadata lines (学校/姓名/申报人 etc.)
      if (/^(学校|姓名|申报人|单位|作者|所在单位|工作单位|联系方式|电话|邮箱)[：:]/.test(trimmed)) continue;
      // First substantive line is the title
      return trimmed;
    }
    return "";
  }

  const targetEntry = detectedSections.find(s => s.standard === section);

  // Use AI-extracted content if available (only for original draft, not modified)
  if (!skipAiContent && targetEntry?.content) return targetEntry.content;

  // Fallback to heading-based regex extraction
  const targetHeading = targetEntry?.heading || section;
  let startPos = findHeadingPos(draft, targetHeading);
  // If original heading not found (e.g. polished draft uses simple section names), try the section name itself
  if (startPos === -1 && targetHeading !== section) {
    startPos = findHeadingPos(draft, section);
  }
  if (startPos === -1) return "";

  // Find the colon on the heading line only
  const lineEnd = draft.indexOf("\n", startPos);
  const headingLine = lineEnd !== -1 ? draft.slice(startPos, lineEnd) : draft.slice(startPos, Math.min(startPos + 200, draft.length));
  const colonIdx = headingLine.search(/[：:]/);
  const startContent = colonIdx !== -1 ? startPos + colonIdx + 1 : (lineEnd !== -1 ? lineEnd + 1 : startPos + targetHeading.length);

  // Boundary: find all heading positions in the draft, sorted by actual position
  const headingPositions = detectedSections
    .filter(s => s.standard !== section)
    .map(s => {
      let pos = findHeadingPos(draft, s.heading || s.standard);
      if (pos === -1 && s.heading && s.heading !== s.standard) {
        pos = findHeadingPos(draft, s.standard);
      }
      return { standard: s.standard, pos };
    })
    .filter(x => x.pos > startPos)
    .sort((a, b) => a.pos - b.pos);

  const endPos = headingPositions.length > 0 ? headingPositions[0].pos : draft.length;

  return draft.slice(startContent, endPos).trim();
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([`\ufeff${content}`], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DraftSteps({ onBack, restoredSnapshot }: DraftStepsProps) {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [draft, setDraft] = usePersistedState("ph-draft", "");
  const [polishedDraft, setPolishedDraft] = usePersistedState("ph-polished", "");
  const [resultTitle, setResultTitle] = useState("");
  const [resultText, setResultText] = useState("");

  // Polish-all streaming: per-section cards + progress bar
  const [polishSectionsState, setPolishSectionsState] = useState<PolishSectionState[]>(
    polishSections.map(name => ({ name, status: "pending", content: "" }))
  );
  const [currentStreamIdx, setCurrentStreamIdx] = useState(0);
  const [viewIdx, setViewIdx] = useState(0);
  const [polishStarted, setPolishStarted] = useState(false);
  const [showPolishModal, setShowPolishModal] = useState(false);
  const [selectedSections, setSelectedSections] = useState<boolean[]>(
    polishSections.map(() => true)
  );
  const [keepOriginalOrder, setKeepOriginalOrder] = useState(false);
  const [showAuthorNote, setShowAuthorNote] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [allowCollection, setAllowCollection] = useState(true);
  const [quotaRefreshKey, setQuotaRefreshKey] = useState(0);
  const [detectedSections, setDetectedSections] = usePersistedState<DetectedSection[]>(
    "ph-detected-sections",
    polishSections.map(s => ({ standard: s, heading: null, content: null }))
  );
  const [saveCode, setSaveCode] = usePersistedState<string | null>("ph-save-code", null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveCopied, setSaveCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const lastReviewedDraft = useRef("");
  const lastDiagnosedDraft = useRef("");
  const restoredRef = useRef(false);
  const retryRef = useRef<(() => void) | null>(null);
  const polishContentRef = useRef<Map<number, string>>(new Map());
  const polishInputDraft = useRef("");

  // Post-polish tool state
  const [livePageResult, setLivePageResult] = usePersistedState<string>("ph-livepage-result", "");
  const [isLivePageLoading, setIsLivePageLoading] = useState(false);
  const [showPostTools, setShowPostTools] = useState(false);

  // Restore from snapshot on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (restoredSnapshot?.draft || restoredSnapshot?.polishedDraft) {
      const s = restoredSnapshot;
      if (s.draft) setDraft(s.draft);
      if (s.polishedDraft) setPolishedDraft(s.polishedDraft);
      if (s.detectedSections && s.detectedSections.length > 0) {
        setDetectedSections(s.detectedSections);
      }
      if (s.resultTitle) setResultTitle(s.resultTitle);
      if (s.resultText) setResultText(s.resultText);
      if (s.livePageResult) setLivePageResult(s.livePageResult);
      if (typeof s.draftCurrentStep === "number") {
        setCurrentStep(s.draftCurrentStep as Step);
      }
      if (s.draft) {
        lastReviewedDraft.current = "";
      }
    }
  }, [restoredSnapshot, setDraft, setPolishedDraft, setDetectedSections]);

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/save-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "draft",
          code: saveCode,
          draft,
          polishedDraft,
          detectedSections,
          draftCurrentStep: currentStep,
          resultTitle,
          resultText,
          livePageResult: livePageResult || undefined,
        }),
      });
      const data = await res.json() as { ok?: boolean; code?: string; error?: string };
      if (data.ok && data.code) {
        setSaveCode(data.code);
        setShowSaveModal(true);
      } else {
        setSaveError(data.error || "保存失败，请稍后重试。");
      }
    } catch {
      setSaveError("网络错误，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  // Session ID to link original draft and final output
  const sessionId = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  // Undo history for polishedDraft editor
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const MAX_HISTORY = 50;

  function pushHistory(value: string) {
    const stack = historyStack.current;
    const idx = historyIndex.current;
    // Trim forward history if we're in the middle
    if (idx < stack.length - 1) {
      stack.length = idx + 1;
    }
    stack.push(value);
    if (stack.length > MAX_HISTORY) stack.shift();
    historyIndex.current = stack.length - 1;
  }

  function undo() {
    const stack = historyStack.current;
    if (historyIndex.current <= 0) return;
    historyIndex.current--;
    setPolishedDraft(stack[historyIndex.current]);
  }

  function updatePolishedDraft(value: string) {
    pushHistory(polishedDraft || draft);
    setPolishedDraft(value);
  }

  function handleExport() {
    const finalDraft = polishedDraft || draft;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    downloadFile(finalDraft, `申报书修改后稿_${dateStr}.txt`, "text/plain;charset=utf-8");
  }

  async function handleSaveAndExport() {
    // Save to backend
    if (resultText && resultTitle === "模拟专家预审意见") {
      fetch("/api/save-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.current,
          originalDraft: draft,
          polishedDraft: polishedDraft || draft,
          expertReview: resultText,
          allowCollection
        })
      }).catch(() => {});
    }
    handleExport();
  }

  // Track which steps have been completed
  const [completedDiagnosis, setCompletedDiagnosis] = useState(false);
  const [completedPolish, setCompletedPolish] = useState(false);
  const [completedExpert, setCompletedExpert] = useState(false);

  function updateSectionInDraft(section: string, newText: string, detected: DetectedSection[]) {
    const targetEntry = detected.find(s => s.standard === section);
    const targetHeading = targetEntry?.heading || section;
    const current = polishedDraft || draft;

    // Find heading position
    let startPos = findHeadingPos(current, targetHeading);
    if (startPos === -1) {
      startPos = findHeadingPos(current, section);
    }
    if (startPos === -1) {
      // Append at end
      setPolishedDraft(current + `\n\n${targetHeading}：${newText}`);
      return;
    }

    // Find colon on the heading line only
    const lineEnd = current.indexOf("\n", startPos);
    const headingLine = lineEnd !== -1 ? current.slice(startPos, lineEnd) : current.slice(startPos, Math.min(startPos + 200, current.length));
    const colonIdx = headingLine.search(/[：:]/);
    const startContent = colonIdx !== -1 ? startPos + colonIdx + 1 : (lineEnd !== -1 ? lineEnd + 1 : startPos + targetHeading.length);

    // Find all heading positions in draft order, pick the next one after startPos
    const headingPositions = detected
      .filter(s => s.standard !== section)
      .map(s => {
        let pos = findHeadingPos(current, s.heading || s.standard);
        if (pos === -1 && s.heading && s.heading !== s.standard) {
          pos = findHeadingPos(current, s.standard);
        }
        return { pos };
      })
      .filter(x => x.pos > startPos)
      .sort((a, b) => a.pos - b.pos);

    const endPos = headingPositions.length > 0 ? headingPositions[0].pos : current.length;

    const before = current.slice(0, startPos);
    const prefix = current.slice(startPos, startContent);
    const after = current.slice(endPos);
    setPolishedDraft(before + prefix + newText + after);
    // Clear AI-extracted content for this section so future extractSection calls
    // re-extract from the actual (edited) draft text instead of returning stale AI content.
    setDetectedSections((prev) =>
      prev.map((s) => (s.standard === section ? { ...s, content: null } : s))
    );
  }

  function setDraftOnly(value: string) {
    if (value !== draft) {
      setCompletedDiagnosis(false);
      setCompletedPolish(false);
      setPolishStarted(false);
      setResultText("");
      setResultTitle("");
      setPolishedDraft("");
      setPolishSectionsState(polishSections.map(name => ({ name, status: "pending" as const, content: "" })));
      setDetectedSections(polishSections.map(s => ({ standard: s, heading: null, content: null })));
      setSelectedSections(polishSections.map(() => true));
      setKeepOriginalOrder(false);
    }
    setDraft(value);
  }

  function runStreamingAction(title: string, url: string, payload: unknown) {
    setResultTitle(title);
    setResultText("");
    setError("");
    setIsLoading(true);

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1600);

    let fullText = "";
    let sectionsMarkerSeen = false;
    let fullDraftMarkerSeen = false;
    retryRef.current = () => runStreamingAction(title, url, payload);

    function findSectionsSplit(text: string): number {
      const markerIdx = text.indexOf("---SECTIONS---");
      if (markerIdx !== -1) return markerIdx;
      const jsonIdx = text.lastIndexOf('{"sections":');
      if (jsonIdx !== -1 && jsonIdx > text.length * 0.5) return jsonIdx;
      return -1;
    }

    function findFullDraftSplit(text: string): number {
      return text.indexOf("---FULL-DRAFT---");
    }

    postAiStream(url, payload, (chunk) => {
      if (!fullText) clearInterval(interval);
      fullText += chunk;
      if (sectionsMarkerSeen || fullDraftMarkerSeen) return;
      const sectionsSplit = findSectionsSplit(fullText);
      if (sectionsSplit !== -1) {
        sectionsMarkerSeen = true;
        setResultText(stripMarkdown(fullText.slice(0, sectionsSplit)));
        return;
      }
      const fullDraftSplit = findFullDraftSplit(fullText);
      if (fullDraftSplit !== -1) {
        fullDraftMarkerSeen = true;
        setResultText(stripMarkdown(fullText.slice(0, fullDraftSplit)));
        return;
      }
      setResultText(stripMarkdown(fullText));
    }, allowCollection)
      .then(() => {
        if (!fullText.trim()) throw new Error("AI 未返回内容，请重试。");

        // Parse ---SECTIONS--- or bare JSON from end of stream
        const splitIdx = findSectionsSplit(fullText);
        if (splitIdx !== -1 && title === "整体诊断结果") {
          let jsonPart = fullText.slice(splitIdx);
          jsonPart = jsonPart.replace(/^---SECTIONS---\s*/, "");
          const cleanJson = jsonPart.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
          try {
            const parsed = JSON.parse(cleanJson);
            if (parsed.sections && Array.isArray(parsed.sections)) {
              const mapped: DetectedSection[] = polishSections.map(s => {
                const match = parsed.sections.find((sec: { standard: string; heading: string | null; content: string | null }) => sec.standard === s);
                return match ? { standard: s, heading: match.heading, content: match.content } : { standard: s, heading: null, content: null };
              });
              setDetectedSections(mapped);
            }
          } catch { /* ignore parse errors, keep defaults */ }
        }
        // Parse ---FULL-DRAFT--- for polish-all output
        const fullDraftIdx = findFullDraftSplit(fullText);
        // For diagnosis, also exclude ---SECTIONS--- and JSON from display
        const sectionsIdx = (title === "整体诊断结果") ? findSectionsSplit(fullText) : -1;
        const displayEnd = fullDraftIdx !== -1 ? fullDraftIdx : (sectionsIdx !== -1 ? sectionsIdx : fullText.length);
        const displayText = fullText.slice(0, displayEnd);
        const polishedFullDraft = fullDraftIdx !== -1 ? fullText.slice(fullDraftIdx + "---FULL-DRAFT---".length).trim() : "";

        const cleaned = formatOutput(stripMarkdown(displayText));
        setResultText(cleaned);
        if (title === "整体诊断结果") {
          setCompletedDiagnosis(true);
          lastDiagnosedDraft.current = polishedDraft || draft;
        }
        if (title === "逐栏打磨" && polishedFullDraft) {
          setPolishedDraft(polishedFullDraft);
        }
        if (title === "模拟专家预审意见") {
          setCompletedExpert(true);
          lastReviewedDraft.current = polishedDraft || draft;
          fetch("/api/save-final", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionId.current,
              originalDraft: draft,
              polishedDraft: polishedDraft || draft,
              expertReview: cleaned,
              allowCollection
            })
          }).catch(() => {});
        }
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "处理失败，请稍后重试。");
      })
      .finally(() => {
        setIsLoading(false);
        setQuotaRefreshKey(k => k + 1);
        clearInterval(interval);
      });
  }

  function handleDiagnosis() {
    const content = polishedDraft || draft;
    if (!content.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }
    runStreamingAction("整体诊断结果", "/api/review-draft", { draft: content, scope: "整体诊断", allowCollection });
  }

  function assembleFullDraft() {
    const contentMap = polishContentRef.current;
    const srcDraft = polishInputDraft.current;

    if (keepOriginalOrder) {
      // Collect in-place replacements, then apply from bottom to top
      const replacements: { start: number; end: number; replacement: string }[] = [];

      for (let i = 0; i < polishSections.length; i++) {
        if (!selectedSections[i]) continue;
        const content = contentMap.get(i) || "";
        const parts = parseSectionParts(content);
        const modifiedText = parts.find(p => p.heading === "修改后文本")?.body || "";
        const isPlaceholder = modifiedText.includes("需用户补充") && modifiedText.replace(/\s/g, "").length < 80;
        if (!modifiedText.trim() || isPlaceholder) continue;

        const sectionName = polishSections[i];
        const heading = detectedSections.find(s => s.standard === sectionName)?.heading;
        const searchHeading = heading || sectionName;
        const startPos = findHeadingPos(srcDraft, searchHeading);
        if (startPos === -1) continue;

        // Preserve the original heading line from the draft
        const headingLineEnd = srcDraft.indexOf("\n", startPos);
        const draftHeadingLine = headingLineEnd !== -1 ? srcDraft.slice(startPos, headingLineEnd) : srcDraft.slice(startPos, Math.min(startPos + 200, srcDraft.length));

        // Find end boundary: next detected heading after this one
        const headingPositions = detectedSections
          .filter(s => s.standard !== sectionName)
          .map(s => {
            let pos = findHeadingPos(srcDraft, s.heading || s.standard);
            if (pos === -1 && s.heading && s.heading !== s.standard) {
              pos = findHeadingPos(srcDraft, s.standard);
            }
            return { pos };
          })
          .filter(x => x.pos > startPos)
          .sort((a, b) => a.pos - b.pos);
        const contentEnd = headingPositions.length > 0 ? headingPositions[0].pos : srcDraft.length;

        // Replace the entire section (from heading to next section) preserving the original heading
        replacements.push({
          start: startPos,
          end: contentEnd,
          replacement: `${draftHeadingLine}\n${ensureIndent(modifiedText)}\n\n`
        });
      }

      replacements.sort((a, b) => b.start - a.start);
      let result = srcDraft;
      for (const { start, end, replacement } of replacements) {
        result = result.slice(0, start) + replacement + result.slice(end);
      }
      setPolishedDraft(result.trim());
    } else {
      // Standard 18-section framework order
      let fullDraft = "";
      for (let i = 0; i < polishSections.length; i++) {
        const sectionName = polishSections[i];
        if (selectedSections[i]) {
          const content = contentMap.get(i) || "";
          const parts = parseSectionParts(content);
          const modifiedText = parts.find(p => p.heading === "修改后文本")?.body || "";
          const isPlaceholder = modifiedText.includes("需用户补充") && modifiedText.replace(/\s/g, "").length < 80;
          if (modifiedText.trim() && !isPlaceholder) {
            fullDraft += `${sectionName}\n${ensureIndent(modifiedText)}\n\n`;
          }
        } else {
          const originalText = extractSection(srcDraft, sectionName, detectedSections, true);
          if (originalText.trim()) {
            fullDraft += `${sectionName}\n${ensureIndent(originalText)}\n\n`;
          }
        }
      }
      setPolishedDraft(fullDraft.trim());
    }
  }

  function handlePolishStream() {
    const content = polishedDraft || draft;
    if (!content.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }

    const selectedCount = selectedSections.filter(Boolean).length;
    if (selectedCount === 0) {
      setError("请至少勾选一个需要打磨的栏目。");
      return;
    }

    setError("");
    setIsLoading(true);
    setShowPolishModal(true);
    setPolishStarted(true);
    setCompletedPolish(false);
    polishInputDraft.current = draft;

    const initial: PolishSectionState[] = polishSections.map((name, i) => ({
      name,
      status: selectedSections[i] ? "pending" : "skipped",
      content: ""
    }));
    setPolishSectionsState(initial);
    setViewIdx(Math.max(0, selectedSections.findIndex(Boolean)));
    polishContentRef.current.clear();
    retryRef.current = () => handlePolishStream();

    const MAX_CONCURRENT = 4;
    const MAX_RETRIES = 3;
    let completedCount = 0;
    let nextIndex = 0;

    async function polishOne(sectionName: string, i: number, attempt: number = 0): Promise<void> {
      const heading = detectedSections.find(s => s.standard === sectionName)?.heading || undefined;

      setPolishSectionsState(prev => {
        const next = [...prev];
        next[i] = { ...next[i], status: "streaming" };
        return next;
      });

      let buffer = "";
      try {
        await postAiStream("/api/polish-section", {
          draft: content,
          section: sectionName,
          heading,
          allowCollection
        }, (chunk) => {
          buffer += chunk;
          polishContentRef.current.set(i, buffer);
          setPolishSectionsState(prev => {
            const next = [...prev];
            next[i] = { ...next[i], content: buffer };
            return next;
          });
        });

        if (!buffer.trim()) throw new Error("AI 未返回内容");
        polishContentRef.current.set(i, buffer);
        setPolishSectionsState(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: "done", content: formatOutput(buffer) };
          return next;
        });
        completedCount++;
        if (completedCount === 1) setViewIdx(i);
        if (completedCount === polishSections.length) {
          setQuotaRefreshKey(k => k + 1);
          setIsLoading(false);
          setCompletedPolish(true);
          assembleFullDraft();
        }
      } catch (caught) {
        const errorMsg = caught instanceof Error ? caught.message : "";
        // Retry on rate limit
        if (errorMsg.includes("429") && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
          return polishOne(sectionName, i, attempt + 1);
        }
        const displayMsg = errorMsg || "打磨失败";
        const errorContent = `**识别到的原文**\n\n**原栏目问题**\n${displayMsg}\n\n**修改建议**\n请重试。\n\n**修改后文本**\n打磨失败，请重试。`;
        polishContentRef.current.set(i, errorContent);
        setPolishSectionsState(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: "error", content: errorContent };
          return next;
        });
        completedCount++;
        if (completedCount === 1) setViewIdx(i);
        if (completedCount === polishSections.length) {
          setQuotaRefreshKey(k => k + 1);
          setIsLoading(false);
          setCompletedPolish(true);
          assembleFullDraft();
        }
      }
    }

    async function runNext(): Promise<void> {
      while (nextIndex < polishSections.length) {
        const idx = nextIndex++;
        const name = polishSections[idx];
        if (!selectedSections[idx]) {
          completedCount++;
          if (completedCount === polishSections.length) {
            setIsLoading(false);
            setCompletedPolish(true);
            assembleFullDraft();
          }
          continue;
        }
        await polishOne(name, idx);
      }
    }

    // Start MAX_CONCURRENT workers
    Array.from({ length: Math.min(MAX_CONCURRENT, polishSections.length) }, () => runNext());
  }

  function openPolishModal() {
    setViewIdx(currentStreamIdx);
    setShowPolishModal(true);
  }

  function handleExpertReview() {
    const content = polishedDraft || draft;
    if (!content.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }
    runStreamingAction("模拟专家预审意见", "/api/expert-review", { draft: content, allowCollection });
  }

  function runPostToolStream(
    url: string,
    payload: Record<string, unknown>,
    setResult: (v: string) => void,
    setIsLoading: (v: boolean) => void,
  ) {
    setResult("");
    setIsLoading(true);
    setError("");

    let fullText = "";
    postAiStream(url, payload, (chunk) => {
      fullText += chunk;
      setResult(stripMarkdown(fullText));
    }, allowCollection)
      .then(() => { setResult(stripMarkdown(fullText)); })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "处理失败，请稍后重试。");
      })
      .finally(() => { setIsLoading(false); });
  }

  function handleGenerateLivePage() {
    const content = polishedDraft || draft;
    if (!content.trim()) { setError("请先完成申报书草稿。"); return; }
    runPostToolStream("/api/generate-livepage", { draft: content, allowCollection }, setLivePageResult, setIsLivePageLoading);
  }

  function getStepNumber(step: Step): number {
    if (step === "free") return 4;
    return step;
  }

  return (
    <main className="bg-[#FAF9F6] px-4 py-6 text-[#141413] sm:px-6 lg:px-8">
      <section className={`mx-auto flex flex-col gap-6 ${currentStep === 2 ? "max-w-6xl" : "max-w-4xl"}`}>
        {/* 返回 + 保存 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs font-bold text-[#6B7280] transition hover:border-[#D1D5DB] hover:text-[#141413]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 3L5 7L9 11" />
            </svg>
            返回首页
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] transition hover:text-[#141413] disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 10.5V2.5C9.5 2.22 9.28 2 9 2H7L6 3.5L5 2H3C2.72 2 2.5 2.22 2.5 2.5V10.5C2.5 10.78 2.72 11 3 11H9C9.28 11 9.5 10.78 9.5 10.5Z" />
              <path d="M7.5 2V4.5H4.5V2" />
              <path d="M4 7.5H8" />
              <path d="M4 9H8" />
            </svg>
            <span className="hidden sm:inline">{saving ? "保存中..." : "保存进度"}</span>
            <span className="sm:hidden">{saving ? "保存中" : "保存"}</span>
          </button>
        </div>

        <header>
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.01em] text-[#141413]">
              申报书打磨
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              按顺序完成诊断、打磨、预审，逐步完善申报书。
            </p>
          </div>
        </header>

        <StepNavigation
          steps={DRAFT_STEPS}
          currentStep={getStepNumber(currentStep)}
          allowForwardNavigation
          onGoToStep={(step) => {
            if (step <= 3) setCurrentStep(step as Step);
          }}
        />

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm leading-6 text-[#DC2626]">
            <span>{error}</span>
            {retryRef.current && (
              <button
                type="button"
                onClick={() => retryRef.current?.()}
                className="shrink-0 rounded-md border border-[#FECACA] bg-white px-3 py-1 text-xs font-bold text-[#DC2626] transition hover:bg-[#FEF2F2]"
              >
                重试
              </button>
            )}
          </div>
        )}

        {saveError && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm leading-6 text-[#DC2626]">
            <span>{saveError}</span>
            <button
              type="button"
              onClick={() => setSaveError("")}
              className="shrink-0 rounded-md border border-[#FECACA] bg-white px-2 py-1 text-xs font-bold text-[#DC2626] transition hover:bg-[#FEF2F2]"
            >
              关闭
            </button>
          </div>
        )}

        {/* Step 0: 输入草稿 */}
        {currentStep === 0 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">请将你的申报书草稿粘贴到下方。草稿越完整，诊断和打磨越有针对性。</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftOnly(draftExamples[0].value);
                  setPolishedDraft("");
                  historyStack.current = [];
                  historyIndex.current = -1;
                  setResultText("");
                  setError("");
                }}
                className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-2 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280] min-h-[44px]"
              >
                填入示例
              </button>
            </div>

            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("确定要清空当前草稿吗？")) {
                    setDraftOnly("");
                    setPolishedDraft("");
                    historyStack.current = [];
                    historyIndex.current = -1;
                    setResultText("");
                    setError("");
                    setCompletedDiagnosis(false);
                    setCompletedPolish(false);
                    setCompletedExpert(false);
                  }
                }}
                className="rounded-md border border-[#D1D5DB] bg-white px-2.5 py-2 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280] min-h-[44px]"
              >
                清空草稿
              </button>
            </div>

            <textarea
              placeholder="在此粘贴你的申报书草稿..."
              rows={14}
              value={draft}
              onChange={(e) => setDraftOnly(e.target.value)}
              className="focus-ring w-full resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-6 text-[#141413] placeholder:text-[#9CA3AF]"
            />

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setError("");
                }}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                下一步：整体诊断
              </button>
            </div>
          </div>
        )}

        {/* Step 1: 整体诊断 */}
        {currentStep === 1 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <p className="mb-1 text-sm font-bold text-[#6B7280]">操作提示</p>
            <p className="mb-5 text-sm leading-6 text-[#9CA3AF]">
              AI 会从选题、结构、逻辑、表述四个维度诊断你的草稿，指出问题并给出修改建议。
            </p>

            <div className="mb-5 rounded-md bg-[#FAF9F6] p-4">
              <p className="text-xs font-bold text-[#9CA3AF]">当前草稿（{draft.length} 字）</p>
              <p className="mt-1 text-sm leading-6 text-[#6B7280] line-clamp-3">
                {draft.slice(0, 200)}{draft.length > 200 ? "..." : ""}
              </p>
            </div>

            {completedDiagnosis && draft !== lastDiagnosedDraft.current && !isLoading && (
              <div className="mb-5 rounded-md border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-sm leading-6 text-[#C2410C]">
                草稿已修改，当前诊断结果基于旧版本。建议重新开始诊断。
              </div>
            )}

            {isLoading ? (
              resultText ? (
                <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-8 text-[#141413]">
                  {formatDiagnosticNumbering(resultText.split("---SECTIONS---")[0]).split("\n\n").map((block, i) => (
                    <p key={i} className="whitespace-pre-wrap">{block}</p>
                  ))}
                  <span className="animate-pulse">▊</span>
                </div>
              ) : (
                <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-8 text-center text-sm text-[#6B7280]">
                  {loadingSteps[loadingStepIndex]}，请稍候...
                </div>
              )
            ) : !completedDiagnosis ? (
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handleDiagnosis}
                  disabled={isLoading}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]"
                >
                  开始诊断
                </button>
              </div>
            ) : null}

            {!isLoading && resultText && resultTitle === "整体诊断结果" && (

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold text-[#141413]">诊断结果</h3>
                <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-8 text-[#141413]">
                  {formatDiagnosticNumbering(resultText.split("---SECTIONS---")[0]).split("\n\n").map((block, i) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {block}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {completedDiagnosis && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    setError("");
                  }}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  下一步：逐栏打磨
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 逐栏打磨 — 单栏布局 */}
        {currentStep === 2 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <DailyQuota refreshKey={quotaRefreshKey} />

            <div className="mb-4">
              <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
              <p className="text-sm leading-6 text-[#9CA3AF]">
                {polishStarted
                  ? "打磨结果已填入下方编辑器，可手动微调后进入模拟预审，或点击「打磨」回顾过程。"
                  : "AI 会按照申报书标准框架，逐栏诊断草稿并给出打磨建议，最后输出完整的打磨后全文。"}
              </p>
            </div>

            <div className="mb-5 rounded-md bg-[#FAF9F6] p-4">
              <p className="text-xs font-bold text-[#9CA3AF]">当前草稿（{(polishedDraft || draft).length} 字）</p>
              <p className="mt-1 text-sm leading-6 text-[#6B7280] line-clamp-3">
                {(polishedDraft || draft).slice(0, 200)}{(polishedDraft || draft).length > 200 ? "..." : ""}
              </p>
            </div>

            {/* Editor — shown after polish completes and modal is closed */}
            {polishStarted && !showPolishModal && (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#6B7280]">全文微调</p>
                      {polishedDraft !== draft && (
                        <span className="rounded-sm bg-[#FEF3E2] px-1.5 py-0.5 text-[11px] font-bold text-[#D97706]">已编辑</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={undo}
                      disabled={historyIndex.current <= 0}
                      className="rounded-md border border-[#E8E6E1] bg-white px-2 py-0.5 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280] disabled:opacity-40"
                      title="撤销 (Ctrl+Z)"
                    >
                      撤销
                    </button>
                  </div>
                  <p className="text-sm leading-6 text-[#9CA3AF]">
                    在此将原文修改成预审文本。
                    {polishedDraft !== draft && " 编辑后的版本将用于模拟预审。"}
                  </p>
                </div>
                <textarea
                  id="polish-editor-textarea"
                  value={polishedDraft || draft}
                  onChange={(e) => updatePolishedDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                      e.preventDefault();
                      undo();
                    }
                  }}
                  className="w-full resize-none rounded-md border border-[#E8E6E1] bg-white px-6 py-3 text-sm leading-8 text-[#141413] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#141413]/10 min-h-[40vh]"
                  placeholder="暂无草稿内容"
                />
              </>
            )}

            {/* Loading spinner — only before first polish */}
            {isLoading && !polishStarted && (
              <div className="mb-5 rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-12 text-center text-sm text-[#6B7280]">
                {loadingSteps[loadingStepIndex]}，请稍候...
              </div>
            )}

            {/* Section group selector */}
            {!polishStarted && (
              <div className="mb-5">
                <p className="text-xs font-bold text-[#6B7280] mb-3">
                  勾选需要打磨的栏目组（其余保持原样）
                </p>
                <div className="space-y-2">
                  {SECTION_GROUPS.map((group, gi) => {
                    const indices = group.sections.map(s => polishSections.indexOf(s));
                    const allSelected = indices.every(i => selectedSections[i]);
                    return (
                      <button
                        key={group.name}
                        type="button"
                        onClick={() => {
                          const next = [...selectedSections];
                          const setTo = !allSelected;
                          indices.forEach(i => { next[i] = setTo; });
                          setSelectedSections(next);
                        }}
                        className={`w-full rounded-md border p-3 flex flex-col md:flex-row md:items-baseline md:pl-[328px] transition ${
                          allSelected
                            ? "border-sky-400 bg-sky-50"
                            : "border-[#E8E6E1] bg-white hover:border-[#D1D5DB]"
                        }`}
                      >
                        <span className={`shrink-0 text-sm font-bold ${allSelected ? "text-sky-700" : "text-[#141413]"}`}>
                          {group.name}{allSelected ? " ✓" : ""}
                        </span>
                        <span className="hidden md:inline mx-2 text-[#D1D5DB] text-xs shrink-0">·</span>
                        <span className="text-xs text-[#9CA3AF] mt-0.5 md:mt-0">
                          {group.sections.join(" · ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <label className="mt-3 flex items-center gap-1.5 text-xs text-[#6B7280] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepOriginalOrder}
                    onChange={(e) => setKeepOriginalOrder(e.target.checked)}
                    className="accent-[#141413]"
                  />
                  保持原文顺序（不按标准框架重排）
                </label>
              </div>
            )}

            {/* Bottom buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
              <button
                type="button"
                onClick={() => { setCurrentStep(1); setError(""); }}
                className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                上一步
              </button>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {!isLoading && !polishStarted && (
                  <button
                    type="button"
                    onClick={handlePolishStream}
                    className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                  >
                    开始打磨
                  </button>
                )}
                {!isLoading && polishStarted && (
                  <>
                    <button
                      type="button"
                      onClick={openPolishModal}
                      className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                    >
                      查看打磨结果
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCurrentStep(3); setError(""); }}
                      className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF] sm:bg-[#141413] sm:text-white sm:font-extrabold sm:border-none sm:hover:bg-[#2A2A28]"
                    >
                      下一步：模拟预审
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 模拟专家预审 */}
        {currentStep === 3 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <p className="mb-1 text-sm font-bold text-[#6B7280]">操作提示</p>
            <p className="mb-5 text-sm leading-6 text-[#9CA3AF]">
              AI 会从评审专家视角审阅你的申报书，给出总体评价、优点、改进建议和是否推荐立项的判断。
            </p>

            <div className="mb-5 rounded-md bg-[#FAF9F6] p-4">
              <p className="text-xs font-bold text-[#9CA3AF]">
                预审草稿（{(polishedDraft || draft).length} 字）
                {polishedDraft && polishedDraft !== draft && (
                  <span className="ml-2 text-[#D97706]">已使用打磨后的版本</span>
                )}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#6B7280] line-clamp-3">
                {(polishedDraft || draft).slice(0, 200)}{(polishedDraft || draft).length > 200 ? "..." : ""}
              </p>
            </div>

            {(() => {
              const currentDraft = polishedDraft || draft;
              const draftChanged = lastReviewedDraft.current && currentDraft !== lastReviewedDraft.current;

              if (isLoading) {
                return (
                  resultText ? (
                    <div className="rounded-md bg-[#FAF9F6] p-4 text-sm leading-8 whitespace-pre-wrap text-[#141413]">
                      {resultText}<span className="animate-pulse">▊</span>
                    </div>
                  ) : (
                    <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-8 text-center text-sm text-[#6B7280]">
                      {loadingSteps[loadingStepIndex]}，请稍候...
                    </div>
                  )
                );
              }

              if (completedExpert && !draftChanged) {
                return (
                  <>
                    {resultText && resultTitle === "模拟专家预审意见" && (
                      <div>
                        <h3 className="mb-3 text-sm font-bold text-[#141413]">预审意见</h3>
                        <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-8 text-[#141413]">
                          {resultText.split("\n\n").map((block, i) => <p key={i} className="whitespace-pre-wrap">{block}</p>)}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 flex justify-between">
                      <button type="button" onClick={() => { setCurrentStep(2); setError(""); }} className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]">
                        返回打磨
                      </button>
                      <button type="button" onClick={handleSaveAndExport} className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]">
                        导出
                      </button>
                    </div>
                    <div className="mt-6 border-t border-[#E8E6E1] pt-5">
                      <FeedbackWidget />
                    </div>
                  </>
                );
              }

              return (
                <>
                  <div className="flex justify-between">
                    <button type="button" onClick={() => setCurrentStep(3)} className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]">
                      上一步
                    </button>
                    <button type="button" onClick={handleExpertReview} className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]">
                      开始预审
                    </button>
                  </div>
                  {resultText && resultTitle === "模拟专家预审意见" && (
                    <div className="mt-6">
                      <h3 className="mb-3 text-sm font-bold text-[#141413]">上次预审意见</h3>
                      <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-8 text-[#141413]">
                        {resultText.split("\n\n").map((block, i) => <p key={i} className="whitespace-pre-wrap">{block}</p>)}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {completedExpert && !(lastReviewedDraft.current && (polishedDraft || draft) === lastReviewedDraft.current) && (
              <div className="mt-6 border-t border-[#E8E6E1] pt-5">
                <FeedbackWidget />
              </div>
            )}
          </div>
        )}

        {/* 个人信息检查（独立卡片） */}
        {currentStep === 3 && completedExpert && lastReviewedDraft.current && (polishedDraft || draft) === lastReviewedDraft.current && resultText && resultTitle === "模拟专家预审意见" && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-5">
            <button
              type="button"
              onClick={() => setShowPostTools(!showPostTools)}
              className="flex items-center gap-1.5 text-sm font-bold text-[#6B7280] transition hover:text-[#141413]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition ${showPostTools ? "rotate-90" : ""}`}>
                <path d="M4 2L8 6L4 10" />
              </svg>
              个人信息检查（用于盲审版）
            </button>
            {showPostTools && (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-[#9CA3AF]">扫描申报书中的个人信息，标出位置和修改建议。</p>
                  {!isLivePageLoading && !livePageResult && (
                    <button type="button" onClick={handleGenerateLivePage} className="shrink-0 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-bold text-[#141413] transition hover:bg-[#F3F2EF]">开始检查</button>
                  )}
                </div>
                {isLivePageLoading && (
                  <div className="mt-3 rounded-md bg-[#FAF9F6] px-4 py-3 text-xs text-[#6B7280]">
                    {livePageResult ? <span className="animate-pulse">▊</span> : "正在扫描个人信息..."}
                  </div>
                )}
                {livePageResult && !isLivePageLoading && (
                  <div className="mt-3 max-h-80 overflow-y-auto rounded-md bg-[#FAF9F6] p-4 text-sm leading-7 whitespace-pre-wrap text-[#141413]">{livePageResult}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 作者的话 — 预审结束后显示 */}
        {currentStep === 3 && completedExpert && (
          <div className="mt-10 border-t border-[#E8E6E1] pt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAuthorNote(!showAuthorNote)}
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.15em] text-[#9CA3AF] uppercase hover:text-[#6B7280] transition"
            >
              作者的话
              <span className={`text-[10px] transition ${showAuthorNote ? "rotate-180" : ""}`}>▼</span>
            </button>
            {showAuthorNote && (
              <div className="mt-4 text-sm leading-7 text-[#6B7280] space-y-4 text-center max-w-2xl mx-auto" style={{ fontFamily: '"KaiTi", "STKaiti", "楷体", "Ma Shan Zheng", cursive' }}>
                <p>你好，奋斗在路上的同行者。</p>
                <p>希望我做的这个小工具能够帮助你在"写课题申请书"上少走一些弯路，节约一些时间。</p>
                <p>谢谢你使用我做的小工具。如果好用的话，欢迎推荐给你的朋友。</p>
                <p>这个小工具，是我对世界伸出的触角，当我知道我帮助到了更多的教师，我会很开心，欢迎留言！</p>
                <p>如果你有什么有意思的想法，可以联系我，让我们看看能不能把它变成现实。</p>
                <p>
                  我的邮箱：<a href="mailto:mr.lou@zjnu.edu.cn" className="underline underline-offset-2 hover:text-[#141413] transition">mr.lou@zjnu.edu.cn</a>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Free mode: after completing the 4-step linear flow */}
        {currentStep === "free" && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-6 rounded-md bg-[#EBF5FF] px-5 py-4">
              <p className="text-sm font-extrabold text-[#0070F3]">流程完成！</p>
              <p className="mt-1 text-sm leading-6 text-[#0070F3]">
                你的申报书已经过诊断、打磨、预审。还需要微调？选择一个功能继续。
              </p>
            </div>

            {/* 版本状态 */}
            <div className="mb-5 rounded-md bg-[#FAF9F6] p-4">
              <p className="text-xs font-bold text-[#9CA3AF] mb-2">版本状态</p>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span className="rounded-sm bg-[#E8E6E1] px-2 py-0.5 font-bold text-[#6B7280]">原始稿</span>
                <span className="text-[#D1D5DB]">→</span>
                {polishedDraft && polishedDraft !== draft ? (
                  <>
                    <span className="rounded-sm bg-[#FEF3E2] px-2 py-0.5 font-bold text-[#D97706]">中稿</span>
                    <span className="text-[#D1D5DB]">→</span>
                  </>
                ) : null}
                <span className="rounded-sm bg-[#EBF5FF] px-2 py-0.5 font-bold text-[#0070F3]">预审稿</span>
              </div>
              <div className="mt-2 text-xs text-[#9CA3AF]">
                {polishedDraft && polishedDraft !== draft
                  ? `原始稿 ${draft.length} 字 → 中稿 ${polishedDraft.length} 字`
                  : `当前共 ${draft.length} 字，未做打磨修改`
                }
              </div>
            </div>

            <p className="mb-4 text-sm font-bold text-[#6B7280]">自由选择功能</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setError("");
                }}
                className="focus-ring rounded-lg border border-[#E8E6E1] bg-white p-4 text-left transition hover:border-[#141413] hover:shadow-sm"
              >
                <p className="text-sm font-extrabold text-[#141413]">整体诊断</p>
                <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                  重新诊断草稿结构与逻辑
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                  setError("");
                }}
                className="focus-ring rounded-lg border border-[#E8E6E1] bg-white p-4 text-left transition hover:border-[#141413] hover:shadow-sm"
              >
                <p className="text-sm font-extrabold text-[#141413]">逐栏打磨</p>
                <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                  选择栏目进行深度打磨
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                  setError("");
                }}
                className="focus-ring rounded-lg border border-[#E8E6E1] bg-white p-4 text-left transition hover:border-[#141413] hover:shadow-sm"
              >
                <p className="text-sm font-extrabold text-[#141413]">模拟专家预审</p>
                <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                  从评审专家角度审阅
                </p>
              </button>
            </div>

            <div className="mt-6 rounded-md border border-dashed border-[#E8E6E1] bg-[#FAF9F6] p-4">
              <p className="text-xs font-bold text-[#9CA3AF]">最后生成的结果</p>
              <p className="mt-1 text-sm text-[#6B7280]">{resultTitle}</p>
              {resultText && (
                <div className="mt-3 max-h-64 overflow-y-auto rounded bg-white p-4 text-sm leading-8 text-[#141413]">
                  <div className="space-y-3">
                    {resultText.split("\n\n").map((block, i) => (
                      <p key={i} className="whitespace-pre-wrap">
                        {block}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(0);
                  setResultText("");
                  setResultTitle("");
                  setError("");
                }}
                className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                重新开始
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                导出
              </button>
            </div>

          </div>
        )}

        {currentStep !== "free" && currentStep !== 0 && currentStep !== 3 && resultText && resultTitle && !isLoading && (
          <div className="mt-2">
            <label className="mb-4 flex cursor-pointer items-center gap-2 text-xs text-[#6B7280]">
              <input
                type="checkbox"
                checked={allowCollection}
                onChange={(e) => setAllowCollection(e.target.checked)}
                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#141413]"
              />
              允许匿名收集输入内容用于优化工具
            </label>
          </div>
        )}
      </section>

      {/* Save code modal */}
      {showSaveModal && saveCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35" onClick={() => setShowSaveModal(false)}>
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-[#9CA3AF]">进度已保存</p>
            <p className="mt-3 text-center text-3xl font-extrabold tracking-[0.15em] text-[#141413] select-all">{saveCode}</p>
            <p className="mt-3 text-xs text-[#9CA3AF]">记住保存码，换台电脑接着做，保质期30天。</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await copyToClipboard(saveCode);
                  setSaveCopied(true);
                  setTimeout(() => setSaveCopied(false), 1800);
                }}
                className="flex-1 rounded-md border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                {saveCopied ? "已复制 ✓" : "复制保存码"}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 rounded-md bg-[#141413] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2A2A28]"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 全屏打磨弹窗 */}
      {showPolishModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPolishModal(false)} />
          <div className="fixed inset-2 md:inset-8 bg-white rounded-lg shadow-2xl z-50 flex flex-col max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E1] shrink-0">
              <h2 className="text-base font-bold text-[#141413]">逐栏打磨</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPolishModal(false)}
                  className="text-[#9CA3AF] hover:text-[#141413] transition text-lg leading-none"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row flex-1 min-h-0">
              {/* Mobile section selector */}
              <div className="md:hidden px-4 pt-4 pb-2 shrink-0">
                <select
                  value={viewIdx}
                  onChange={(e) => setViewIdx(Number(e.target.value))}
                  className="w-full rounded-md border border-[#D1D5DB] px-3 py-2 text-sm text-[#141413] bg-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  {polishSectionsState.map((s, i) => (
                    <option
                      key={s.name}
                      value={i}
                      disabled={s.status === "pending"}
                    >
                      {s.status === "done" ? "✓ " : s.status === "streaming" ? "⋯ " : s.status === "skipped" ? "— " : "○ "}
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden md:block w-48 shrink-0 border-r border-[#E8E6E1] p-4 space-y-0.5 overflow-y-auto">
                {polishSectionsState.map((s, i) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => { if (s.status === "done") setViewIdx(i); }}
                    disabled={s.status === "pending" || s.status === "skipped"}
                    className={`w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2.5 transition
                      ${viewIdx === i && s.status !== "skipped" ? "bg-[#E8E6E1]" : ""}
                      ${s.status === "done" ? "cursor-pointer hover:bg-[#F3F2EF]" : "cursor-default"}
                      ${s.status === "skipped" ? "border border-dashed border-[#E8E6E1]" : ""}
                    `}
                  >
                    <span className={`shrink-0 w-2 h-2 rounded-full
                      ${s.status === "done" ? "bg-emerald-500" : ""}
                      ${s.status === "streaming" ? "bg-sky-500 animate-pulse" : ""}
                      ${s.status === "pending" ? "bg-slate-300" : ""}
                      ${s.status === "skipped" ? "bg-slate-200" : ""}
                    `} />
                    <span className={`truncate text-xs leading-tight
                      ${s.status === "pending" ? "text-[#D1D5DB]" : ""}
                      ${s.status === "skipped" ? "text-[#D1D5DB]" : ""}
                      ${s.status === "streaming" ? "font-bold text-[#141413]" : ""}
                      ${s.status === "done" ? "text-[#141413]" : ""}
                    `}>{s.name}{s.status === "skipped" ? " · 跳过" : ""}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                {(() => {
                  const sec = polishSectionsState[viewIdx];
                  if (!sec) return null;
                  const parts = parseSectionParts(sec.content);
                  const isEmpty = !sec.content && sec.status === "streaming";
                  const isSkipped = sec.status === "skipped";
                  return (
                    <div>
                      <h3 className="text-base font-bold text-[#141413] mb-6 flex items-center gap-2">
                        {sec.name}
                        {sec.status === "streaming" && (
                          <span className="text-xs font-normal text-sky-600 animate-pulse">打磨中</span>
                        )}
                        {sec.status === "done" && (
                          <span className="text-xs font-normal text-emerald-600">✓ 完成</span>
                        )}
                        {isSkipped && (
                          <span className="text-xs font-normal text-[#9CA3AF]">未打磨</span>
                        )}
                      </h3>
                      {isSkipped ? (
                        <p className="text-sm text-[#9CA3AF]">此栏目未选择打磨，原文已保留在最终文稿中。</p>
                      ) : isEmpty ? (
                        <p className="text-sm text-[#9CA3AF]">正在分析中...</p>
                      ) : (
                        <div className="text-sm leading-7 text-[#141413]">
                          {parts.map((part, j) => (
                            <div key={j} className={j > 0 ? "mt-5" : ""}>
                              <p className="text-xs font-bold text-[#6B7280] mb-2">{part.heading}</p>
                              <div className={
                                part.heading === "识别到的原文"
                                  ? "border-l-2 border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3 text-[13px] leading-7 text-[#6B7280]"
                                  : part.heading === "修改后文本"
                                    ? "font-semibold"
                                    : ""
                              }>
                                <span className="whitespace-pre-wrap">{part.heading === "修改后文本" ? ensureIndent(part.body) : part.body}</span>
                              </div>
                            </div>
                          ))}
                          {sec.status === "streaming" && (
                            <span className="animate-pulse text-sky-500">▊</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex justify-center px-6 py-4 border-t border-[#E8E6E1] shrink-0">
              <button
                type="button"
                onClick={() => setShowPolishModal(false)}
                className="focus-ring h-11 rounded-md bg-[#141413] px-8 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                关闭，进入全文微调
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
