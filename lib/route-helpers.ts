import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/ai-client";
import { saveCollectionEntry } from "@/lib/data-collection";

const MAX_DRAFT_LENGTH = 50000;
const MAX_FIELD_LENGTH = 5000;

export function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateDraft(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length > MAX_DRAFT_LENGTH) {
    throw new InputTooLargeError(`输入内容超过最大长度限制 ${MAX_DRAFT_LENGTH} 字符。`);
  }
  return trimmed;
}

export function validateField(value: unknown): string {
  const trimmed = stringField(value);
  if (trimmed.length > MAX_FIELD_LENGTH) {
    throw new InputTooLargeError(`输入内容超过最大长度限制 ${MAX_FIELD_LENGTH} 字符。`);
  }
  return trimmed;
}

export class InputTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputTooLargeError";
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function runPrompt(system: string, user: string) {
  try {
    const text = await createChatCompletion([
      { role: "system", content: system },
      { role: "user", content: user }
    ]);

    return NextResponse.json({ text });
  } catch (caught) {
    if (caught instanceof InputTooLargeError) {
      return NextResponse.json({ error: caught.message }, { status: 413 });
    }
    const message = caught instanceof Error ? caught.message : "生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function runPromptWithCollection(
  system: string,
  user: string,
  action: string,
  inputSummary: Record<string, unknown>,
  request: Request,
  allowCollection?: boolean
) {
  try {
    const hashedIp = request.headers.get("x-hashed-ip") || "unknown";
    const consent = typeof allowCollection === "boolean" ? allowCollection : true;

    const text = await createChatCompletion([
      { role: "system", content: system },
      { role: "user", content: user }
    ]);

    saveCollectionEntry({
      timestamp: new Date().toISOString(),
      hashedIp,
      action,
      input: inputSummary,
      outputText: text,
      consent
    }).catch(() => {
      // silently ignore collection errors
    });

    return NextResponse.json({ text });
  } catch (caught) {
    if (caught instanceof InputTooLargeError) {
      return NextResponse.json({ error: caught.message }, { status: 413 });
    }
    const message = caught instanceof Error ? caught.message : "生成失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
