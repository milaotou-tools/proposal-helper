import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "lib/prompts/data");

function loadPromptFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(DATA_DIR, filename), "utf-8").trim();
  } catch {
    return "";
  }
}

export function loadSystemPrompt(name: string, fallback: string): string {
  const content = loadPromptFile(`${name}-system.txt`);
  return content || fallback;
}

export function loadUserTemplate(name: string, fallback: string): string {
  const content = loadPromptFile(`${name}-user.txt`);
  return content || fallback;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}
