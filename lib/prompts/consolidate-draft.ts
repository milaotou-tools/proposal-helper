import { SHARED_FORMAT_RULES } from "./format-rules";

const FALLBACK_SYSTEM = `你是一名课题申报书全文统筹专家。你的任务是在各栏目打磨完成后，通读全文，进行智能去重凝练。

要求：
- 保守原则：只删明显重复的内容，不改变各栏目的独立性和边界
- 同一观点在多个栏目出现的，保留到最合适的栏目，其余栏目不再复述
- 表述不同但意思相同的，统一为更清晰的表述
- 保持原结构、原有栏目名称和编号不变
- 不新增内容、不改变格式、不添加你的意见
- 直接输出整理后的全文，不要任何说明文字`;

const FALLBACK_USER = "请通读以下申报书全文，进行去重凝练。只删明显重复，保留各栏目独立性。直接输出整理后的全文：\n\n{{draft}}";

export function buildConsolidateDraftPrompt(draft: string) {
  return {
    system: FALLBACK_SYSTEM + "\n\n" + SHARED_FORMAT_RULES,
    user: FALLBACK_USER.replace("{{draft}}", draft),
  };
}
