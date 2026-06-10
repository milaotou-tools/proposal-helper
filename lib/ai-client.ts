type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-pro";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function extractText(response: ChatCompletionResponse) {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("尚未配置 DEEPSEEK_API_KEY，请先在 .env.local 中填写 DeepSeek API Key。");
  }

  const baseUrl = normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL);
  const model = process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.35,
        stream: true
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const bodyText = await response.text();
      const detail = `status=${response.status} body=${bodyText.slice(0, 300)}`;
      console.error("[ai-client] DeepSeek stream error", detail);
      let parsed: { error?: { message?: string } } = {};
      try { parsed = JSON.parse(bodyText); } catch { /* not JSON */ }
      throw new Error(parsed.error?.message ? `${parsed.error.message} (${detail})` : `模型接口请求失败，状态码 ${response.status}。`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("响应体不可读");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip unparseable lines
        }
      }
    }
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === "AbortError") {
      throw new Error("模型接口响应超时，请稍后重试或换用更快的模型。");
    }
    throw caught;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createChatCompletion(messages: ChatMessage[]) {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("尚未配置 DEEPSEEK_API_KEY，请先在 .env.local 中填写 DeepSeek API Key。");
  }

  const baseUrl = normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL);
  const model = process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.35,
        stream: false
      }),
      signal: controller.signal
    });

    const bodyText = await response.text();
    const body = bodyText ? (JSON.parse(bodyText) as ChatCompletionResponse) : {};

    if (!response.ok) {
      const detail = `status=${response.status} body=${bodyText.slice(0, 300)}`;
      console.error("[ai-client] DeepSeek error", detail);
      throw new Error(body.error?.message ? `${body.error.message} (${detail})` : `模型接口请求失败，状态码 ${response.status}。`);
    }

    const text = extractText(body);
    if (!text) {
      throw new Error("模型接口没有返回有效文本，请稍后重试或检查模型配置。");
    }

    return text;
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === "AbortError") {
      throw new Error("模型接口响应超时，请稍后重试或换用更快的模型。");
    }

    if (caught instanceof SyntaxError) {
      throw new Error("模型接口返回内容不是有效 JSON，请检查 DEEPSEEK_BASE_URL 是否为兼容接口地址。");
    }

    throw caught;
  } finally {
    clearTimeout(timeout);
  }
}
