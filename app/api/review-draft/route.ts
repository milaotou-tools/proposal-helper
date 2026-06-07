import { buildReviewDraftPrompt } from "@/lib/prompts/review-draft";
import { jsonError, runPromptStream, validateDraft, stringField } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const input = {
    draft: validateDraft(body.draft),
    scope: stringField(body.scope) || "整体诊断"
  };

  if (!input.draft) {
    return jsonError("请先粘贴申报书草稿。");
  }

  const prompt = buildReviewDraftPrompt(input);
  const allowCollection = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
  return runPromptStream(prompt.system, prompt.user, "review-draft", { scope: input.scope, draft: input.draft }, request, allowCollection);
}
