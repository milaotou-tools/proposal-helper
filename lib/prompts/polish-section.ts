import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";

export type PolishSectionInput = {
  draft: string;
  section: string;
  heading?: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，负责对申报书草稿进行逐栏打磨。不要整篇重写。";

const FALLBACK_USER =
  "{{scopeDescription}}\n\n原始草稿：\n{{draft}}\n\n请输出打磨结果。";

export function buildPolishSectionPrompt(input: PolishSectionInput) {
  const isOverall = !input.section || input.section === "整体诊断" || input.section === "整体";

  const headingHint = input.heading && input.heading !== input.section
    ? `（用户在草稿中使用的标题为"${input.heading}"）`
    : "";
  const scopeDescription = isOverall
    ? "请对整份申报书草稿进行逐栏打磨，按栏目依次给出修改建议。注意：申报书应包含的栏目是课题名称、选题依据、文献综述、研究目标、研究内容、研究方法、实施步骤、预期成果、研究条件、创新点等常规栏目，不要建议新增\"整体诊断\"之类的非标准栏目。"
    : `需要打磨的栏目：${input.section}${headingHint}。只打磨这一个栏目，不要扩展到其他栏目。`;

  return {
    system: loadSystemPrompt("polish-section", FALLBACK_SYSTEM),
    user: fillTemplate(loadUserTemplate("polish-section", FALLBACK_USER), {
      scopeDescription,
      draft: input.draft,
    }),
  };
}
