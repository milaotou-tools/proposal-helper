"use client";

import { useState } from "react";

type Props = {
  onSelectPath: (path: "framework" | "draft") => void;
};

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-[#D1D5DB]">
    <path d="M6 3L11 8L6 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-[#D1D5DB]">
    <path d="M3 6L8 11L13 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function LandingPage({ onSelectPath }: Props) {
  const [showFlow, setShowFlow] = useState(true);

  if (showFlow) {
    return (
      <main className="mx-auto max-w-xl px-6 pt-20 pb-8">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-[34px] font-extrabold tracking-[-0.02em] text-[#141413]">
            课题申报小助手
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[#6B7280]">
            AI 帮你写框架、打磨文字，你只负责最后的润色
          </p>
        </div>

        {/* AI 区域 */}
        <div className="mt-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-1 rounded-full bg-[#0070F3]" />
            <span className="text-xs font-extrabold tracking-[0.12em] text-[#0070F3] uppercase">
              AI 帮你
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            {/* Step 1 */}
            <div className="flex-1 rounded-xl border border-[#0070F3]/20 bg-[#F5F9FF] p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0070F3] text-[11px] font-extrabold text-white">
                1
              </span>
              <p className="mt-2.5 text-[14px] font-extrabold text-[#141413]">发现问题</p>
              <p className="mt-1 text-[12px] leading-[18px] text-[#6B7280]">
                观察到的真实教学问题
              </p>
            </div>

            <div className="flex items-center">
              <Arrow />
            </div>

            {/* Step 2 */}
            <div className="flex-1 rounded-xl border border-[#0070F3]/20 bg-[#F5F9FF] p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0070F3] text-[11px] font-extrabold text-white">
                2
              </span>
              <p className="mt-2.5 text-[14px] font-extrabold text-[#141413]">生成框架</p>
              <p className="mt-1 text-[12px] leading-[18px] text-[#6B7280]">
                AI 整理结构化申报书
              </p>
            </div>

            <div className="flex items-center">
              <Arrow />
            </div>

            {/* Step 3 */}
            <div className="flex-1 rounded-xl border border-[#0070F3]/20 bg-[#F5F9FF] p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0070F3] text-[11px] font-extrabold text-white">
                3
              </span>
              <p className="mt-2.5 text-[14px] font-extrabold text-[#141413]">诊断打磨预审</p>
              <p className="mt-1 text-[12px] leading-[18px] text-[#6B7280]">
                诊断薄弱点，逐栏打磨
              </p>
            </div>
          </div>
        </div>

        {/* 交接点 */}
        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E8E6E1]" />
          <div className="flex flex-col items-center gap-1">
            <DownArrow />
            <span className="whitespace-nowrap text-[11px] font-bold text-[#9CA3AF]">交给你来完成</span>
          </div>
          <div className="h-px flex-1 bg-[#E8E6E1]" />
        </div>

        {/* 用户区域 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-1 rounded-full bg-[#D1D5DB]" />
            <span className="text-xs font-extrabold tracking-[0.12em] text-[#9CA3AF] uppercase">
              你来完善
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            {/* Step 4 */}
            <div className="flex-1 rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAF9F6] p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D1D5DB] text-[11px] font-extrabold text-[#9CA3AF]">
                4
              </span>
              <p className="mt-2.5 text-[14px] font-extrabold text-[#141413]">添加图表</p>
              <p className="mt-1 text-[12px] leading-[18px] text-[#6B7280]">
                补充流程图、框架图
              </p>
            </div>

            <div className="flex items-center">
              <Arrow />
            </div>

            {/* Step 5 */}
            <div className="flex-1 rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAF9F6] p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D1D5DB] text-[11px] font-extrabold text-[#9CA3AF]">
                5
              </span>
              <p className="mt-2.5 text-[14px] font-extrabold text-[#141413]">根据规范微调</p>
              <p className="mt-1 text-[12px] leading-[18px] text-[#6B7280]">
                调整格式、字数、语言
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowFlow(false)}
            className="h-11 rounded-full bg-[#141413] px-10 text-[15px] font-semibold text-white transition hover:bg-[#2A2A28]"
          >
            我知道啦
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 pt-20 pb-8">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B7280]">
          Choose Your Path
        </p>
        <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em] text-[#141413]">
          选择你的起点
        </h2>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectPath("framework")}
          className="group rounded-xl border border-[#E8E6E1] bg-white p-6 text-left transition hover:shadow-md"
        >
          <span className="inline-block h-1 w-10 rounded-full bg-[#0070F3]" />
          <h3 className="mt-4 text-lg font-extrabold text-[#141413]">
            我没有申报书，从想法开始
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            填写你的课题想法和教学问题，AI 帮你生成一份完整的申报书框架。
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectPath("draft")}
          className="group rounded-xl border border-[#E8E6E1] bg-white p-6 text-left transition hover:shadow-md"
        >
          <span className="inline-block h-1 w-10 rounded-full bg-[#D97706]" />
          <h3 className="mt-4 text-lg font-extrabold text-[#141413]">
            我已经有草稿，需要打磨
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            上传你的申报书草稿，AI 帮你整体诊断、逐栏打磨、模拟专家预审。
          </p>
        </button>
      </div>
    </main>
  );
}
