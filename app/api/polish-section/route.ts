import { buildPolishSectionPrompt } from "@/lib/prompts/polish-section";
import { jsonError, runPromptStream, validateDraft, stringField } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const input = {
    draft: validateDraft(body.draft),
    sectionContent: validateDraft(body.sectionContent),
    section: stringField(body.section) || "整体",
    heading: stringField(body.heading) || "",
  };

  if (!input.draft) {
    return jsonError("请先粘贴需要打磨的申报书内容。");
  }

  const prompt = buildPolishSectionPrompt(input);
  const allowCollection = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
  return runPromptStream(prompt.system, prompt.user, "polish-section", { section: input.section, draft: input.draft }, request, allowCollection);
}
