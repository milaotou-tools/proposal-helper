"use client";

import { useState } from "react";

type Props = {
  onSelectPath: (path: "framework" | "draft") => void;
};

const Arrow = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" className="shrink-0 text-slate-300">
    <path d="M6 3L11 8L6 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function LandingPage({ onSelectPath }: Props) {
  const [showFlow, setShowFlow] = useState(true);

  if (showFlow) {
    return (
      <main className="relative mx-auto max-w-6xl px-6 pb-10 pt-16">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-[40px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[52px]">
            课题申报小助手
          </h1>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500/80">
            幼 · 小 · 初 · 高
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed tracking-[-0.01em] text-slate-600">
            &ldquo;把专家的申报思路拆成步骤，陪着你把想法变成申请书。&rdquo;
          </p>
        </div>

        {/* AI 区域 */}
        <div className="mt-12">
          <div className="mb-4">
            <span className="section-label text-sky-500">
              本工具帮你
            </span>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:gap-4">
            {/* Step 1 */}
            <div className="surface flex-1 p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-[12px] font-semibold text-white shadow-sm">
                1
              </span>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">发现问题</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-slate-600">
                观察到的真实教学问题
              </p>
            </div>

            <div className="hidden sm:flex items-center">
              <Arrow />
            </div>

            {/* Step 2 */}
            <div className="surface flex-1 p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-[12px] font-semibold text-white shadow-sm">
                2
              </span>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">生成框架</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-slate-600">
                AI 整理结构化申报书
              </p>
            </div>

            <div className="hidden sm:flex items-center">
              <Arrow />
            </div>

            {/* Step 3 */}
            <div className="surface flex-1 p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-[12px] font-semibold text-white shadow-sm">
                3
              </span>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">诊断打磨预审</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-slate-600">
                诊断薄弱点，逐栏打磨
              </p>
            </div>
          </div>
        </div>

        {/* 交接点 */}
        <div className="mt-3 mb-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200/80" />
          <span className="whitespace-nowrap text-[12px] font-semibold text-slate-400">后续</span>
          <div className="h-px flex-1 bg-slate-200/80" />
        </div>

        {/* 用户区域 */}
        <div>
          <div className="mb-4">
            <span className="section-label text-slate-400">
              你来完善
            </span>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:gap-4">
            {/* Step 4 */}
            <div className="surface-soft flex-1 border-dashed p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-400">
                4
              </span>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">添加图表</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-slate-600">
                补充流程图、框架图
              </p>
            </div>

            <div className="hidden sm:flex items-center">
              <Arrow />
            </div>

            {/* Step 5 */}
            <div className="surface-soft flex-1 border-dashed p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-400">
                5
              </span>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">根据规范微调</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-slate-600">
                添加参考文献、调整格式
              </p>
            </div>

            <div className="hidden sm:flex items-center">
              <Arrow />
            </div>

            {/* Step 6 */}
            <div className="surface-soft flex-1 border-dashed p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-400">
                6
              </span>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">提交申请书</p>
              <p className="mt-1.5 text-[13px] leading-[19px] text-slate-600">
                提交申报材料
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowFlow(false)}
            className="btn btn-primary h-12 rounded-full px-12 text-[16px]"
          >
            我知道啦
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pb-12 pt-16">
      <div className="text-center">
        <p className="section-label">
          Choose Your Path
        </p>
        <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[34px]">
          选择你的起点
        </h2>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectPath("framework")}
          className="group surface p-6 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,23,42,0.09)]"
        >
          <span className="inline-block h-1 w-10 rounded-full bg-sky-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            我没有申报书，从想法开始
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            填写你的课题想法和教学问题，本工具帮你生成一份完整的申报书框架。
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectPath("draft")}
          className="group surface p-6 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(15,23,42,0.09)]"
        >
          <span className="inline-block h-1 w-10 rounded-full bg-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            我已经有草稿，需要打磨
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            上传你的申报书草稿，本工具帮你整体诊断、逐栏打磨、模拟专家预审。
          </p>
        </button>
      </div>
    </main>
  );
}
