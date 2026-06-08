"use client";

type StepNavigationProps = {
  steps: { label: string; description?: string }[];
  currentStep: number;
  onGoToStep: (step: number) => void;
  allowForwardNavigation?: boolean;
};

export function StepNavigation({
  steps,
  currentStep,
  onGoToStep,
  allowForwardNavigation = false,
}: StepNavigationProps) {
  return (
    <nav
      aria-label="步骤导航"
      className="w-full"
    >
      <ol className="flex items-center gap-1">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isClickable = allowForwardNavigation || isCompleted || isCurrent;

          return (
            <li key={step.label} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onGoToStep(i)}
                className={`group flex items-center gap-2 rounded-lg px-1.5 py-1 transition ${
                  isClickable ? "cursor-pointer hover:bg-white/55" : "cursor-default"
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                    isCompleted
                      ? "border border-[#141413] bg-white/75 text-[#141413]"
                      : isCurrent
                        ? "bg-sky-500 text-[#141413] shadow-[0_8px_18px_rgba(14,165,233,0.22)] ring-4 ring-sky-200/70"
                        : "border border-slate-200/90 bg-slate-100/90 text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 7L6 10L11 4" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="hidden sm:block">
                  <p
                    className={`text-[13px] font-semibold leading-4 ${
                      isCurrent
                        ? "text-[#141413]"
                        : isCompleted
                        ? "text-slate-900"
                          : "text-slate-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-600">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-px flex-1 ${
                    i < currentStep ? "bg-slate-400/80" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
