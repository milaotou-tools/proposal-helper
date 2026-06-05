import { NextRequest, NextResponse } from "next/server";
import { saveCollectionEntry } from "@/lib/data-collection";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      originalDraft?: string;
      polishedDraft?: string;
      expertReview?: string;
      allowCollection?: boolean;
    };

    if (!body.polishedDraft || !body.expertReview) {
      return NextResponse.json({ error: "缺少打磨后全文或预审意见。" }, { status: 400 });
    }

    const consent = typeof body.allowCollection === "boolean" ? body.allowCollection : true;
    const hashedIp = request.headers.get("x-hashed-ip") || "unknown";
    const sessionId = body.sessionId || "unknown";
    const timestamp = new Date().toISOString();

    // Save original draft
    if (body.originalDraft) {
      await saveCollectionEntry({
        timestamp,
        hashedIp,
        action: "original-draft",
        input: { sessionId, draftLength: body.originalDraft.length },
        outputText: body.originalDraft,
        consent
      }).catch(() => {});
    }

    // Save final output (polished draft + expert review, linked by sessionId)
    await saveCollectionEntry({
      timestamp,
      hashedIp,
      action: "final-output",
      input: {
        sessionId,
        originalDraftLength: body.originalDraft?.length || 0,
        polishedDraftLength: body.polishedDraft.length
      },
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
