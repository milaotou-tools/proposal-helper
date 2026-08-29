# Framework Generation Timeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将模型请求总上限调整为五分钟，并让流式请求在持续有模型数据时保持连接，防止框架生成被误判为超时。

**Architecture:** 保持现有 `AbortController` 和流式传输结构。流式与非流式请求共享 300,000 毫秒的最长总时限；流式请求另有 120,000 毫秒静默计时，并在收到每个传输数据块后重置。用 Node 内置测试读取实际源文件，锁定两个时限和重置位置。

**Tech Stack:** Next.js 15、TypeScript、Node.js 内置 `node:test`

## Global Constraints

- 仅修改本地副本，不部署、不改动 8083。
- 保持 `deepseek-v4-pro`、思考模式、提示词和页面逻辑不变。
- 两个 AI 请求函数必须使用完全相同的 300,000 毫秒最长总时限。
- 流式读取只要持续收到模型数据，就不得因 120 秒静默计时而中止。

---

### Task 1: 为 AI 请求增加五分钟总时限与流式活跃检测

**Files:**
- Create: `tests/ai-client-timeout.test.mjs`
- Modify: `lib/ai-client.ts:18,50-52,85,112,126`

**Interfaces:**
- Consumes: `lib/ai-client.ts` 中两个 `AbortController` 的 `setTimeout` 调用，以及流式读取器的每次 `reader.read()` 返回。
- Produces: 两类请求均最多持续 300,000 毫秒；流式请求每收到数据块即重新获得 120,000 毫秒静默窗口。

- [ ] **Step 1: 写入会失败的回归测试**

```js
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
```

- [ ] **Step 2: 运行测试，确认它因现有两分钟配置而失败**

Run: `node --test tests/ai-client-timeout.test.mjs`

Expected: FAIL；因为 `MAX_REQUEST_DURATION_MS`、`STREAM_IDLE_TIMEOUT_MS` 和 `resetIdleTimeout()` 尚不存在。

- [ ] **Step 3: 实现总时限与流式静默时限**

在 `lib/ai-client.ts` 的模块顶层声明：

```ts
const MAX_REQUEST_DURATION_MS = 300000;
const STREAM_IDLE_TIMEOUT_MS = 120000;
```

在 `streamChatCompletion` 中，紧接 `const controller = new AbortController();` 后声明并启动静默计时：

```ts
let idleTimeout: ReturnType<typeof setTimeout> | null = null;
const resetIdleTimeout = () => {
  if (idleTimeout) clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => controller.abort(), STREAM_IDLE_TIMEOUT_MS);
};
const timeout = setTimeout(() => controller.abort(), MAX_REQUEST_DURATION_MS);
resetIdleTimeout();
```

在流读取循环中，紧接 `if (done) break;` 后加入：

```ts
resetIdleTimeout();
```

在该函数的 `finally` 中追加：

```ts
if (idleTimeout) clearTimeout(idleTimeout);
```

在 `createChatCompletion` 中，仅将原有 120 秒计时改为：

```ts
const timeout = setTimeout(() => controller.abort(), MAX_REQUEST_DURATION_MS);
```

不得改动模型、请求体、提示词、流数据解析、页面或自动重试逻辑。

- [ ] **Step 4: 验证测试和 TypeScript**

Run: `node --test tests/ai-client-timeout.test.mjs`

Expected: PASS；一个测试通过。

Run: `npx tsc --noEmit`

Expected: exit code 0。

- [ ] **Step 5: 核对改动范围并提交**

Run: `git diff --check` and `git diff -- lib/ai-client.ts tests/ai-client-timeout.test.mjs`

Expected: 仅有超时常量、流式静默计时、一个回归测试发生变化，无空白错误。

```bash
git add lib/ai-client.ts tests/ai-client-timeout.test.mjs
git commit -m "fix: extend AI request timeout to five minutes"
```
