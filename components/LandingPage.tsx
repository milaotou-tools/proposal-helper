"use client";

import { useState } from "react";

type Props = {
  onSelectPath: (path: "framework" | "draft") => void;
};

export function LandingPage({ onSelectPath }: Props) {
  const [showFlow, setShowFlow] = useState(true);
  if (showFlow) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-20 pb-8">
        <div className="text-center">
          <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#141413]">
            课题申报小助手
          </h1>
          <p className="mt-3 text-base leading-7 text-[#6B7280]">
            从零起步 + 打磨已有草稿
          </p>
        </div>

        <div className="my-auto w-full">

          {/* 桌面端：水平 5 步，分两段 */}
          <div className="hidden gap-0 md:flex md:items-stretch">
            {/* 工具覆盖区：Step 1-3 */}
            <div className="relative flex flex-[5] rounded-lg border-2 border-[#0070F3] bg-[#EFF6FF] p-4 pt-6">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0070F3] px-3 py-0.5 text-[11px] font-extrabold text-white whitespace-nowrap">
                本工具帮你到这儿
              </span>
              <div className="flex w-full items-stretch gap-0">
                {/* Step 1 */}
                <div className="flex flex-1 items-stretch gap-0">
                  <div className="flex flex-1 flex-col justify-center rounded-lg border border-[#E8E6E1] bg-white px-4 py-5 text-center">
                    <div className="mb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">1</span>
                    </div>
                    <p className="text-[15px] font-extrabold leading-6 text-[#141413]">发现问题</p>
                    <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">课前或课后观察到的真实教学问题</p>
                  </div>
                  <div className="flex shrink-0 items-center px-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#0070F3]/30">
                      <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex flex-1 items-stretch gap-0">
                  <div className="flex flex-1 flex-col justify-center rounded-lg border border-[#E8E6E1] bg-white px-4 py-5 text-center">
                    <div className="mb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">2</span>
                    </div>
                    <p className="text-[15px] font-extrabold leading-6 text-[#141413]">生成申报框架</p>
                    <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">从想法或已有草稿出发，AI 整理成结构化申报书</p>
                  </div>
                  <div className="flex shrink-0 items-center px-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#0070F3]/30">
                      <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex flex-1 items-stretch gap-0">
                  <div className="flex flex-1 flex-col justify-center rounded-lg border border-[#E8E6E1] bg-white px-4 py-5 text-center">
                    <div className="mb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">3</span>
                    </div>
                    <p className="text-[15px] font-extrabold leading-6 text-[#141413]">诊断打磨预审</p>
                    <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">整体诊断薄弱点，逐栏打磨，模拟专家预审</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 分界 */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-3">
              <div className="h-px w-full bg-[#D1D5DB]" />
              <span className="text-[10px] font-bold text-[#9CA3AF] whitespace-nowrap">你继续</span>
              <span className="text-[10px] font-bold text-[#9CA3AF] whitespace-nowrap">完善</span>
              <div className="h-px w-full bg-[#D1D5DB]" />
            </div>

            {/* 用户完善区：Step 4-5 */}
            <div className="relative flex flex-[2] rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F8F9FA] p-4 pt-6">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#9CA3AF] px-3 py-0.5 text-[11px] font-extrabold text-white whitespace-nowrap">
                你继续完善
              </span>
              <div className="flex w-full items-stretch gap-0">
                {/* Step 4 */}
                <div className="flex flex-1 items-stretch gap-0">
                  <div className="flex flex-1 flex-col justify-center rounded-lg border border-[#E8E6E1] bg-white px-4 py-5 text-center opacity-70">
                    <div className="mb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#9CA3AF]">4</span>
                    </div>
                    <p className="text-[15px] font-extrabold leading-6 text-[#6B7280]">添加图表</p>
                    <p className="mt-1.5 text-[13px] leading-[19px] text-[#9CA3AF]">补充流程图、框架图等可视化内容</p>
                  </div>
                  <div className="flex shrink-0 items-center px-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#D1D5DB]">
                      <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {/* Step 5 */}
                <div className="flex flex-1 items-stretch gap-0">
                  <div className="flex flex-1 flex-col justify-center rounded-lg border border-[#E8E6E1] bg-white px-4 py-5 text-center opacity-70">
                    <div className="mb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#9CA3AF]">5</span>
                    </div>
                    <p className="text-[15px] font-extrabold leading-6 text-[#6B7280]">根据规范微调</p>
                    <p className="mt-1.5 text-[13px] leading-[19px] text-[#9CA3AF]">按照本区域要求调整格式、字数、语言风格</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 移动端：垂直排列 */}
          <div className="flex flex-col gap-0 md:hidden">
            {/* 工具覆盖区 */}
            <div className="relative rounded-lg border-2 border-[#0070F3] bg-[#EFF6FF] px-3 py-4">
              <span className="absolute -top-3 left-4 rounded-full bg-[#0070F3] px-3 py-0.5 text-[11px] font-extrabold text-white">
                本工具帮你到这儿
              </span>

              {/* Step 1 */}
              <div className="flex items-start gap-0 mt-1">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">1</span>
                  <div className="my-1 h-6 w-px bg-[#0070F3]/30" />
                </div>
                <div className="ml-3 mb-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                  <p className="text-[15px] font-extrabold text-[#141413]">发现问题</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">课前或课后观察到的真实教学问题</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-0">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">2</span>
                  <div className="my-1 h-6 w-px bg-[#0070F3]/30" />
                </div>
                <div className="ml-3 mb-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                  <p className="text-[15px] font-extrabold text-[#141413]">生成申报框架</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">从想法或已有草稿出发，AI 整理成结构化申报书</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-0">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">3</span>
                </div>
                <div className="ml-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                  <p className="text-[15px] font-extrabold text-[#141413]">诊断打磨预审</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">整体诊断薄弱点，逐栏打磨，模拟专家预审</p>
                </div>
              </div>
            </div>

            {/* 分界线 */}
            <div className="flex items-center gap-3 py-2 pl-4">
              <div className="h-px flex-1 bg-[#D1D5DB]" />
              <span className="text-[11px] font-bold text-[#9CA3AF]">你继续完善</span>
              <div className="h-px flex-1 bg-[#D1D5DB]" />
            </div>

            {/* 用户完善区 */}
            <div className="relative rounded-lg border-2 border-dashed border-[#D1D5DB] bg-[#F8F9FA] px-3 py-4 opacity-70">
              {/* Step 4 */}
              <div className="flex items-start gap-0">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#9CA3AF]">4</span>
                  <div className="my-1 h-6 w-px bg-[#D1D5DB]" />
                </div>
                <div className="ml-3 mb-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                  <p className="text-[15px] font-extrabold text-[#6B7280]">添加图表</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#9CA3AF]">补充流程图、框架图等可视化内容</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-0">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#9CA3AF]">5</span>
                </div>
                <div className="ml-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                  <p className="text-[15px] font-extrabold text-[#6B7280]">根据规范微调</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#9CA3AF]">按照本区域要求调整格式、字数、语言风格</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFlow(false)}
          className="mt-10 h-12 rounded-md bg-[#0070F3] px-10 text-base font-extrabold text-white transition hover:bg-[#2563EB]"
        >
          我知道啦
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-8">
      <div className="w-full">
        <h2 className="mb-5 text-center text-sm font-bold tracking-[0.12em] text-[#6B7280]">
          选择你的起点
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectPath("framework")}
            className="group rounded-xl border border-[#E8E6E1] border-t-[3px] border-t-[#0070F3] bg-white p-6 text-center transition hover:shadow-md"
          >
            <h3 className="text-lg font-extrabold text-[#141413] group-hover:text-[#0070F3]">
              我没有申报书，从想法开始
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              填写你的课题想法和教学问题，AI 帮你生成一份完整的申报书框架。
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPath("draft")}
            className="group rounded-xl border border-[#E8E6E1] border-t-[3px] border-t-[#D97706] bg-white p-6 text-center transition hover:shadow-md"
          >
            <h3 className="text-lg font-extrabold text-[#141413] group-hover:text-[#D97706]">
              我已经有草稿，需要打磨
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              上传你的申报书草稿，AI 帮你整体诊断、逐栏打磨、模拟专家预审。
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}
