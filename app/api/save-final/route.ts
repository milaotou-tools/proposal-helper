import { NextRequest, NextResponse } from "next/server";
import { saveCollectionEntry } from "@/lib/data-collection";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      polishedDraft?: string;
      expertReview?: string;
      allowCollection?: boolean;
    };

    if (!body.polishedDraft || !body.expertReview) {
      return NextResponse.json({ error: "缺少打磨后全文或预审意见。" }, { status: 400 });
    }

    const consent = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
    const hashedIp = request.headers.get("x-hashed-ip") || "unknown";

    await saveCollectionEntry({
      timestamp: new Date().toISOString(),
      hashedIp,
      action: "final-output",
      input: { draftLength: body.polishedDraft.length },
      outputText: JSON.stringify({
        polishedDraft: body.polishedDraft,
        expertReview: body.expertReview
      }),
      consent
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "保存失败。" }, { status: 500 });
  }
}
