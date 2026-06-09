import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";

export type LivePageInput = { draft: string };

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报盲审辅助专家，帮助教师在提交前找出申报书中的个人信息，以便制作匿名活页。只输出指定内容，不要输出开场白、免责声明、客套语或总结性套话。";

const FALLBACK_USER =
  "请扫描以下课题申报书，找出所有可能泄露身份的个人信息或学校信息。\n\n申报书：\n{{draft}}\n\n按以下格式输出：\n\n**需处理的个人信息**\n\n逐条列出，格式为 1. 位置（如\"课题名称\"\"研究基础\"等栏目名）+ 原文中的具体表述。每条标注修改建议（如\"替换为[XX学校]\"\"删除\"\"改为[XX教师]\"）。\n\n需检查的类型：教师姓名、学校全名、具体班级名称、校内特色项目名称（可能反向定位学校）、区县以上行政区域、教师个人荣誉或职称（如\"市级骨干教师\"）、其他可定位到具体人或具体学校的信息。\n\n如果申报书没有明显的个人信息，请明确告知\"未发现明显个人信息\"。";

export function buildLivePagePrompt(input: LivePageInput) {
  return {
    system: loadSystemPrompt("generate-livepage", FALLBACK_SYSTEM),
    user: fillTemplate(loadUserTemplate("generate-livepage", FALLBACK_USER), {
      draft: input.draft,
    }),
  };
}
