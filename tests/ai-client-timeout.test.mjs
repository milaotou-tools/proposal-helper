import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(testDirectory, "../lib/ai-client.ts");

test("AI 请求设有五分钟总上限，流式数据会重置静默计时", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /const MAX_REQUEST_DURATION_MS = 300000;/);
  assert.match(source, /const STREAM_IDLE_TIMEOUT_MS = 120000;/);
  assert.match(
    source,
    /const \{ done, value \} = await reader\.read\(\);\s+if \(done\) break;\s+resetIdleTimeout\(\);/
  );
});
