import { buildGenerateFrameworkPrompt } from "@/lib/prompts/generate-framework";
import { jsonError, runPromptStream, safeBody, validateField } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await safeBody(request);
  const input = {
    stageSubject: validateField(body.stageSubject),
    idea: validateField(body.idea),
    problem: validateField(body.problem),
    researchObjects: validateField(body.researchObjects),
    practiceBase: validateField(body.practiceBase),
    expectedOutputs: validateField(body.expectedOutputs)
  };

  if (!input.idea || !input.problem) {
    return jsonError("请至少填写初步课题想法和当前遇到的教育教学问题。");
  }

  const prompt = buildGenerateFrameworkPrompt(input);
  const allowCollection = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
  return runPromptStream(prompt.system, prompt.user, "generate-framework", { ...input }, request, allowCollection);
}
