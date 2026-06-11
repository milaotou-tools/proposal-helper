import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";

export type PolishSectionInput = {
  draft: string;
  section: string;
  heading?: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，负责对申报书草稿的单个栏目进行打磨。不要整篇重写。";

const FALLBACK_USER =
  "{{scopeDescription}}\n\n申报书全文：\n{{draft}}\n\n请从上述全文中自行定位【{{section}}】栏目，对其进行打磨，输出四部分结果。";

const ALL_SECTIONS = [
  "课题名称", "摘要", "关键词", "选题依据", "核心概念界定", "文献综述",
  "研究目标", "研究内容", "研究方法", "技术路线",
  "实施步骤", "人员分工", "研究条件", "可行性分析",
  "预期成果", "创新点", "经费预算", "参考文献"
];

export function buildPolishSectionPrompt(input: PolishSectionInput) {
  const headingHint = input.heading && input.heading !== input.section
    ? `（用户在草稿中使用的标题为"${input.heading}"）`
    : "";

  const sectionsList = ALL_SECTIONS.join("、");

  const scopeDescription =
    `需要打磨的栏目：${input.section}${headingHint}。\n\n` +
    `只打磨【${input.section}】这一个栏目。从用户原文中找出属于该栏目的内容进行打磨。不属于该栏目的文字一律忽略。\n\n` +
    `标准栏目框架（${ALL_SECTIONS.length}个）：${sectionsList}。\n\n` +
    `⚠️ 输出铁律：以下四个标题必须原样照抄输出——**识别到的原文**、**原栏目问题**、**修改建议**、**修改后文本**。一个都不能少，不得修改标题文字，不得省略任何一个。\n` +
    `⚠️ 编号格式：所有列举必须用 1. 2. 3. 编号，禁止使用短横 - 或星号 * 作为列表符号。多级列表用 1.1 1.2 或 (1) (2) 等格式区分层级。`;

  return {
    system: loadSystemPrompt("polish-section", FALLBACK_SYSTEM),
    user: fillTemplate(loadUserTemplate("polish-section", FALLBACK_USER), {
      scopeDescription,
      draft: input.draft,
      section: input.section,
    }),
  };
}
