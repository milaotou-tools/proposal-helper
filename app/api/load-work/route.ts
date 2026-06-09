import { NextResponse } from "next/server";
import { loadWork } from "@/lib/save-store";
import { jsonError } from "@/lib/route-helpers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = (body.code || "").trim().toUpperCase();

    if (!code || code.length !== 6) {
      return jsonError("请输入有效的 6 位保存码。");
    }

    const snapshot = await loadWork(code);

    if (!snapshot) {
      return jsonError("未找到该保存码对应的记录，或记录已过期（超过30天）。");
    }

    return NextResponse.json({ ok: true, snapshot });
  } catch {
    return NextResponse.json({ error: "读取失败，请稍后重试。" }, { status: 500 });
  }
}
