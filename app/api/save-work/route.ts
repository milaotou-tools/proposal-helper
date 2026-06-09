import { NextResponse } from "next/server";
import { saveWork } from "@/lib/save-store";
import { validateField, validateDraft, jsonError } from "@/lib/route-helpers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = body.type as string;

    if (!type || !["framework", "draft"].includes(type)) {
      return jsonError("缺少 type 字段（framework 或 draft）。");
    }

    const snapshot: Record<string, unknown> = { type };

    if (type === "framework") {
      snapshot.frameworkForm = {
        stage: validateField(body.stage),
        stageSubject: validateField(body.stageSubject),
        idea: validateField(body.idea),
        problem: validateField(body.problem),
        researchObjects: validateField(body.researchObjects),
        practiceBase: validateField(body.practiceBase),
        expectedOutputs: validateField(body.expectedOutputs),
      };
      snapshot.frameworkResult = validateDraft(body.frameworkResult);
      snapshot.frameworkCurrentStep =
        typeof body.frameworkCurrentStep === "number"
          ? Math.max(0, Math.min(4, body.frameworkCurrentStep))
          : 0;
    } else {
      snapshot.draft = validateDraft(body.draft);
      snapshot.polishedDraft = validateDraft(body.polishedDraft);
      snapshot.polishCache = typeof body.polishCache === "object" ? body.polishCache : {};
      snapshot.detectedSections = Array.isArray(body.detectedSections) ? body.detectedSections : [];
      snapshot.draftCurrentStep = typeof body.draftCurrentStep === "number" ? body.draftCurrentStep : 0;
      snapshot.resultTitle = validateField(body.resultTitle);
      snapshot.resultText = validateDraft(body.resultText);
    }

    const code = await saveWork(snapshot as Parameters<typeof saveWork>[0]);
    return NextResponse.json({ ok: true, code });
  } catch (caught) {
    if (caught instanceof Error && caught.name === "InputTooLargeError") {
      return NextResponse.json({ error: caught.message }, { status: 413 });
    }
    return NextResponse.json({ error: "保存失败，请稍后重试。" }, { status: 500 });
  }
}
