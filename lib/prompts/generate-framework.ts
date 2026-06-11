import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";
import { SHARED_FORMAT_RULES } from "./format-rules";

export type GenerateFrameworkInput = {
  stageSubject: string;
  idea: string;
  problem: string;
  researchObjects: string;
  practiceBase: string;
  expectedOutputs: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，帮助教师整理申报书框架。缺失信息标注'需用户补充'。";

const FALLBACK_USER =
  "请根据以下课题想法生成申报书基本框架。\n\n学段学科：{{stageSubject}}\n课题想法：{{idea}}";

export function buildGenerateFrameworkPrompt(input: GenerateFrameworkInput) {
  return {
    system: loadSystemPrompt("generate-framework", FALLBACK_SYSTEM) + "\n\n" + SHARED_FORMAT_RULES,
    user: fillTemplate(loadUserTemplate("generate-framework", FALLBACK_USER), {
      stageSubject: input.stageSubject || "需用户补充",
      idea: input.idea || "需用户补充",
      problem: input.problem || "需用户补充",
      researchObjects: input.researchObjects || "需用户补充",
      practiceBase: input.practiceBase || "需用户补充",
      expectedOutputs: input.expectedOutputs || "需用户补充",
    }),
  };
}
