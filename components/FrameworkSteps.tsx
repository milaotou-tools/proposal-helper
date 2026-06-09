"use client";

import { useState, useRef, useEffect } from "react";
import { StepNavigation } from "@/components/StepNavigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { usePersistedState } from "@/lib/use-persisted-state";
import { postAiStream, stripMarkdown, copyToClipboard } from "@/lib/utils";
import type { SaveSnapshot } from "@/lib/save-store";

export type FrameworkForm = {
  stage: string;
  stageSubject: string;
  idea: string;
  problem: string;
  researchObjects: string;
  practiceBase: string;
  expectedOutputs: string;
};

const emptyForm: FrameworkForm = {
  stage: "",
  stageSubject: "",
  idea: "",
  problem: "",
  researchObjects: "",
  practiceBase: "",
  expectedOutputs: ""
};

const STAGES = ["幼儿园", "小学", "初中", "高中"];

const RESEARCH_TYPES: Array<{ value: string; label: string; description: string }> = [
  { value: "行动研究", label: "行动研究", description: "在真实教学环境中边实践边研究，适合一线教师解决日常教学问题。" },
  { value: "案例研究", label: "案例研究", description: "深入分析一个或几个典型案例，从中提炼规律和经验。" },
  { value: "实验研究", label: "实验研究", description: "设置实验组和对照组，比较不同教学方法的差异。适合有测评条件的课题。" },
  { value: "调查研究", label: "调查研究", description: "通过问卷、访谈等方式收集数据，了解现状并发现问题。" },
  { value: "经验总结", label: "经验总结", description: "系统梳理和提炼已有的教学实践经验，形成可推广的方法和模式。" },
];

const guidanceExample: Record<string, string> = {
  "幼儿园": "我带大班，这学期发现部分孩子在集体活动中语言表达意愿不强，想尝试通过绘本阅读和角色扮演来促进幼儿语言发展，但不知道怎样设计系统的活动方案，也不确定哪些绘本最合适。",
  "小学": "我教五年级语文，这学期发现学生写作时结构比较混乱，段落之间缺少逻辑衔接。我想到过用思维导图辅助写作教学，也试过几次，但不知道具体怎么系统化操作，也不确定这个方法到底有没有效果。",
  "初中": "我教初二物理，学生在密度和浮力概念上反复出错，靠刷题效果不好。我想尝试用实验探究的方式帮助学生建构概念，但不知道如何设计有效的探究任务链。",
  "高中": "我教高一政治，学生对抽象概念理解困难，课堂参与度不高。我尝试过引入社会热点议题组织讨论，学生反馈不错，但不知道怎么把这种课堂实践提升为规范的课题研究。",
};

type StageExample = {
  stageSubject: string;
  idea: string;
  problem: string;
  researchObjects: string;
  practiceBase: string;
  expectedOutputs: string;
};

const stageExamples: Record<string, StageExample> = {
  "幼儿园": {
    stageSubject: "幼儿园语言",
    idea: "绘本阅读促进幼儿语言发展的实践研究",
    problem: "部分幼儿在集体活动中语言表达意愿不强，词汇量发展不均衡",
    researchObjects: "自己所带班级幼儿",
    practiceBase: "已在班级开展绘本阅读活动，积累了一些观察记录",
    expectedOutputs: "课题报告、绘本阅读活动案例、幼儿语言发展观察记录、家园共读资源"
  },
  "小学": {
    stageSubject: "小学数学",
    idea: "AI 辅助学生知识结构化学习的研究",
    problem: "学生在复习时知识点零散，难以形成结构化理解，传统复习方式效率较低",
    researchObjects: "自己所教班级学生",
    practiceBase: "已在教学中尝试过相关做法，积累了一些实践经验",
    expectedOutputs: "课题报告、教学案例、学生作品、校本资源包"
  },
  "初中": {
    stageSubject: "初中物理",
    idea: "基于实验探究的物理概念建构研究",
    problem: "学生在物理概念学习中依赖记忆而非理解，实验探究环节流于形式",
    researchObjects: "自己所教班级学生",
    practiceBase: "已在课堂中尝试增加实验探究环节，有初步观察记录",
    expectedOutputs: "课题报告、实验教学案例、学生探究报告样例、教学资源包"
  },
  "高中": {
    stageSubject: "高中思想政治",
    idea: "议题式教学在思想政治课中的应用研究",
    problem: "学生对抽象政治概念理解困难，课堂参与度不高，知识与现实脱节",
    researchObjects: "自己所教班级学生",
    practiceBase: "已尝试引入社会热点议题组织课堂讨论，学生反馈积极",
    expectedOutputs: "课题报告、议题教学设计集、课堂实录、学生思辨作品"
  }
};

function getExample(stage: string): StageExample {
  return stageExamples[stage] || stageExamples["小学"];
}

const loadingSteps = ["正在分析你的课题想法", "正在梳理研究目标与内容", "正在整理研究方法", "正在规划预期成果"];

const FRAMEWORK_STEPS = [
  { label: "学段学科", description: "你的教学背景" },
  { label: "课题想法", description: "想法与问题" },
  { label: "研究背景", description: "对象与基础" },
  { label: "确认生成", description: "预览并生成" },
  { label: "查看结果", description: "框架输出" }
];

type FrameworkStepsProps = {
  onBack: () => void;
  restoredSnapshot?: SaveSnapshot | null;
  guidancePrefill?: { stageSubject: string; idea: string; problem: string } | null;
};

export function FrameworkSteps({ onBack, restoredSnapshot, guidancePrefill }: FrameworkStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm, resetForm] = usePersistedState<FrameworkForm>("ph-framework-form", emptyForm);
  const [resultText, setResultText] = usePersistedState("ph-framework-result", "");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [allowCollection, setAllowCollection] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saveCode, setSaveCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const restoredRef = useRef(false);
  const retryRef = useRef<(() => void) | null>(null);

  // Inline topic guidance state
  const [ideaMode, setIdeaMode] = useState<"self" | "ai">("self");
  const [guidanceSituation, setGuidanceSituation] = useState("");
  const [guidanceResearchType, setGuidanceResearchType] = useState("");
  const [guidanceSuggestions, setGuidanceSuggestions] = useState<string[]>([]);
  const [guidanceSelected, setGuidanceSelected] = useState("");
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceStream, setGuidanceStream] = useState("");
  const [guidanceError, setGuidanceError] = useState("");

  const OUTPUT_PRESETS = [
    "课题研究报告",
    "教学设计集",
    "教学案例集",
    "课堂实录",
    "学生作品集",
    "校本资源包",
    "调查问卷与分析报告",
    "校本课程纲要",
  ];

  function handleGuidanceGenerate() {
    if (!form.stage) return;

    setGuidanceLoading(true);
    setGuidanceError("");
    setGuidanceSuggestions([]);
    setGuidanceStream("");

    let fullText = "";
    postAiStream(
      "/api/topic-guidance",
      {
        discipline: form.stageSubject || "",
        gradeSegment: form.stage,
        situation: guidanceSituation,
        researchType: guidanceResearchType,
      },
      (chunk) => {
        fullText += chunk;
        setGuidanceStream(stripMarkdown(fullText));
      },
      true,
    )
      .then(() => {
        const topics = fullText
          .split(/\n(?=\d+[\.\、\)]\s)/)
          .map((t) => t.replace(/^\d+[\.\、\)]\s*/, "").trim())
          .filter((t) => t.length > 5);
        setGuidanceSuggestions(topics.length >= 2 ? topics : [fullText.trim()]);
      })
      .catch((caught) => {
        setGuidanceError(caught instanceof Error ? caught.message : "生成失败，请稍后重试。");
      })
      .finally(() => {
        setGuidanceLoading(false);
      });
  }

  function handleGuidanceUseTopic(topic: string) {
    updateField("idea", topic);
    updateField("problem", guidanceSituation || "需进一步明确具体问题");
    if (guidanceSituation) {
      updateField("practiceBase", guidanceSituation);
    }
    setIdeaMode("self");
  }

  // Restore from snapshot or prefill on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (restoredSnapshot && restoredSnapshot.type === "framework") {
      const s = restoredSnapshot;
      if (s.frameworkForm) {
        setForm(s.frameworkForm);
      }
      if (s.frameworkResult) {
        setResultText(s.frameworkResult);
      }
      if (typeof s.frameworkCurrentStep === "number") {
        setCurrentStep(s.frameworkCurrentStep);
      }
      return;
    }

    if (guidancePrefill) {
      setForm((prev) => ({
        ...prev,
        stageSubject: guidancePrefill.stageSubject || prev.stageSubject,
        idea: guidancePrefill.idea || prev.idea,
        problem: guidancePrefill.problem || prev.problem,
      }));
      setCurrentStep(1);
    }
  }, [restoredSnapshot, guidancePrefill, setForm, setResultText]);

  // Pre-fill expected outputs when entering Step 2
  useEffect(() => {
    if (currentStep === 2 && !form.expectedOutputs.trim()) {
      const eg = getExample(form.stage);
      updateField("expectedOutputs", eg.expectedOutputs);
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/save-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "framework",
          ...form,
          frameworkResult: resultText,
          frameworkCurrentStep: currentStep,
        }),
      });
      const data = await res.json() as { ok?: boolean; code?: string; error?: string };
      if (data.ok && data.code) {
        setSaveCode(data.code);
      } else {
        setSaveError(data.error || "保存失败，请稍后重试。");
      }
    } catch {
      setSaveError("网络错误，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof FrameworkForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleGenerate() {
    if (!form.idea.trim() || !form.problem.trim()) {
      setError('请先填写"初步课题想法"和"当前遇到的教育教学问题"。');
      return;
    }

    retryRef.current = () => handleGenerate();
    setError("");
    setResultText("");
    setIsLoading(true);

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1600);

    let fullText = "";
    postAiStream("/api/generate-framework", form, (chunk) => {
      if (!fullText) clearInterval(interval);
      fullText += chunk;
      setResultText(stripMarkdown(fullText));
    }, allowCollection)
      .then(() => {
        setResultText(stripMarkdown(fullText));
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
    <main className="bg-[#FAF9F6] px-4 py-6 text-[#141413] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* 返回按钮 + 保存 */}
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
            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs font-bold text-[#6B7280] transition hover:border-[#D1D5DB] hover:text-[#141413] disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 3V10M7 10L4 7M7 10L10 7" />
            </svg>
            {saving ? "保存中..." : "保存进度"}
          </button>
        </div>

        <header>
          <h1 className="text-2xl font-extrabold tracking-[-0.01em] text-[#141413]">
            从想法生成申报书框架
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            一步步填写，帮你把零散想法整理成结构化申报书。
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
          <div className="flex items-start justify-between gap-3 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm leading-6 text-[#DC2626]">
            <span>{error}</span>
            <div className="flex gap-2">
              {retryRef.current && (
                <button
                  type="button"
                  onClick={() => retryRef.current?.()}
                  className="shrink-0 rounded-md border border-[#FECACA] bg-white px-3 py-1 text-xs font-bold text-[#DC2626] transition hover:bg-[#FEF2F2]"
                >
                  重试
                </button>
              )}
              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 rounded-md border border-[#FECACA] bg-white px-2 py-1 text-xs font-bold text-[#DC2626] transition hover:bg-[#FEF2F2]"
              >
                关闭
              </button>
            </div>
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

        {/* Save code modal */}
        {saveCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35" onClick={() => setSaveCode(null)}>
            <div
              className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#141413]">进度已保存</h3>
              <p className="mt-2 text-sm text-[#6B7280]">你的保存码：</p>
              <p className="mt-1 text-center text-3xl font-extrabold tracking-[0.15em] text-[#141413] select-all">{saveCode}</p>
              <p className="mt-3 text-xs text-[#9CA3AF]">请复制并保存此码，30天内可恢复进度。</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await copyToClipboard(saveCode);
                  }}
                  className="flex-1 rounded-md border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  复制保存码
                </button>
                <button
                  type="button"
                  onClick={() => setSaveCode(null)}
                  className="flex-1 rounded-md bg-[#141413] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2A2A28]"
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 0: 学段学科 */}
        {currentStep === 0 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#6B7280]">操作提示</p>
                <p className="text-sm leading-6 text-[#9CA3AF]">先选择你的学段，再填写教学领域或课题方向。学科教改、学校规划、班级管理、家校共育等都可以。</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const eg = getExample(form.stage || "小学");
                  updateField("stage", form.stage || "小学");
                  updateField("stageSubject", eg.stageSubject);
                }}
                className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
              >
                填入示例
              </button>
            </div>

            {/* 学段选择 */}
            <div className="mb-5 flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => {
                    updateField("stage", stage);
                    updateField("stageSubject", "");
                  }}
                  className={`focus-ring rounded-md px-3 py-2 text-sm font-bold transition ${
                    form.stage === stage
                      ? "bg-[#141413] text-white"
                      : "border border-[#E8E6E1] bg-[#FAF9F6] text-[#141413] hover:bg-[#F3F2EF]"
                  }`}
                >
                  {stage}
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
              <span className="text-sm font-bold text-[#141413]">教学领域 / 课题方向</span>
              <input
                placeholder="例如：初中物理、高中思想政治、幼儿园语言、小学家校共育、学校德育规划"
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
            {/* Mode tabs */}
            <div className="mb-5 flex gap-1 rounded-md bg-[#F3F2EF] p-1">
              <button
                type="button"
                onClick={() => setIdeaMode("ai")}
                className={`flex-1 rounded px-3 py-2 text-sm font-bold transition ${
                  ideaMode === "ai"
                    ? "bg-white text-[#141413] shadow-sm"
                    : "text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                没有头绪，AI帮我找
              </button>
              <button
                type="button"
                onClick={() => setIdeaMode("self")}
                className={`flex-1 rounded px-3 py-2 text-sm font-bold transition ${
                  ideaMode === "self"
                    ? "bg-white text-[#141413] shadow-sm"
                    : "text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                我已有想法
              </button>
            </div>

            {/* Mode A: self-fill */}
            {ideaMode === "self" && (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#6B7280]">描述你的课题想法</p>
                    <p className="text-sm leading-6 text-[#9CA3AF]">描述你发现的真实问题和你打算怎么研究。越具体，生成的框架越贴合你的实际情况。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const eg = getExample(form.stage);
                      updateField("idea", eg.idea);
                      updateField("problem", eg.problem);
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
                      placeholder="例如：我想探索 AI 如何帮助学生进行知识结构化学习。"
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
              </>
            )}

            {/* Mode B: AI guidance */}
            {ideaMode === "ai" && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#6B7280]">让 AI 帮你找选题方向</p>
                    <p className="text-sm leading-6 text-[#9CA3AF]">简单描述你的教学情况，AI 会给出课题选题建议。选一个即可自动填入。</p>
                  </div>
                </div>

                {/* Situation */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#141413]">教学情况（选填）</p>
                    <button
                      type="button"
                      onClick={() => setGuidanceSituation(guidanceExample[form.stage] || guidanceExample["小学"])}
                      className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
                    >
                      填入示例
                    </button>
                  </div>
                  <textarea
                    value={guidanceSituation}
                    onChange={(e) => setGuidanceSituation(e.target.value)}
                    placeholder={guidanceExample[form.stage] || guidanceExample["小学"]}
                    rows={3}
                    maxLength={2000}
                    className="mt-2 w-full resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-6 text-[#141413] placeholder:text-[#9CA3AF] focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>

                {/* Research type */}
                <div className="mt-4">
                  <p className="text-sm font-bold text-[#141413]">研究类型偏好（选填）</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {RESEARCH_TYPES.map((rt) => (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() => setGuidanceResearchType(rt.value === guidanceResearchType ? "" : rt.value)}
                        className={`rounded-md border p-3 text-left transition ${
                          guidanceResearchType === rt.value
                            ? "border-sky-400 bg-sky-50"
                            : "border-[#E8E6E1] bg-white hover:border-[#D1D5DB]"
                        }`}
                      >
                        <p className={`text-xs font-bold ${guidanceResearchType === rt.value ? "text-sky-700" : "text-[#141413]"}`}>
                          {rt.label}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-4 text-[#6B7280]">{rt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results */}
                <div className="mt-4">
                  {guidanceLoading && (
                    <div className="rounded-md bg-[#FAF9F6] px-4 py-8 text-center">
                      {guidanceStream ? (
                        <div className="mx-auto max-w-2xl text-left text-sm leading-7 whitespace-pre-wrap text-[#141413]">
                          {guidanceStream}
                        </div>
                      ) : (
                        <p className="text-sm text-[#9CA3AF]">正在分析你的教学背景，生成选题方向...</p>
                      )}
                    </div>
                  )}

                  {guidanceError && (
                    <div className="flex items-start justify-between gap-3 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
                      <span>{guidanceError}</span>
                      <button
                        type="button"
                        onClick={() => setGuidanceError("")}
                        className="shrink-0 rounded-md border border-[#FECACA] bg-white px-2 py-1 text-xs font-bold text-[#DC2626]"
                      >
                        关闭
                      </button>
                    </div>
                  )}

                  {!guidanceLoading && guidanceSuggestions.length > 0 && (
                    <div>
                      <div className="space-y-2">
                        {guidanceSuggestions.map((topic, i) => {
                          const lines = topic.split("\n");
                          const title = lines[0]?.trim() || topic;
                          const desc = lines.slice(1).join("\n").trim();
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setGuidanceSelected(topic === guidanceSelected ? "" : topic)}
                              className={`w-full rounded-md border p-3 text-left transition ${
                                guidanceSelected === topic
                                  ? "border-sky-400 bg-sky-50"
                                  : "border-[#E8E6E1] bg-white hover:border-[#D1D5DB]"
                              }`}
                            >
                              <span className="text-[11px] font-bold text-[#9CA3AF]">选题 {i + 1}</span>
                              <p className={`mt-1 text-sm leading-6 font-bold ${guidanceSelected === topic ? "text-sky-800" : "text-[#141413]"}`}>
                                {title}
                              </p>
                              {desc && (
                                <p className="mt-0.5 text-xs leading-5 text-[#6B7280]">{desc}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGuidanceSuggestions([]);
                            setGuidanceSelected("");
                            setGuidanceStream("");
                          }}
                          className="rounded-md border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
                        >
                          重新生成
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (guidanceSelected) handleGuidanceUseTopic(guidanceSelected);
                            else if (guidanceSuggestions.length === 1) handleGuidanceUseTopic(guidanceSuggestions[0]);
                          }}
                          disabled={!guidanceSelected && guidanceSuggestions.length !== 1}
                          className="flex-1 rounded-md bg-[#141413] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2A2A28] disabled:opacity-30"
                        >
                          使用此选题
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
              >
                上一步
              </button>
              {ideaMode === "self" && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  下一步：研究背景
                </button>
              )}
              {ideaMode === "ai" && guidanceSuggestions.length === 0 && !guidanceLoading && (
                <button
                  type="button"
                  onClick={handleGuidanceGenerate}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  生成选题建议
                </button>
              )}
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
                  const eg = getExample(form.stage);
                  updateField("researchObjects", eg.researchObjects);
                  updateField("practiceBase", eg.practiceBase);
                  updateField("expectedOutputs", eg.expectedOutputs);
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
                  placeholder="例如：自己所教班级学生、所带年级、全校班主任团队"
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

              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#141413]">希望形成的成果</span>
                <div className="flex flex-wrap gap-1.5">
                  {OUTPUT_PRESETS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const current = form.expectedOutputs.trim();
                        updateField("expectedOutputs", current ? `${current}、${item}` : item);
                      }}
                      className="rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-xs text-[#6B7280] transition hover:border-[#D1D5DB] hover:text-[#141413]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="例如：课题报告、教学案例、作业设计样例、课堂实录、学生作品集。"
                  rows={3}
                  value={form.expectedOutputs}
                  onChange={(e) => updateField("expectedOutputs", e.target.value)}
                  className="focus-ring resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-6 text-[#141413] placeholder:text-[#9CA3AF]"
                />
              </div>
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
              <div>
                {resultText ? (
                  <div className="space-y-3 rounded-md bg-[#FAF9F6] p-5 text-sm leading-8 text-[#141413]">
                    {resultText.split("\n\n").map((block, i) => (
                      <p key={i} className="whitespace-pre-wrap">{block}</p>
                    ))}
                    <p className="animate-pulse text-[#9CA3AF]">▊ 生成中...</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-8 text-center text-sm text-[#6B7280]">
                    {loadingSteps[loadingStepIndex]}，请稍候...
                  </div>
                )}
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
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-[#141413]">申报书框架</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                结果仅用于辅助结构化和修改，需结合真实教学材料继续完善。
              </p>
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
                onClick={async () => {
                  const ok = await copyToClipboard(resultText);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }
                }}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                {copied ? "已复制 ✓" : "复制结果"}
              </button>
            </div>

            <div className="mt-6 border-t border-[#E8E6E1] pt-5">
              <FeedbackWidget />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
