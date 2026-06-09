import { buildLivePagePrompt } from "@/lib/prompts/generate-livepage";
import { jsonError, runPromptStream, validateDraft } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const draft = validateDraft(body.draft);

  if (!draft) {
    return jsonError("请先完成申报书草稿，再生成活页。");
  }

  const prompt = buildLivePagePrompt({ draft });
  const allowCollection = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
  return runPromptStream(prompt.system, prompt.user, "generate-livepage", { draft }, request, allowCollection);
}
