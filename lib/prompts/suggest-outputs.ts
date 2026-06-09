import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";

export type SuggestOutputsInput = {
  discipline: string;
  gradeSegment: string;
  idea: string;
  problem: string;
  researchObjects: string;
  practiceBase: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，帮助一线教师撰写课题申报书中的预期成果栏目。";

const FALLBACK_USER =
  "学科：{{discipline}}\n年级段：{{gradeSegment}}\n课题想法：{{idea}}\n研究问题：{{problem}}\n研究对象：{{researchObjects}}\n实践基础：{{practiceBase}}\n\n请根据以上信息，生成2-4个适合该课题的预期成果建议。每个成果建议用1-3句话说明具体产出什么（如课题报告、教学案例集、学生作品、校本资源包等），要具体可操作，不要空泛口号。以序号开头列出。";

export function buildSuggestOutputsPrompt(input: SuggestOutputsInput) {
  return {
    system: loadSystemPrompt("suggest-outputs", FALLBACK_SYSTEM),
    user: fillTemplate(loadUserTemplate("suggest-outputs", FALLBACK_USER), {
      discipline: input.discipline,
      gradeSegment: input.gradeSegment,
      idea: input.idea || "未提供",
      problem: input.problem || "未提供",
      researchObjects: input.researchObjects || "未提供",
      practiceBase: input.practiceBase || "未提供",
    }),
  };
}
