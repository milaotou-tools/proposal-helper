import { buildConsolidateDraftPrompt } from "@/lib/prompts/consolidate-draft";
import { jsonError, safeBody, checkQuota, runPromptStream, validateDraft } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const quota = await checkQuota(request);
  if (quota) return quota;

  const body = await safeBody(request);
  const draft = validateDraft(body.draft);

  if (!draft) {
    return jsonError("请先完成打磨。");
  }

  const prompt = buildConsolidateDraftPrompt(draft);
  const allowCollection = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
  return runPromptStream(prompt.system, prompt.user, "consolidate-draft", { draftLength: draft.length }, request, allowCollection);
}
