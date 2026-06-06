"use client";

import { useState } from "react";

type Props = {
  onSelectPath: (path: "framework" | "draft") => void;
};

export function LandingPage({ onSelectPath }: Props) {
  const [showFlow, setShowFlow] = useState(true);

  if (showFlow) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-16 pb-8">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-[34px] font-extrabold tracking-[-0.02em] text-[#141413]">
            课题申报小助手
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[#6B7280]">
            从零起步 + 打磨已有草稿
          </p>
        </div>

        {/* 流程图 */}
        <div className="mt-12 w-full space-y-8">
          {/* 工具覆盖区头部 */}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#0070F3] px-3 py-0.5 text-[11px] font-bold text-white">
              本工具帮你到这儿
            </span>
            <div className="h-px flex-1 bg-[#E8E6E1]" />
          </div>

          {/* Step 1-3 三张卡片 */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col rounded-xl border border-[#E8E6E1] bg-white p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">
                1
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-[#141413]">发现问题</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">
                课前或课后观察到的真实教学问题
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col rounded-xl border border-[#E8E6E1] bg-white p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">
                2
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-[#141413]">生成申报框架</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">
                从想法或已有草稿出发，AI 整理成结构化申报书
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col rounded-xl border border-[#E8E6E1] bg-white p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0070F3] text-xs font-extrabold text-white">
                3
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-[#141413]">诊断打磨预审</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-[#6B7280]">
                整体诊断薄弱点，逐栏打磨，模拟专家预审
              </p>
            </div>
          </div>

          {/* 分界线 */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E8E6E1]" />
            <span className="text-xs font-semibold text-[#9CA3AF]">你继续完善</span>
            <div className="h-px flex-1 bg-[#E8E6E1]" />
          </div>

          {/* Step 4-5 两张卡片 */}
          <div className="grid gap-4 sm:grid-cols-2 sm:px-8">
            {/* Step 4 */}
            <div className="flex flex-col rounded-xl border border-[#E8E6E1] bg-[#F8F9FA] p-5 opacity-70">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#9CA3AF]">
                4
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-[#6B7280]">添加图表</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-[#9CA3AF]">
                补充流程图、框架图等可视化内容
              </p>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col rounded-xl border border-[#E8E6E1] bg-[#F8F9FA] p-5 opacity-70">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E6E1] text-xs font-extrabold text-[#9CA3AF]">
                5
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-[#6B7280]">根据规范微调</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-[#9CA3AF]">
                按照本区域要求调整格式、字数、语言风格
              </p>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <button
          type="button"
          onClick={() => setShowFlow(false)}
          className="mt-10 h-11 rounded-full bg-[#141413] px-10 text-[15px] font-semibold text-white transition hover:bg-[#2A2A28]"
        >
          我知道啦
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-8">
      <div className="w-full">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6B7280]">
            Choose Your Path
          </p>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em] text-[#141413]">
            选择你的起点
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectPath("framework")}
            className="group rounded-xl border border-[#E8E6E1] bg-white p-6 text-left transition hover:shadow-md hover:border-[#0070F3]/20"
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
            className="group rounded-xl border border-[#E8E6E1] bg-white p-6 text-left transition hover:shadow-md hover:border-[#D97706]/20"
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
      </div>
    </main>
  );
}
