import { buildSuggestOutputsPrompt } from "@/lib/prompts/suggest-outputs";
import { jsonError, runPromptStream, validateField } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const discipline = validateField(body.discipline);
  const gradeSegment = validateField(body.gradeSegment);
  const idea = validateField(body.idea);
  const problem = validateField(body.problem);
  const researchObjects = validateField(body.researchObjects);
  const practiceBase = validateField(body.practiceBase);

  if (!discipline || !gradeSegment) {
    return jsonError("缺少学科或年级段信息。");
  }

  const prompt = buildSuggestOutputsPrompt({
    discipline,
    gradeSegment,
    idea,
    problem,
    researchObjects,
    practiceBase,
  });
  return runPromptStream(
    prompt.system,
    prompt.user,
    "suggest-outputs",
    { discipline, gradeSegment, idea, problem, researchObjects, practiceBase },
    request,
    true,
  );
}
