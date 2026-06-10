import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";

export type PolishAllInput = {
  draft: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，负责对申报书草稿进行结构化打磨。按照标准栏目框架逐栏诊断、打磨，最后输出完整全文。";

const FALLBACK_USER =
  "请对以下申报书草稿进行结构化打磨。\n\n申报书全文：\n{{draft}}\n\n按标准栏目框架依次处理，每个栏目输出识别原文、问题、建议、修改文本。全部完成后输出 ---FULL-DRAFT--- 和完整全文。";

export function buildPolishAllPrompt(input: PolishAllInput) {
  return {
    system: loadSystemPrompt("polish-all", FALLBACK_SYSTEM),
    user: fillTemplate(loadUserTemplate("polish-all", FALLBACK_USER), {
      draft: input.draft,
    }),
  };
}
