"use client";

type StepNavigationProps = {
  steps: { label: string; description?: string }[];
  currentStep: number;
  onGoToStep: (step: number) => void;
};

export function StepNavigation({ steps, currentStep, onGoToStep }: StepNavigationProps) {
  return (
    <nav aria-label="步骤导航" className="w-full">
      <ol className="flex items-center">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isClickable = isCompleted || isCurrent;

          return (
            <li key={step.label} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onGoToStep(i)}
                className={`group flex items-center gap-2 ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
                    isCompleted
                      ? "bg-[#141413] text-white"
                      : isCurrent
                        ? "bg-[#0070F3] text-white ring-2 ring-[#0070F3]/30"
                        : "bg-[#E8E6E1] text-[#9CA3AF]"
                  }`}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7L6 10L11 4" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="hidden sm:block">
                  <p
                    className={`text-[13px] font-extrabold leading-4 ${
                      isCurrent
                        ? "text-[#0070F3]"
                        : isCompleted
                          ? "text-[#141413]"
                          : "text-[#9CA3AF]"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="mt-0.5 text-[11px] leading-4 text-[#9CA3AF]">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-px flex-1 ${
                    i < currentStep ? "bg-[#141413]" : "bg-[#E8E6E1]"
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
