"use client";

import { useState } from "react";
import { StepNavigation } from "@/components/StepNavigation";
import { postAiStream, stripMarkdown } from "@/lib/utils";

const GUIDANCE_STEPS = [
  { label: "学科年级", description: "你的教学领域" },
  { label: "教学情况", description: "补充背景" },
  { label: "研究偏好", description: "研究类型" },
  { label: "选题建议", description: "AI 推荐" },
];

const DISCIPLINES = [
  "语文", "数学", "英语", "科学", "道法",
  "体育", "音乐", "美术", "信息科技",
  "综合实践", "劳动", "心理健康",
  "班级管理", "德育", "家校共育", "学校管理",
];

const GRADE_SEGMENTS = ["幼儿园", "小学", "初中", "高中"];

const RESEARCH_TYPES: Array<{ value: string; label: string; description: string }> = [
  {
    value: "行动研究",
    label: "行动研究",
    description: "在真实教学环境中边实践边研究，适合一线教师解决日常教学问题。",
  },
  {
    value: "案例研究",
    label: "案例研究",
    description: "深入分析一个或几个典型案例，从中提炼规律和经验。",
  },
  {
    value: "实验研究",
    label: "实验研究",
    description: "设置实验组和对照组，比较不同教学方法的差异。适合有测评条件的课题。",
  },
  {
    value: "调查研究",
    label: "调查研究",
    description: "通过问卷、访谈等方式收集数据，了解现状并发现问题。",
  },
  {
    value: "经验总结",
    label: "经验总结",
    description: "系统梳理和提炼已有的教学实践经验，形成可推广的方法和模式。",
  },
];

const loadingSteps = ["正在分析教学背景", "正在生成选题方向", "正在评估可行性"];

type Props = {
  onBack: () => void;
  onUseTopic: (prefill: { stageSubject: string; idea: string; problem: string }) => void;
};

export function TopicGuidance({ onBack, onUseTopic }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [discipline, setDiscipline] = useState("");
  const [gradeSegment, setGradeSegment] = useState("");
  const [situation, setSituation] = useState("");
  const [researchType, setResearchType] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [streamingText, setStreamingText] = useState("");

  const canProceedStep0 = discipline && gradeSegment;

  function handleGenerateTopics() {
    if (!discipline || !gradeSegment) return;

    setIsLoading(true);
    setError("");
    setSuggestions([]);
    setStreamingText("");
    setCurrentStep(3);

    const interval = window.setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1600);

    let fullText = "";
    postAiStream(
      "/api/topic-guidance",
      { discipline, gradeSegment, situation, researchType },
      (chunk) => {
        if (!fullText) clearInterval(interval);
        fullText += chunk;
        setStreamingText(stripMarkdown(fullText));
      },
      true,
    )
      .then(() => {
        const topics = fullText
          .split(/\n(?=\d+[\.\、\)]\s)/)
          .map((t) => t.replace(/^\d+[\.\、\)]\s*/, "").trim())
          .filter((t) => t.length > 5);
        setSuggestions(topics.length >= 3 ? topics : [fullText.trim()]);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "生成失败，请稍后重试。");
      })
      .finally(() => {
        setIsLoading(false);
        clearInterval(interval);
      });
  }

  function handleUseTopic() {
    const topic = selectedTopic || (suggestions.length === 1 ? suggestions[0] : "");
    if (!topic) return;
    onUseTopic({
      stageSubject: `${discipline}${gradeSegment !== "幼儿园" ? gradeSegment + discipline : ""}`,
      idea: topic,
      problem: situation || "需进一步明确具体问题",
    });
  }

  return (
    <main className="bg-[#FAF9F6] px-4 py-6 text-[#141413] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Back button */}
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
            选题方向引导
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            帮你找到可以申报的课题方向。
          </p>
        </header>

        <StepNavigation
          steps={GUIDANCE_STEPS}
          currentStep={currentStep}
          onGoToStep={(step) => {
            if (step <= currentStep && !isLoading) setCurrentStep(step);
          }}
        />

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm leading-6 text-[#DC2626]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-md border border-[#FECACA] bg-white px-2 py-1 text-xs font-bold text-[#DC2626] transition hover:bg-[#FEF2F2]"
            >
              关闭
            </button>
          </div>
        )}

        {/* Step 0: 学科年级 */}
        {currentStep === 0 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <p className="text-sm font-bold text-[#6B7280]">选择你的学科</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DISCIPLINES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscipline(d === discipline ? "" : d)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-bold transition ${
                    discipline === d
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-[#E8E6E1] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#141413]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-bold text-[#6B7280]">选择年级段</p>
            <div className="mt-3 flex gap-2">
              {GRADE_SEGMENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradeSegment(g === gradeSegment ? "" : g)}
                  className={`rounded-md border px-4 py-2 text-sm font-bold transition ${
                    gradeSegment === g
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-[#E8E6E1] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#141413]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={!canProceedStep0}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28] disabled:opacity-30"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 1: 教学情况 */}
        {currentStep === 1 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#6B7280]">补充教学背景（选填）</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  描述你目前的教学情况和遇到的问题，越具体越好。这能帮AI更准确地推荐选题。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSituation(
                  gradeSegment === "幼儿园"
                    ? "我带大班，这学期发现部分孩子在集体活动中语言表达意愿不强，想尝试通过绘本阅读和角色扮演来促进幼儿语言发展，但不知道怎样设计系统的活动方案，也不确定哪些绘本最合适。"
                    : gradeSegment === "初中"
                    ? "我教初二物理，学生在密度和浮力概念上反复出错，靠刷题效果不好。我想尝试用实验探究的方式帮助学生建构概念，但不知道如何设计有效的探究任务链。"
                    : gradeSegment === "高中"
                    ? "我教高一政治，学生对抽象概念理解困难，课堂参与度不高。我尝试过引入社会热点议题组织讨论，学生反馈不错，但不知道怎么把这种课堂实践提升为规范的课题研究。"
                    : "我教五年级语文，这学期发现学生写作时结构比较混乱，段落之间缺少逻辑衔接。我想到过用思维导图辅助写作教学，也试过几次，但不知道具体怎么系统化操作，也不确定这个方法到底有没有效果。"
                )}
                className="ml-3 shrink-0 rounded-md border border-[#E8E6E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#9CA3AF] transition hover:border-[#D1D5DB] hover:text-[#6B7280]"
              >
                填入示例
              </button>
            </div>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="例如：我教五年级语文，这学期发现学生写作时结构比较混乱，想到过用思维导图辅助写作教学，但不知道具体怎么操作..."
              rows={4}
              maxLength={2000}
              className="mt-3 w-full rounded-md border border-[#E8E6E1] bg-white px-4 py-3 text-sm text-[#141413] placeholder:text-[#9CA3AF] focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />

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
                下一步
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 研究偏好 */}
        {currentStep === 2 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <p className="text-sm font-bold text-[#6B7280]">选择研究类型偏好</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              选择你倾向的研究方式。不确定也没关系，可以跳过。
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {RESEARCH_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setResearchType(rt.value === researchType ? "" : rt.value)}
                  className={`rounded-md border p-4 text-left transition ${
                    researchType === rt.value
                      ? "border-sky-400 bg-sky-50"
                      : "border-[#E8E6E1] bg-white hover:border-[#D1D5DB]"
                  }`}
                >
                  <p className={`text-sm font-bold ${researchType === rt.value ? "text-sky-700" : "text-[#141413]"}`}>
                    {rt.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6B7280]">{rt.description}</p>
                </button>
              ))}
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
                onClick={handleGenerateTopics}
                className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                下一步：生成选题建议
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 选题建议 */}
        {currentStep === 3 && (
          <div className="rounded-md border border-[#E8E6E1] bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#6B7280]">AI 选题建议</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {discipline} · {gradeSegment}
                  {researchType ? ` · ${researchType}` : ""}
                </p>
              </div>
              {suggestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleGenerateTopics}
                  disabled={isLoading}
                  className="rounded-md border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs font-bold text-[#6B7280] transition hover:border-[#D1D5DB] hover:text-[#141413] disabled:opacity-50"
                >
                  重新生成
                </button>
              )}
            </div>

            {isLoading && (
              <div className="rounded-md bg-[#FAF9F6] px-4 py-12 text-center">
                {streamingText ? (
                  <div className="mx-auto max-w-2xl text-left text-sm leading-7 whitespace-pre-wrap text-[#141413]">
                    {streamingText}
                  </div>
                ) : (
                  <p className="text-sm text-[#9CA3AF]">{loadingSteps[loadingStepIndex]}</p>
                )}
              </div>
            )}

            {!isLoading && suggestions.length > 0 && (
              <div className="space-y-3">
                {suggestions.map((topic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedTopic(topic === selectedTopic ? "" : topic)}
                    className={`w-full rounded-md border p-4 text-left transition ${
                      selectedTopic === topic
                        ? "border-sky-400 bg-sky-50"
                        : "border-[#E8E6E1] bg-white hover:border-[#D1D5DB]"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#9CA3AF]">选题 {i + 1}</span>
                    <p className={`mt-1 text-sm leading-6 ${selectedTopic === topic ? "text-sky-800" : "text-[#141413]"}`}>
                      {topic}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {!isLoading && suggestions.length === 0 && !error && (
              <div className="rounded-md bg-[#FAF9F6] px-4 py-12 text-center">
                <p className="text-sm text-[#6B7280]">点击下方按钮，让 AI 为你生成选题建议。</p>
                <button
                  type="button"
                  onClick={handleGenerateTopics}
                  className="mt-4 focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
                >
                  生成选题建议
                </button>
              </div>
            )}

            {!isLoading && suggestions.length > 0 && (
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="focus-ring h-11 rounded-md border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#141413] transition hover:bg-[#F3F2EF]"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handleUseTopic}
                  disabled={!selectedTopic}
                  className="focus-ring h-11 rounded-md bg-[#141413] px-6 text-sm font-extrabold text-white transition hover:bg-[#2A2A28] disabled:opacity-30"
                >
                  使用此选题
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
