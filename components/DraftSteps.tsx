"use client";

import { useState } from "react";
import { StepNavigation } from "@/components/StepNavigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";

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
      "研究方法：行动研究法、案例研究法、问卷调查法。"
    ].join("\n")
  }
];

const polishSections = [
  "选题依据",
  "研究目标",
  "研究内容",
  "研究方法",
  "预期成果",
  "研究条件",
  "创新点"
];

const loadingSteps = ["正在分析中", "正在整理思路", "正在生成结果"];

async function postAi(url: string, payload: unknown, allowCollection?: boolean) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-allow-collection": allowCollection ? "1" : "0" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `请求失败，状态码 ${res.status}`);
  }

  return data.text as string;
}

type Step = 0 | 1 | 2 | 3 | "free";

export function DraftSteps({ onBack }: { onBack: () => void }) {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [draft, setDraft] = useState("");
  const [polishSection, setPolishSection] = useState("选题依据");
  const [resultTitle, setResultTitle] = useState("");
  const [resultText, setResultText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [allowCollection, setAllowCollection] = useState(true);

  // Track which steps have been completed
  const [completedDiagnosis, setCompletedDiagnosis] = useState(false);
  const [completedPolish, setCompletedPolish] = useState(false);
  const [completedExpert, setCompletedExpert] = useState(false);

  function runAction(title: string, action: () => Promise<string>) {
    setResultTitle(title);
    setError("");
    setIsLoading(true);

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1600);

    action()
      .then((text) => {
        setResultText(text);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "处理失败，请稍后重试。");
      })
      .finally(() => {
        setIsLoading(false);
        clearInterval(interval);
      });
  }

  function handleDiagnosis() {
    if (!draft.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }
    runAction("整体诊断结果", () =>
      postAi("/api/review-draft", { draft, scope: "整体诊断" }, allowCollection)
    );
    setCompletedDiagnosis(true);
  }

  function handlePolish() {
    if (!draft.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }
    runAction(`逐栏打磨：${polishSection}`, () =>
      postAi("/api/polish-section", { draft, section: polishSection }, allowCollection)
    );
    setCompletedPolish(true);
  }

  function handleExpertReview() {
    if (!draft.trim()) {
      setError("请先粘贴申报书草稿。");
      return;
    }
    runAction("模拟专家预审意见", () =>
      postAi("/api/expert-review", { draft }, allowCollection)
    );
    setCompletedExpert(true);
  }

  function getStepNumber(step: Step): number {
    if (step === "free") return 4;
    return step;
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 py-6 text-[#141413] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
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
            按顺序完成诊断、打磨、预审，走完流程后可自由选择功能继续微调。
          </p>
        </header>

        <StepNavigation
          steps={DRAFT_STEPS}
          currentStep={getStepNumber(currentStep)}
          onGoToStep={(step) => {
            if (step <= 3) setCurrentStep(step as Step);
          }}
        />

        {error && (
          <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm leading-6 text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Step 0: 输入草稿 */}
        {currentStep === 0 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <p className="mb-1 text-sm font-bold text-[#6B7280]">操作提示</p>
            <p className="mb-5 text-sm leading-6 text-[#9CA3AF]">
              请将你的申报书草稿粘贴到下方。草稿越完整，诊断和打磨越有针对性。没有草稿？返回首页选择"从想法开始"。
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {draftExamples.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setDraft(ex.value);
                    setResultText("");
                    setError("");
                  }}
                  className="focus-ring rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2 text-sm font-bold text-[#141413] hover:bg-[#F3F2EF]"
                >
                  {ex.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("确定要清空当前草稿吗？")) {
                    setDraft("");
                    setResultText("");
                    setError("");
                    setCompletedDiagnosis(false);
                    setCompletedPolish(false);
                    setCompletedExpert(false);
                  }
                }}
                className="focus-ring rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-bold text-[#6B7280] hover:bg-[#F3F2EF]"
              >
                清空草稿
              </button>
            </div>

            <textarea
              placeholder="在此粘贴你的申报书草稿..."
              rows={14}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
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
              <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-8 text-center text-sm text-[#6B7280]">
                {loadingSteps[loadingStepIndex]}，请稍候...
              </div>
            ) : (
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
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  开始诊断
                </button>
              </div>
            )}

            {resultText && resultTitle === "整体诊断结果" && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold text-[#141413]">诊断结果</h3>
                <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-7 text-[#141413]">
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

        {/* Step 2: 逐栏打磨 */}
        {currentStep === 2 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <p className="mb-1 text-sm font-bold text-[#6B7280]">操作提示</p>
            <p className="mb-5 text-sm leading-6 text-[#9CA3AF]">
              选择一个栏目，AI 会针对该栏目进行深度打磨，优化表述、补充细节。
            </p>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-bold text-[#141413]">选择要打磨的栏目</label>
              <div className="flex flex-wrap gap-2">
                {polishSections.map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => setPolishSection(section)}
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

            {isLoading ? (
              <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-8 text-center text-sm text-[#6B7280]">
                {loadingSteps[loadingStepIndex]}，请稍候...
              </div>
            ) : (
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handlePolish}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  开始打磨
                </button>
              </div>
            )}

            {resultText && resultTitle.startsWith("逐栏打磨") && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold text-[#141413]">打磨结果</h3>
                <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-7 text-[#141413]">
                  {resultText.split("\n\n").map((block, i) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {block}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {completedPolish && (
              <div className="mt-6 flex justify-end">
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
            )}
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
              <p className="text-xs font-bold text-[#9CA3AF]">当前草稿（{draft.length} 字）</p>
              <p className="mt-1 text-sm leading-6 text-[#6B7280] line-clamp-3">
                {draft.slice(0, 200)}{draft.length > 200 ? "..." : ""}
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-8 text-center text-sm text-[#6B7280]">
                {loadingSteps[loadingStepIndex]}，请稍候...
              </div>
            ) : (
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handleExpertReview}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  开始预审
                </button>
              </div>
            )}

            {resultText && resultTitle === "模拟专家预审意见" && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-bold text-[#141413]">预审意见</h3>
                <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-7 text-[#141413]">
                  {resultText.split("\n\n").map((block, i) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {block}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {completedExpert && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep("free");
                    setError("");
                  }}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  完成流程，进入自由模式
                </button>
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
                <div className="mt-3 max-h-64 overflow-y-auto rounded bg-white p-4 text-sm leading-7 text-[#141413]">
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

      {(completedDiagnosis || completedPolish || completedExpert) && (
        <section className="mx-auto mt-8 max-w-3xl">
          <FeedbackWidget />
        </section>
      )}
    </main>
  );
}
