"use client";

import { useState } from "react";

type Props = {
  onSelectPath: (path: "framework" | "draft") => void;
};

export function LandingPage({ onSelectPath }: Props) {
  const [showFlow, setShowFlow] = useState(true);
  if (showFlow) {
    return (
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center px-4 pt-20 pb-8">
        <div className="text-center">
          <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#141413]">
            课题申报小助手
          </h1>
          <p className="mt-3 text-base leading-7 text-[#6B7280]">
            从零起步 + 打磨已有草稿
          </p>
        </div>

        <div className="my-auto w-full">

          {/* 桌面端：水平 5 步 */}
          <div className="hidden gap-0 md:flex">
            {/* Step 1 */}
            <div className="flex flex-1 items-center gap-0">
              <div className="flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#6B7280]">1</span>
                </div>
                <p className="text-[15px] font-extrabold leading-6 text-[#141413]">发现问题</p>
                <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">课前或课后观察到的真实教学问题</p>
              </div>
              <div className="flex shrink-0 items-center px-2">
                <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#D1D5DB]">
                  <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* 绿色框包裹 Step 2-3 */}
            <div className="relative flex flex-[2] rounded-lg border-2 border-[#16A34A] bg-[#F0FDF4] p-4 pt-5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#16A34A] px-3 py-0.5 text-[11px] font-extrabold text-white whitespace-nowrap">
                本工具能帮到你的地方
              </span>
              <div className="flex w-full items-start gap-0">
                {/* Step 2 */}
                <div className="flex flex-1 items-center gap-0">
                  <div className="flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-6 text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16A34A] text-xs font-extrabold text-white">2</span>
                    </div>
                    <p className="text-[15px] font-extrabold leading-6 text-[#141413]">思考点子</p>
                    <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">从痛点出发，构思你要研究什么、怎么研究</p>
                  </div>
                  <div className="flex shrink-0 items-center px-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#16A34A]/40">
                      <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex flex-1 items-center gap-0">
                  <div className="flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-6 text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16A34A] text-xs font-extrabold text-white">3</span>
                    </div>
                    <p className="text-[15px] font-extrabold leading-6 text-[#141413]">生成结构化文本</p>
                    <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">完成选题依据、研究目标、内容、方法、预期成果</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center px-2">
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#D1D5DB]">
                <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Step 4 */}
            <div className="flex flex-1 items-center gap-0">
              <div className="flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#6B7280]">4</span>
                </div>
                <p className="text-[15px] font-extrabold leading-6 text-[#141413]">添加图表</p>
                <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">补充流程图、框架图等可视化内容</p>
              </div>
              <div className="flex shrink-0 items-center px-2">
                <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#D1D5DB]">
                  <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex flex-1 items-center gap-0">
              <div className="flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#6B7280]">5</span>
                </div>
                <p className="text-[15px] font-extrabold leading-6 text-[#141413]">根据规范微调</p>
                <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">按照本区域要求调整格式、字数、语言风格</p>
              </div>
            </div>
          </div>

          {/* 移动端：垂直排列 */}
          <div className="flex flex-col gap-0 md:hidden">
            {/* Step 1 */}
            <div className="flex items-start gap-0">
              <div className="flex flex-col items-center">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#6B7280]">1</span>
                <div className="my-1 h-6 w-px bg-[#16A34A]" />
              </div>
              <div className="ml-3 mb-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                <p className="text-[15px] font-extrabold text-[#141413]">发现问题</p>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">课前或课后观察到的真实教学问题</p>
              </div>
            </div>

            {/* 绿色框包裹 Step 2-3 */}
            <div className="relative mt-1 rounded-lg border-2 border-[#16A34A] bg-[#F0FDF4] px-3 py-4">
              <span className="absolute -top-3 left-4 rounded-full bg-[#16A34A] px-3 py-0.5 text-[11px] font-extrabold text-white">
                本工具能帮到你的地方
              </span>

              {/* Step 2 */}
              <div className="flex items-start gap-0 mt-1">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-xs font-extrabold text-white">2</span>
                  <div className="my-1 h-6 w-px bg-[#16A34A]/30" />
                </div>
                <div className="ml-3 mb-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                  <p className="text-[15px] font-extrabold text-[#141413]">思考点子</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">从痛点出发，构思你要研究什么、怎么研究</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-0">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-xs font-extrabold text-white">3</span>
                </div>
                <div className="ml-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                  <p className="text-[15px] font-extrabold text-[#141413]">生成结构化文本</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">完成选题依据、研究目标、内容、方法、预期成果</p>
                </div>
              </div>
            </div>

            {/* Connector line after green box */}
            <div className="flex items-start gap-0">
              <div className="flex flex-col items-center">
                <div className="my-1 h-6 w-px bg-[#E8E6E1]" />
              </div>
              <div className="ml-3 w-full" />
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-0">
              <div className="flex flex-col items-center">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#6B7280]">4</span>
                <div className="my-1 h-6 w-px bg-[#E8E6E1]" />
              </div>
              <div className="ml-3 mb-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                <p className="text-[15px] font-extrabold text-[#141413]">添加图表</p>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">补充流程图、框架图等可视化内容</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-0">
              <div className="flex flex-col items-center">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#6B7280]">5</span>
              </div>
              <div className="ml-3 flex-1 rounded-lg border border-[#E8E6E1] bg-white px-5 py-5">
                <p className="text-[15px] font-extrabold text-[#141413]">根据规范微调</p>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">按照本区域要求调整格式、字数、语言风格</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFlow(false)}
          className="mt-10 h-12 rounded-md bg-[#16A34A] px-10 text-base font-extrabold text-white transition hover:bg-[#15803D]"
        >
          我知道啦
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-8">
      <div className="text-center">
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#141413]">
          课题申报小助手
        </h1>
        <p className="mt-3 text-base leading-7 text-[#6B7280]">
          从零起步 + 打磨已有草稿
        </p>
      </div>

      <div className="mt-14 w-full">
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
