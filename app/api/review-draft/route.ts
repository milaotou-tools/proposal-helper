import { buildReviewDraftPrompt } from "@/lib/prompts/review-draft";
import { jsonError, validateDraft, stringField } from "@/lib/route-helpers";
import { createChatCompletion } from "@/lib/ai-client";

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

  try {
    const text = await createChatCompletion([
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user }
    ]);
    return Response.json({ text });
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    const stack = (caught instanceof Error ? caught.stack : "") || "";
    return Response.json({
      error: msg,
      stack: stack.slice(0, 500),
      name: caught instanceof Error ? caught.name : typeof caught
    }, { status: 500 });
  }
}
