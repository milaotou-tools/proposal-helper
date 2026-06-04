import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/lib/feedback-store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      type?: string;
      school?: string;
      message?: string;
    };

    if (!body.type || !["praise", "suggestion"].includes(body.type)) {
      return NextResponse.json({ error: "请选择反馈类型。" }, { status: 400 });
    }

    await saveFeedback({
      type: body.type as "praise" | "suggestion",
      school: typeof body.school === "string" ? body.school.trim().slice(0, 100) : undefined,
      message: typeof body.message === "string" ? body.message.trim().slice(0, 2000) : undefined
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "反馈提交失败。" }, { status: 500 });
  }
}
