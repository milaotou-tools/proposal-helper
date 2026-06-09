"use client";

import { useState, useRef, useEffect } from "react";
import { StepNavigation } from "@/components/StepNavigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { DailyQuota } from "@/components/DailyQuota";
import { usePersistedState } from "@/lib/use-persisted-state";
import { postAiStream, stripMarkdown, copyToClipboard } from "@/lib/utils";
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
  "选题依据",
  "文献综述",
  "研究目标",
  "研究内容",
  "研究方法",
  "实施步骤",
  "预期成果",
  "研究条件",
  "创新点"
];

const loadingSteps = ["正在分析中", "正在整理思路", "正在生成结果"];

type Step = 0 | 1 | 2 | 3 | "free";

type DetectedSection = { standard: string; heading: string | null; content: string | null };

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
  const startPos = findHeadingPos(draft, targetHeading);
  if (startPos === -1) return "";

  // Find the colon on the heading line only
  const lineEnd = draft.indexOf("\n", startPos);
  const headingLine = lineEnd !== -1 ? draft.slice(startPos, lineEnd) : draft.slice(startPos, Math.min(startPos + 200, draft.length));
  const colonIdx = headingLine.search(/[：:]/);
  const startContent = colonIdx !== -1 ? startPos + colonIdx + 1 : (lineEnd !== -1 ? lineEnd + 1 : startPos + targetHeading.length);

  // Boundary: find all heading positions in the draft, sorted by actual position
  const headingPositions = detectedSections
    .filter(s => s.standard !== section)
    .map(s => ({ standard: s.standard, pos: findHeadingPos(draft, s.heading || s.standard) }))
    .filter(x => x.pos > startPos)
    .sort((a, b) => a.pos - b.pos);

  const endPos = headingPositions.length > 0 ? headingPositions[0].pos : draft.length;

  return draft.slice(startContent, endPos).trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCellText(value: string): string {
  return escapeHtml(value || "（未检测到该栏目内容）").replace(/\n/g, "<br />");
}

function highlightChangedText(original: string, modified: string): string {
  const oldText = original.trim();
  const newText = modified.trim();

  if (!newText || oldText === newText) return formatCellText(newText);
  if (!oldText || oldText.length * newText.length > 180000) {
    return `<span class="changed">${formatCellText(newText)}</span>`;
  }

  const rows = oldText.length + 1;
  const cols = newText.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(cols));

  for (let i = oldText.length - 1; i >= 0; i--) {
    for (let j = newText.length - 1; j >= 0; j--) {
      table[i][j] = oldText[i] === newText[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const unchanged = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < oldText.length && j < newText.length) {
    if (oldText[i] === newText[j]) {
      unchanged.add(j);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  let html = "";
  let changedBuffer = "";
  const flushChanged = () => {
    if (!changedBuffer) return;
    html += `<span class="changed">${escapeHtml(changedBuffer).replace(/\n/g, "<br />")}</span>`;
    changedBuffer = "";
  };

  for (let index = 0; index < newText.length; index++) {
    const char = newText[index];
    if (unchanged.has(index)) {
      flushChanged();
      html += char === "\n" ? "<br />" : escapeHtml(char);
    } else {
      changedBuffer += char;
    }
  }
  flushChanged();
  return html;
}

function describeSectionProgress(original: string, modified: string): string {
  const oldText = original.trim();
  const newText = modified.trim();

  if (!oldText && !newText) return "原稿和修改后稿均未检测到该栏目。";
  if (!oldText && newText) return "新增了该栏目内容，补齐申报书结构。";
  if (oldText && !newText) return "修改后稿未保留该栏目内容，请确认是否需要补回。";
  if (oldText === newText) return "暂无明显修改。";

  const oldLength = oldText.length;
  const newLength = newText.length;
  const delta = newLength - oldLength;
  const ratio = Math.abs(delta) / Math.max(oldLength, 1);

  if (ratio < 0.08) return "在保留原意基础上调整了表述，使语言更顺畅。";
  if (delta > 0) return "补充了相关内容，使论证和说明更充分。";
  return "压缩了重复或冗余表达，使栏目更精炼。";
}

function buildComparisonExportHtml(originalDraft: string, modifiedDraft: string, detected: DetectedSection[]): string {
  const generatedAt = new Date().toLocaleString("zh-CN");
  const changedSections = detected.filter(({ standard }) => {
    const original = extractSection(originalDraft, standard, detected);
    const modified = extractSection(modifiedDraft, standard, detected, true);
    return original.trim() !== modified.trim();
  });
  const rows = changedSections.map(({ standard }) => {
    const original = extractSection(originalDraft, standard, detected);
    const modified = extractSection(modifiedDraft, standard, detected, true);
    return `
      <tr>
        <td class="section">${escapeHtml(standard)}</td>
        <td>${formatCellText(original)}</td>
        <td>${highlightChangedText(original, modified)}</td>
        <td class="note">${escapeHtml(describeSectionProgress(original, modified))}</td>
      </tr>
    `;
  }).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>申报书逐栏修改对比表</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 40px 48px;
      color: #111827;
      background: #ffffff;
      font-family: "Microsoft YaHei", "Noto Sans SC", sans-serif;
    }
    main { max-width: 1180px; margin: 0 auto; }
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .meta {
      margin: 8px 0 24px;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.7;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border-top: 2px solid #111827;
      border-bottom: 2px solid #111827;
    }
    thead tr { border-bottom: 1px solid #111827; }
    tbody tr + tr { border-top: 1px solid #e5e7eb; }
    th, td {
      padding: 12px 14px;
      vertical-align: top;
      font-size: 13px;
      line-height: 1.8;
      text-align: left;
      word-break: break-word;
    }
    th {
      color: #111827;
      font-weight: 700;
      background: #ffffff;
    }
    td { color: #1f2937; }
    .section {
      width: 108px;
      color: #111827;
      font-weight: 700;
    }
    .note { width: 18%; color: #4b5563; }
    .changed {
      border-radius: 2px;
      background: #fff2b8;
      color: #7c2d12;
      box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.18);
    }
    @media print {
      body { padding: 24px; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <main>
    <h1>申报书逐栏修改对比表</h1>
    <p class="meta">导出时间：${escapeHtml(generatedAt)}。优化之处已用浅黄色标记。</p>
    <table>
      <thead>
        <tr>
          <th>栏目</th>
          <th>原稿</th>
          <th>打磨后</th>
          <th class="note">进步之处</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </main>
</body>
</html>`;
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
  const [polishSection, setPolishSection] = useState("课题名称");
  const [resultTitle, setResultTitle] = useState("");
  const [resultText, setResultText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPolishSection, setLoadingPolishSection] = useState<string | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [allowCollection, setAllowCollection] = useState(true);
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

  // Post-polish tool state
  const [livePageResult, setLivePageResult] = usePersistedState<string>("ph-livepage-result", "");
  const [isLivePageLoading, setIsLivePageLoading] = useState(false);
  const [showPostTools, setShowPostTools] = useState(false);

  // Cache AI polish results per section
  const [polishCache, setPolishCache] = usePersistedState<Record<string, string>>("ph-polish-cache", {});

  // Restore from snapshot on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (restoredSnapshot?.draft || restoredSnapshot?.polishedDraft) {
      const s = restoredSnapshot;
      if (s.draft) setDraft(s.draft);
      if (s.polishedDraft) setPolishedDraft(s.polishedDraft);
      if (s.polishCache) setPolishCache(s.polishCache);
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
  }, [restoredSnapshot, setDraft, setPolishedDraft, setPolishCache, setDetectedSections]);

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
          polishCache,
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
    const comparisonHtml = buildComparisonExportHtml(draft, finalDraft, detectedSections);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    downloadFile(finalDraft, `申报书修改后稿_${dateStr}.txt`, "text/plain;charset=utf-8");
    downloadFile(comparisonHtml, `申报书逐栏修改对比表_${dateStr}.html`, "text/html;charset=utf-8");
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
      .map(s => ({ pos: findHeadingPos(current, s.heading || s.standard) }))
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
    retryRef.current = () => runStreamingAction(title, url, payload);

    function findSectionsSplit(text: string): number {
      const markerIdx = text.indexOf("---SECTIONS---");
      if (markerIdx !== -1) return markerIdx;
      // Fallback: try to find {"sections": at the end
      const jsonIdx = text.lastIndexOf('{"sections":');
      if (jsonIdx !== -1 && jsonIdx > text.length * 0.5) return jsonIdx;
      return -1;
    }

    postAiStream(url, payload, (chunk) => {
      if (!fullText) clearInterval(interval);
      fullText += chunk;
      if (sectionsMarkerSeen) return;
      const splitIdx = findSectionsSplit(fullText);
      if (splitIdx !== -1) {
        sectionsMarkerSeen = true;
        setResultText(stripMarkdown(fullText.slice(0, splitIdx)));
        return;
      }
      setResultText(stripMarkdown(fullText));
    }, allowCollection)
      .then(() => {
        // Parse ---SECTIONS--- or bare JSON from end of stream
        const splitIdx = findSectionsSplit(fullText);
        if (splitIdx !== -1 && title === "整体诊断结果") {
          let jsonPart = fullText.slice(splitIdx);
          // Remove the marker if present
          jsonPart = jsonPart.replace(/^---SECTIONS---\s*/, "");
          // Strip markdown code fences if present
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
        const cleaned = stripMarkdown(fullText.slice(0, splitIdx !== -1 ? splitIdx : undefined));
        setResultText(cleaned);
        if (title === "整体诊断结果") {
          setCompletedDiagnosis(true);
          lastDiagnosedDraft.current = polishedDraft || draft;
        }
        if (title.startsWith("逐栏打磨")) {
          setPolishCache((prev) => ({ ...prev, [polishSection]: cleaned }));
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
        setLoadingPolishSection(null);
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

  function handlePolish() {
    const content = polishedDraft || draft;
    if (!content.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }
    setLoadingPolishSection(polishSection);
    const heading = detectedSections.find(s => s.standard === polishSection)?.heading;
    runStreamingAction(`逐栏打磨：${polishSection}`, "/api/polish-section", { draft: content, section: polishSection, heading, allowCollection });
    setCompletedPolish(true);
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
        {/* 返回按钮 */}
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
        </div>

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-[-0.01em] text-[#141413]">
              申报书打磨
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              按顺序完成诊断、打磨、预审，逐步完善申报书。
            </p>
          </div>
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
            {saving ? "保存中..." : "保存进度"}
          </button>
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
                className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
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
                    setPolishCache({});
                  }
                }}
                className="rounded-md border border-[#D1D5DB] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
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
                  setPolishCache({});
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
                <div className="rounded-md bg-[#FAF9F6] p-4 text-sm leading-8 whitespace-pre-wrap text-[#141413]">
                  {resultText}<span className="animate-pulse">▊</span>
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
                  {resultText.split("\n\n").map((block, i) => (
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

        {/* Step 2: 逐栏打磨 — 左右分栏 */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-5 lg:flex-row">
            {/* 左侧：步骤内容 */}
            <div className="flex flex-1 flex-col rounded-md border border-[#E8E6E1] bg-white p-6">
              <DailyQuota />

              <div className="mb-4">
                <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">选择栏目查看原文，点击"开始打磨"获取 AI 建议。复制修改内容后在原文编辑器中替换。编辑好后进入下一步：模拟预审。</p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-[#141413]">选择要打磨的栏目</label>
                <div className="flex flex-wrap gap-2">
                  {detectedSections.map(({ standard, heading }) => (
                    <button
                      key={standard}
                      type="button"
                      onClick={() => {
                        setPolishSection(standard);
                        const cached = polishCache[standard];
                        setResultText(cached || "");
                        if (cached) setResultTitle(`逐栏打磨：${standard}`);
                        setError("");
                      }}
                      className={`focus-ring rounded-md px-3 py-2 text-sm font-bold transition ${
                        polishSection === standard
                          ? "bg-[#141413] text-white"
                          : "border border-[#E8E6E1] bg-white text-[#141413] hover:bg-[#F3F2EF]"
                      }`}
                    >
                      {standard}
                    </button>
                  ))}
                </div>
              </div>

              {/* 该栏目的原文 — 始终基于原始草稿，作为稳定参照 */}
              {extractSection(draft, polishSection, detectedSections) && (
                <div className="mb-5 rounded-md bg-[#FAF9F6] p-4">
                  <p className="text-xs font-bold text-[#9CA3AF]">当前栏目原文</p>
                  <p className="mt-1 text-sm leading-7 whitespace-pre-wrap text-[#6B7280]">
                    {extractSection(draft, polishSection, detectedSections)}
                  </p>
                </div>
              )}

              {/* AI 打磨建议区 */}
              {isLoading && loadingPolishSection === polishSection && (
                resultText ? (
                  <div className="rounded-md bg-[#FAF9F6] p-4 text-sm leading-8 whitespace-pre-wrap text-[#141413]">
                    {resultText}<span className="animate-pulse">▊</span>
                  </div>
                ) : (
                  <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-12 text-center text-sm text-[#6B7280]">
                    {loadingSteps[loadingStepIndex]}，请稍候...
                  </div>
                )
              )}

              {resultText && resultTitle.startsWith("逐栏打磨") && !(isLoading && loadingPolishSection === polishSection) && (
                <div
                  onClick={() => {
                    // Don't hijack if user is selecting text to copy
                    const sel = window.getSelection();
                    if (sel && sel.toString().length > 0) return;

                    const ta = document.getElementById("polish-editor-textarea") as HTMLTextAreaElement | null;
                    if (!ta) return;
                    const heading = detectedSections.find(s => s.standard === polishSection)?.heading || polishSection;
                    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const pattern = new RegExp(`${escaped}[：:]`, "i");
                    const idx = ta.value.search(pattern);
                    if (idx !== -1) {
                      ta.focus({ preventScroll: true });
                      ta.setSelectionRange(idx, idx + polishSection.length + 1);
                    }
                  }}
                  className="group relative cursor-pointer rounded-md bg-[#FAF9F6] p-4 pb-8 text-sm leading-8 whitespace-pre-wrap text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  {resultText}
                  <span className="absolute right-3 bottom-2 text-[11px] text-[#D1D5DB] transition group-hover:text-[#9CA3AF] select-none">↗ 点击定位到编辑器</span>
                </div>
              )}

              {/* 底部按钮 */}
              <div className="mt-auto flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setError("");
                  }}
                  className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  上一步
                </button>
                {!(isLoading && loadingPolishSection === polishSection) && (
                  <button
                    type="button"
                    onClick={handlePolish}
                    className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                  >
                    {polishCache[polishSection] ? "重新打磨" : "开始打磨"}
                  </button>
                )}
              </div>
            </div>

            {/* 右侧：全文编辑面板 */}
            <div className="flex flex-1 flex-col rounded-md border border-[#E8E6E1] bg-white p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#6B7280]">原文编辑</p>
                    {polishedDraft !== draft && (
                      <span className="rounded-sm bg-[#FEF3E2] px-1.5 py-0.5 text-[11px] font-bold text-[#D97706]">已编辑</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                </div>
                <p className="text-sm leading-6 text-[#9CA3AF]">
                  在此将原文修改成预审文本。
                  {polishedDraft !== draft && "编辑后的版本将用于模拟预审。"}
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
                className="flex-1 w-full resize-none rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-8 text-[#141413] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#141413]/10 min-h-[60vh] lg:min-h-0"
                placeholder="暂无草稿内容"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    setError("");
                  }}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  下一步：模拟预审
                </button>
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

              // D: Loading
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

              // B: Reviewed, draft unchanged — show result, no re-review button
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

              // C: Reviewed, draft changed — show old result + allow re-review
              // A: First time — no result, just review button
              return (
                <>
                  <div className="flex justify-between">
                    <button type="button" onClick={() => setCurrentStep(2)} className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]">
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
                  setPolishCache({});
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

        {currentStep !== "free" && currentStep !== 0 && resultText && resultTitle && !isLoading && (
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
    </main>
  );
}
