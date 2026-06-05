import { buildExpertReviewPrompt } from "@/lib/prompts/expert-review";
import { jsonError, runPromptWithCollection, validateDraft } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const input = {
    draft: validateDraft(body.draft)
  };

  if (!input.draft) {
    return jsonError("请先粘贴申报书草稿，再进行模拟专家预审。");
  }

  const prompt = buildExpertReviewPrompt(input);
  const allowCollection = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
  return runPromptWithCollection(prompt.system, prompt.user, "expert-review", { draft: input.draft }, request, allowCollection);
}
