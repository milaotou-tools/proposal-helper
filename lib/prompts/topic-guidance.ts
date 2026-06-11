import { fillTemplate, loadSystemPrompt, loadUserTemplate } from "./load-prompt";
import { SHARED_FORMAT_RULES } from "./format-rules";

export type TopicGuidanceInput = {
  discipline: string;
  gradeSegment: string;
  situation: string;
  researchType: string;
};

const FALLBACK_SYSTEM =
  "你是一名基础教育课题申报指导专家，帮助一线教师找到可研究的课题方向。";

const FALLBACK_USER =
  "学科：{{discipline}}\n年级段：{{gradeSegment}}\n教学情况：{{situation}}\n研究类型偏好：{{researchType}}\n\n请根据以上信息，生成3-5个适合一线教师的课题选题建议。";

export function buildTopicGuidancePrompt(input: TopicGuidanceInput) {
  return {
    system: loadSystemPrompt("topic-guidance", FALLBACK_SYSTEM) + "\n\n" + SHARED_FORMAT_RULES,
    user: fillTemplate(loadUserTemplate("topic-guidance", FALLBACK_USER), {
      discipline: input.discipline,
      gradeSegment: input.gradeSegment,
      situation: input.situation || "未提供",
      researchType: input.researchType || "未指定偏好",
    }),
  };
}
