"use client";

import { useState, useRef } from "react";
import { StepNavigation } from "@/components/StepNavigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { PaymentModal } from "@/components/PaymentModal";
import { usePersistedState } from "@/lib/use-persisted-state";
import { postAiStream, stripMarkdown, PAID_PRICE } from "@/lib/utils";

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

type DraftStepsProps = {
  onBack: () => void;
};

function extractSection(draft: string, section: string): string {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|\\n)(?:\\d+[、.]\\s*)?${escaped}[：:]\\s*([\\s\\S]*?)(?=\\n(?:\\d+[、.]\\s*)?(?:${polishSections.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[：:]|$)`,
    "i"
  );
  const match = draft.match(pattern);
  return match?.[1]?.trim() || "";
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

function buildComparisonExportHtml(originalDraft: string, modifiedDraft: string): string {
  const generatedAt = new Date().toLocaleString("zh-CN");
  const rows = polishSections.map((section) => {
    const original = extractSection(originalDraft, section);
    const modified = extractSection(modifiedDraft, section);
    return `
      <tr>
        <td class="section">${escapeHtml(section)}</td>
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

export function DraftSteps({ onBack }: DraftStepsProps) {
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
  const [isUnlocked, setIsUnlocked] = usePersistedState("ph-unlocked", false);
  const [polishCount, setPolishCount] = usePersistedState("ph-polish-usage", 0);
  const [reviewCount, setReviewCount] = usePersistedState("ph-review-usage", 0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const lastReviewedDraft = useRef("");
  const retryRef = useRef<(() => void) | null>(null);

  // Cache AI polish results per section
  const [polishCache, setPolishCache] = usePersistedState<Record<string, string>>("ph-polish-cache", {});

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
    const comparisonHtml = buildComparisonExportHtml(draft, finalDraft);
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

  function updateSectionInDraft(section: string, newText: string) {
    const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `((?:^|\\n)(?:\\d+[、.]\\s*)?${escaped}[：:]\\s*)[\\s\\S]*?(?=\\n(?:\\d+[、.]\\s*)?(?:${polishSections.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[：:]|$)`,
      "i"
    );
    const current = polishedDraft || draft;
    if (pattern.test(current)) {
      setPolishedDraft(current.replace(pattern, `$1${newText}`));
    } else {
      // Section not found, append
      setPolishedDraft(current + `\n\n${section}：${newText}`);
    }
  }

  // Sync polished draft when draft is first loaded
  function setDraftAndSync(value: string) {
    setDraft(value);
    pushHistory(polishedDraft || draft);
    setPolishedDraft(value);
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
    retryRef.current = () => runStreamingAction(title, url, payload);

    postAiStream(url, payload, (chunk) => {
      if (!fullText) clearInterval(interval);
      fullText += chunk;
      setResultText(stripMarkdown(fullText));
    }, allowCollection)
      .then(() => {
        const cleaned = stripMarkdown(fullText);
        setResultText(cleaned);
        if (title === "整体诊断结果") {
          setCompletedDiagnosis(true);
        }
        if (title.startsWith("逐栏打磨")) {
          setPolishCache((prev) => ({ ...prev, [polishSection]: cleaned }));
        }
        if (title === "模拟专家预审意见") {
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
    if (!isUnlocked && polishCount >= 3) {
      setShowPaymentModal(true);
      return;
    }
    setLoadingPolishSection(polishSection);
    runStreamingAction(`逐栏打磨：${polishSection}`, "/api/polish-section", { draft: content, section: polishSection, allowCollection });
    setCompletedPolish(true);
    if (!isUnlocked) {
      setPolishCount((c) => c + 1);
    }
  }

  function handleExpertReview() {
    const content = polishedDraft || draft;
    if (!content.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }
    if (!isUnlocked && reviewCount >= 1) {
      setShowPaymentModal(true);
      return;
    }
    runStreamingAction("模拟专家预审意见", "/api/expert-review", { draft: content, allowCollection });
    setCompletedExpert(true);
    if (!isUnlocked) {
      setReviewCount((c) => c + 1);
    }
  }

  function getStepNumber(step: Step): number {
    if (step === "free") return 4;
    return step;
  }

  return (
    <main className="bg-[#FAF9F6] px-4 py-6 text-[#141413] sm:px-6 lg:px-8">
      <section className={`mx-auto flex flex-col gap-6 ${currentStep === 2 ? "max-w-6xl" : "max-w-4xl"}`}>
        {/* 返回按钮 */}
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

        <header>
          <h1 className="text-2xl font-extrabold tracking-[-0.01em] text-[#141413]">
            申报书打磨
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            按顺序完成诊断、打磨、预审，逐步完善申报书。
          </p>
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
                  setDraftAndSync(draftExamples[0].value);
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
                    setDraftAndSync("");
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
              onChange={(e) => setDraftAndSync(e.target.value)}
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
              <div className="mb-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-[#E8E6E1] bg-white/80 px-3 py-2">
                  <p className="text-xs font-bold text-[#141413]">免费版</p>
                  <ul className="mt-1.5 space-y-1 text-xs leading-5 text-[#4B5563]">
                    <li>· 生成完整框架</li>
                    <li>· 打磨 3 个栏目</li>
                    <li>· 终审 1 次</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-[#E8E6E1] bg-white/80 px-3 py-2">
                  <p className="text-xs font-bold text-[#141413]">升级版</p>
                  <ul className="mt-1.5 space-y-1 text-xs leading-5 text-[#4B5563]">
                    <li>· 打磨全部 9 栏，不限次数</li>
                    <li>· 多次专家预审</li>
                    <li>· 终审后可返回继续打磨</li>
                  </ul>
                  {!isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="mt-2 w-full rounded-md bg-[#141413] px-3 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-[#2A2A28]"
                    >
                      ¥{PAID_PRICE} 升级
                    </button>
                  ) : (
                    <p className="mt-2 text-[11px] font-bold text-[#141413]">已解锁 ✓</p>
                  )}
                </div>
              </div>

              {!isUnlocked && (
                <p className="mb-3 text-[11px] text-[#9CA3AF]">
                  免费额度：已打磨 {polishCount}/3 次，已预审 {reviewCount}/1 次
                </p>
              )}
              {isUnlocked && (
                <p className="mb-3 text-[11px] font-bold text-[#141413]">
                  已升级付费版，无使用限制
                </p>
              )}

              <div className="mb-4">
                <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">选择栏目查看原文，点击"开始打磨"获取 AI 建议。复制修改内容后在原文编辑器中替换。编辑好后进入下一步：模拟预审。</p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-[#141413]">选择要打磨的栏目</label>
                <div className="flex flex-wrap gap-2">
                  {polishSections.map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => {
                        setPolishSection(section);
                        const cached = polishCache[section];
                        setResultText(cached || "");
                        if (cached) setResultTitle(`逐栏打磨：${section}`);
                        setError("");
                      }}
                      className={`focus-ring rounded-md px-3 py-2 text-sm font-bold transition ${
                        polishSection === section
                          ? "bg-[#141413] text-white"
                          : "border border-[#E8E6E1] bg-white text-[#141413] hover:bg-[#F3F2EF]"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>

              {/* 该栏目的原文 */}
              {extractSection(polishedDraft || draft, polishSection) && (
                <div className="mb-5 rounded-md bg-[#FAF9F6] p-4">
                  <p className="text-xs font-bold text-[#9CA3AF]">当前栏目原文</p>
                  <p className="mt-1 text-sm leading-7 whitespace-pre-wrap text-[#6B7280]">
                    {extractSection(polishedDraft || draft, polishSection)}
                  </p>
                </div>
              )}

              {!polishCache[polishSection] && !(isLoading && loadingPolishSection === polishSection) && (
                <button
                  type="button"
                  onClick={handlePolish}
                  className="focus-ring mb-5 h-11 w-full rounded-md bg-[#141413] text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  开始打磨
                </button>
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
                    const escaped = polishSection.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const pattern = new RegExp(`${escaped}[：:]`, "i");
                    const idx = ta.value.search(pattern);
                    if (idx !== -1) {
                      ta.focus({ preventScroll: true });
                      ta.setSelectionRange(idx, idx + polishSection.length + 1);
                    }
                  }}
                  className="cursor-pointer rounded-md bg-[#FAF9F6] p-4 text-sm leading-8 whitespace-pre-wrap text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  {resultText}
                </div>
              )}

              {/* 底部按钮 */}
              <div className="mt-auto pt-6">
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
                    <button
                      type="button"
                      onClick={handleExport}
                      className="rounded-md border border-[#E8E6E1] bg-white px-2 py-0.5 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
                    >
                      导出
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
                    <div className="flex justify-between">
                      <button type="button" onClick={() => { setCurrentStep(2); setError(""); }} className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]">
                        返回打磨
                      </button>
                      <button type="button" onClick={handleSaveAndExport} className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]">
                        导出
                      </button>
                    </div>
                    {resultText && resultTitle === "模拟专家预审意见" && (
                      <div className="mt-6">
                        <h3 className="mb-3 text-sm font-bold text-[#141413]">预审意见</h3>
                        <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-8 text-[#141413]">
                          {resultText.split("\n\n").map((block, i) => <p key={i} className="whitespace-pre-wrap">{block}</p>)}
                        </div>
                      </div>
                    )}
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

            {completedExpert && (
              <div className="mt-6 border-t border-[#E8E6E1] pt-5">
                <FeedbackWidget />
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

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          setShowPaymentModal(false);
        }}
      />
    </main>
  );
}
