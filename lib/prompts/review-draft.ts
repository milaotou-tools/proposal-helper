import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";
import { SHARED_FORMAT_RULES } from "./format-rules";

export type ReviewDraftInput = {
  draft: string;
  scope: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，负责对申报书草稿进行问题诊断。只做诊断，不直接重写。";

const FALLBACK_USER =
  "诊断范围：{{scopeInstruction}}\n\n申报书草稿：\n{{draft}}\n\n请输出诊断意见。";

export function buildReviewDraftPrompt(input: ReviewDraftInput) {
  const scopeInstruction =
    input.scope && input.scope !== "整体诊断" && input.scope !== "整体"
      ? `诊断范围：只诊断"${input.scope}"这一栏。`
      : "诊断范围：整份申报书（所有栏目）";

  return {
    system: loadSystemPrompt("review-draft", FALLBACK_SYSTEM) + "\n\n" + SHARED_FORMAT_RULES,
    user: fillTemplate(loadUserTemplate("review-draft", FALLBACK_USER), {
      scopeInstruction,
      draft: input.draft,
    }),
  };
}
