"use client";

type Props = {
  onSelectPath: (path: "framework" | "draft") => void;
};

const steps = [
  {
    label: "发现问题",
    desc: "课前或课后观察到的真实教学问题",
    example: "比如：学生复习知识点零散、应用题错误多",
    highlight: false
  },
  {
    label: "思考点子",
    desc: "从痛点出发，构思你要研究什么、怎么研究",
    example: "比如：用 AI 帮学生画数学概念图",
    highlight: true
  },
  {
    label: "生成结构化文本",
    desc: "完成选题依据、研究目标、内容、方法、预期成果",
    example: "把零散想法整理成规范的申报书框架",
    highlight: true
  },
  {
    label: "添加图表",
    desc: "补充流程图、框架图等可视化内容",
    example: "让申报书更直观、更专业",
    highlight: false
  },
  {
    label: "根据规范微调",
    desc: "按照本区域要求调整格式、字数、语言风格",
    example: "不同地区、不同级别的申报要求略有差异",
    highlight: false
  }
];

export function LandingPage({ onSelectPath }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center px-5 py-16">
      {/* 标题区 */}
      <div className="text-center">
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-[#141413]">
          课题申报小助手
        </h1>
        <p className="mt-3 text-base leading-7 text-[#6B7280]">
          帮助小学教师把课题想法变成申报书框架
        </p>
      </div>

      {/* 可视化流程图 */}
      <div className="mt-12 w-full">
        <h2 className="mb-5 text-center text-sm font-bold tracking-[0.12em] text-[#6B7280]">
          一份课题申请书是怎么写出来的
        </h2>

        {/* 桌面端：水平 5 步 */}
        <div className="hidden gap-0 md:flex">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-start gap-0">
              <div
                className={`flex-1 rounded-lg border px-4 py-5 text-center transition ${
                  step.highlight
                    ? "border-[#0070F3] bg-[#EBF5FF] shadow-sm"
                    : "border-[#E8E6E1] bg-white"
                }`}
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                      step.highlight
                        ? "bg-[#0070F3] text-white"
                        : "bg-[#E8E6E1] text-[#6B7280]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {step.highlight && (
                    <span className="rounded-full bg-[#0070F3] px-2 py-0.5 text-[10px] font-bold text-white">
                      工具覆盖
                    </span>
                  )}
                </div>
                <p
                  className={`text-[15px] font-extrabold leading-6 ${
                    step.highlight ? "text-[#0070F3]" : "text-[#141413]"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1.5 text-[12px] leading-[18px] text-[#6B7280]">
                  {step.desc}
                </p>
                <p className="mt-1 text-[11px] leading-[16px] text-[#9CA3AF]">
                  {step.example}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex shrink-0 items-center px-1.5 pt-5">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="text-[#D1D5DB]">
                    <path d="M7 4L14 10L7 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 移动端：垂直排列 */}
        <div className="flex flex-col gap-0 md:hidden">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-start gap-0">
              <div className="flex flex-col items-center">
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    step.highlight
                      ? "bg-[#0070F3] text-white"
                      : "bg-[#E8E6E1] text-[#6B7280]"
                  }`}
                >
                  {i + 1}
                </span>
                {i < steps.length - 1 && <div className="my-1 h-6 w-px bg-[#E8E6E1]" />}
              </div>
              <div
                className={`ml-3 mb-3 flex-1 rounded-lg border px-4 py-4 ${
                  step.highlight
                    ? "border-[#0070F3] bg-[#EBF5FF]"
                    : "border-[#E8E6E1] bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p
                    className={`text-[15px] font-extrabold ${
                      step.highlight ? "text-[#0070F3]" : "text-[#141413]"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.highlight && (
                    <span className="rounded-full bg-[#0070F3] px-2 py-0.5 text-[10px] font-bold text-white">
                      工具覆盖
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
                  {step.desc}
                </p>
                <p className="mt-0.5 text-[12px] leading-[18px] text-[#9CA3AF]">
                  {step.example}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 工具覆盖范围说明 */}
        <div className="mt-6 rounded-lg border border-[#0070F3]/20 bg-[#EBF5FF] px-5 py-4 text-center">
          <p className="text-sm leading-6 text-[#0070F3]">
            <span className="font-extrabold">本工具覆盖</span>
            <span className="mx-2">—</span>
            你只需要把"问题"和"想法"告诉 AI，它会帮你生成结构化的申报书文本。
            图表和格式微调由你自己完成。
          </p>
        </div>
      </div>

      {/* 路径选择 */}
      <div className="mt-14 w-full">
        <h2 className="mb-5 text-center text-sm font-bold tracking-[0.12em] text-[#6B7280]">
          选择你的起点
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectPath("framework")}
            className="group rounded-xl border border-[#E8E6E1] bg-white p-6 text-left transition hover:border-[#0070F3] hover:shadow-md"
          >
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#EBF5FF] text-2xl">
              🧠
            </div>
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
            className="group rounded-xl border border-[#E8E6E1] bg-white p-6 text-left transition hover:border-[#D97706] hover:shadow-md"
          >
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#FEF3E2] text-2xl">
              📝
            </div>
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
