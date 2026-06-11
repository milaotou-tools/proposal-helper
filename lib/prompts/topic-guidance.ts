import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";

const TOPIC_FORMAT_RULES = [
  "## 输出格式（必须严格遵守，违反会破坏页面显示）",
  "- 只输出选题列表，每个选题仅包含：《课题名称》+ 一行简要说明",
  "- 课题名称用《》包裹，说明不超过80字",
  "- 选题之间用空行分隔，编号使用 1. 2. 3.",
  "- 严禁输出\"研究背景\"\"研究内容框架\"\"预期成果\"\"研究方法\"等申报书栏目",
  "- 严禁输出多级编号结构（如一、（一）、1. 嵌套）",
  "- 严禁输出任何括号分类说明",
].join("\n");

export type TopicGuidanceInput = {
  discipline: string;
  gradeSegment: string;
  situation: string;
  researchType: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，帮助一线教师找到可研究的课题方向。只输出选题名称和一句话说明，不要展开任何栏目。";

const FALLBACK_USER =
  "学科：{{discipline}}\n年级段：{{gradeSegment}}\n教学情况：{{situation}}\n研究类型偏好：{{researchType}}\n\n请生成3-5个课题选题建议。每个选题只包含课题名称（用《》括起）和一句不超过80字的说明。禁止输出背景、研究内容、预期成果等栏目。";

export function buildTopicGuidancePrompt(input: TopicGuidanceInput) {
  return {
    system: loadSystemPrompt("topic-guidance", FALLBACK_SYSTEM) + "\n\n" + TOPIC_FORMAT_RULES,
    user: fillTemplate(loadUserTemplate("topic-guidance", FALLBACK_USER), {
      discipline: input.discipline,
      gradeSegment: input.gradeSegment,
      situation: input.situation || "未提供",
      researchType: input.researchType || "未指定偏好",
    }),
  };
}
