import { buildTopicGuidancePrompt } from "@/lib/prompts/topic-guidance";
import { jsonError, runPromptStream, validateField } from "@/lib/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const discipline = validateField(body.discipline);
  const gradeSegment = validateField(body.gradeSegment);
  const situation = validateField(body.situation);
  const researchType = validateField(body.researchType);

  if (!discipline || !gradeSegment) {
    return jsonError("请至少选择学科和年级段。");
  }

  const prompt = buildTopicGuidancePrompt({ discipline, gradeSegment, situation, researchType });
  return runPromptStream(
    prompt.system,
    prompt.user,
    "topic-guidance",
    { discipline, gradeSegment, situation, researchType },
    request,
    true,
  );
}
