import { buildGenerateFrameworkPrompt } from "@/lib/prompts/generate-framework";
import { jsonError, runPromptWithCollection, validateField } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
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
  return runPromptWithCollection(prompt.system, prompt.user, "generate-framework", { idea: input.idea, problem: input.problem, stageSubject: input.stageSubject }, request);
}
