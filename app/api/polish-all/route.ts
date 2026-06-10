import { buildPolishAllPrompt } from "@/lib/prompts/polish-all";
import { jsonError, runPromptStream, validateDraft } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const input = {
    draft: validateDraft(body.draft),
  };

  if (!input.draft) {
    return jsonError("请先粘贴需要打磨的申报书内容。");
  }

  const prompt = buildPolishAllPrompt(input);
  const allowCollection = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
  return runPromptStream(prompt.system, prompt.user, "polish-all", { draft: input.draft }, request, allowCollection);
}
