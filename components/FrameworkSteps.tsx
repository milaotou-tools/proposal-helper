"use client";

import { useState } from "react";
import { StepNavigation } from "@/components/StepNavigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";

type FrameworkForm = {
  stageSubject: string;
  idea: string;
  problem: string;
  researchObjects: string;
  practiceBase: string;
  expectedOutputs: string;
};

const emptyForm: FrameworkForm = {
  stageSubject: "",
  idea: "",
  problem: "",
  researchObjects: "",
  practiceBase: "",
  expectedOutputs: ""
};

const subjectTags = ["小学数学", "小学语文", "小学英语", "小学科学", "小学音乐", "小学美术", "小学体育"];

const loadingSteps = ["正在分析你的课题想法", "正在梳理研究目标与内容", "正在整理研究方法", "正在规划预期成果"];

const FRAMEWORK_STEPS = [
  { label: "学段学科", description: "你的教学背景" },
  { label: "课题想法", description: "想法与问题" },
  { label: "研究背景", description: "对象与基础" },
  { label: "确认生成", description: "预览并生成" },
  { label: "查看结果", description: "框架输出" }
];

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

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
}

export function FrameworkSteps({ onBack }: { onBack: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FrameworkForm>(emptyForm);
  const [resultText, setResultText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [allowCollection, setAllowCollection] = useState(true);

  function updateField(field: keyof FrameworkForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleGenerate() {
    if (!form.idea.trim() || !form.problem.trim()) {
      setError('请先填写"初步课题想法"和"当前遇到的教育教学问题"。');
      return;
    }

    setError("");
    setIsLoading(true);

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1600);

    postAi("/api/generate-framework", form, allowCollection)
      .then((text) => {
        setResultText(stripMarkdown(text));
        setCurrentStep(4);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "生成失败，请稍后重试。");
      })
      .finally(() => {
        setIsLoading(false);
        clearInterval(interval);
      });
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
            从想法生成申报书框架
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            一步步填写，AI 帮你把零散想法整理成结构化申报书。
          </p>
        </header>

        <StepNavigation
          steps={FRAMEWORK_STEPS}
          currentStep={currentStep}
          onGoToStep={(step) => {
            if (step <= currentStep) setCurrentStep(step);
          }}
        />

        {error && (
          <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm leading-6 text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Step 0: 学段学科 */}
        {currentStep === 0 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">请先选择你任教的学段和学科。如果不确定，填一个大概的范围就行，后续可以修改。</p>
              </div>
              <button
                type="button"
                onClick={() => updateField("stageSubject", "小学数学")}
                className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
              >
                填入示例
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {subjectTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => updateField("stageSubject", tag)}
                  className="focus-ring rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2 text-sm font-bold text-[#141413] hover:bg-[#F3F2EF]"
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setResultText("");
                  setError("");
                }}
                className="focus-ring rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-bold text-[#6B7280] hover:bg-[#F3F2EF]"
              >
                清空重填
              </button>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-[#141413]">学段学科</span>
              <input
                placeholder="例如：小学数学、小学语文、班级管理、德育、家校共育"
                autoComplete="off"
                value={form.stageSubject}
                onChange={(e) => updateField("stageSubject", e.target.value)}
                className="focus-ring h-11 rounded-md border border-[#E8E6E1] bg-white px-3 text-sm text-[#141413] placeholder:text-[#9CA3AF]"
              />
            </label>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                下一步：课题想法
              </button>
            </div>
          </div>
        )}

        {/* Step 1: 课题想法 + 痛点问题 */}
        {currentStep === 1 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">请描述你发现的真实教学问题和初步研究想法。越具体，生成的框架越贴合你的实际情况。</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateField("idea", "AI 辅助学生画数学概念图的研究");
                  updateField("problem", "学生复习时知识点零散，难以形成结构化理解，传统复习方式效率较低");
                }}
                className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
              >
                填入示例
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#141413]">
                  初步课题想法
                  <span className="ml-2 rounded-sm bg-[#FEF3E2] px-1.5 py-0.5 text-xs text-[#141413]">必填</span>
                </span>
                <textarea
                  placeholder="例如：我想研究 AI 怎么帮助学生画数学概念图。"
                  rows={3}
                  value={form.idea}
                  onChange={(e) => updateField("idea", e.target.value)}
                  className="focus-ring resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-6 text-[#141413] placeholder:text-[#9CA3AF]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#141413]">
                  当前遇到的教育教学问题
                  <span className="ml-2 rounded-sm bg-[#FEF3E2] px-1.5 py-0.5 text-xs text-[#141413]">必填</span>
                </span>
                <textarea
                  placeholder="例如：学生复习时知识点零散，不能形成结构化理解。"
                  rows={3}
                  value={form.problem}
                  onChange={(e) => updateField("problem", e.target.value)}
                  className="focus-ring resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-6 text-[#141413] placeholder:text-[#9CA3AF]"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                下一步：研究背景
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 研究背景 */}
        {currentStep === 2 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">补充研究对象、已有实践基础和预期成果。这些信息能让申报书更完整。选填项也可以留空。</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateField("researchObjects", "六年级学生");
                  updateField("practiceBase", "已尝试过概念图作业和单元复习题型整理，积累了部分学生作品");
                  updateField("expectedOutputs", "课题报告、概念图作业样例、课堂案例、学生作品集");
                }}
                className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
              >
                填入示例
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#141413]">研究对象</span>
                <input
                  placeholder="例如：六年级学生、低段学生、新手班主任"
                  autoComplete="off"
                  value={form.researchObjects}
                  onChange={(e) => updateField("researchObjects", e.target.value)}
                  className="focus-ring h-11 rounded-md border border-[#E8E6E1] bg-white px-3 text-sm text-[#141413] placeholder:text-[#9CA3AF]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#141413]">已有做法或实践基础</span>
                <textarea
                  placeholder="例如：已经尝试过概念图作业、AI 辅助生成练习、错题分类等。"
                  rows={3}
                  value={form.practiceBase}
                  onChange={(e) => updateField("practiceBase", e.target.value)}
                  className="focus-ring resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-6 text-[#141413] placeholder:text-[#9CA3AF]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#141413]">希望形成的成果</span>
                <textarea
                  placeholder="例如：课题报告、教学案例、作业设计样例、课堂实录、学生作品集。"
                  rows={3}
                  value={form.expectedOutputs}
                  onChange={(e) => updateField("expectedOutputs", e.target.value)}
                  className="focus-ring resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-6 text-[#141413] placeholder:text-[#9CA3AF]"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                下一步：确认生成
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 确认生成 */}
        {currentStep === 3 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <p className="mb-1 text-sm font-bold text-[#6B7280]">操作提示</p>
            <p className="mb-5 text-sm leading-6 text-[#9CA3AF]">
              请确认以下信息。如果需要修改，点击"上一步"返回修改。确认无误后点击"生成申报书框架"。
            </p>

            {/* Summary */}
            <div className="mb-6 space-y-4 rounded-md bg-[#FAF9F6] p-5">
              {[
                { label: "学段学科", value: form.stageSubject },
                { label: "课题想法", value: form.idea },
                { label: "教育问题", value: form.problem },
                { label: "研究对象", value: form.researchObjects },
                { label: "实践基础", value: form.practiceBase },
                { label: "预期成果", value: form.expectedOutputs }
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] font-bold text-[#9CA3AF]">{label}</p>
                  <p className={`mt-0.5 text-sm leading-6 ${value ? "text-[#141413]" : "text-[#9CA3AF] italic"}`}>
                    {value || "（未填写）"}
                  </p>
                </div>
              ))}
            </div>

            <label className="mb-5 flex cursor-pointer items-center gap-2 text-xs text-[#6B7280]">
              <input
                type="checkbox"
                checked={allowCollection}
                onChange={(e) => setAllowCollection(e.target.checked)}
                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#141413]"
              />
              允许匿名收集输入内容用于优化工具
            </label>

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
                  onClick={handleGenerate}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]"
                >
                  生成申报书框架
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: 查看结果 */}
        {currentStep === 4 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#141413]">申报书框架</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  结果仅用于辅助结构化和修改，需结合真实教学材料继续完善。
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resultText).catch(() => undefined);
                }}
                className="focus-ring h-10 rounded-md border border-[#D1D5DB] bg-white px-4 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                复制结果
              </button>
            </div>

            {resultText ? (
              <div className="space-y-4 rounded-md bg-[#FAF9F6] p-5 text-sm leading-8 text-[#141413]">
                {resultText.split("\n\n").map((block, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {block}
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-md bg-[#FAF9F6] px-4 py-12 text-center text-sm text-[#6B7280]">
                还没有生成结果。请返回上一步填写并生成。
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(0);
                  setResultText("");
                  setError("");
                }}
                className="focus-ring h-11 rounded-md bg-[#141413] px-5 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                重新开始
              </button>
            </div>
          </div>
        )}
      </section>

      {currentStep === 4 && (
        <section className="mx-auto mt-8 max-w-3xl">
          <FeedbackWidget />
        </section>
      )}
    </main>
  );
}
