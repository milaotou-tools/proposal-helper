import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";

export type ExpertReviewInput = {
  draft: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报模拟评审专家，帮助教师在申报前发现问题。";

const FALLBACK_USER =
  "请对以下课题申报书草稿进行模拟专家预审。\n\n申报书草稿：\n{{draft}}";

export function buildExpertReviewPrompt(input: ExpertReviewInput) {
  return {
    system: loadSystemPrompt("expert-review", FALLBACK_SYSTEM),
    user: fillTemplate(loadUserTemplate("expert-review", FALLBACK_USER), {
      draft: input.draft,
    }),
  };
}
