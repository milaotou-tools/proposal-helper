# 课题申报小助手 — AI 驱动的教育科研申报书工具

> 面向一线基础教育教师（幼儿园~高中），将零散想法转化为结构化申报书框架，并对已有草稿进行专家模拟预审与逐栏打磨。

---

## ⚠️ 当前分支：`highauto`（公网版）

**`main` 分支为 8083 内测版。本分支部署到 8085 端口，面向公网用户。**

### 两个分支的定位

| 分支 | 定位 | 端口 | 当前状态 |
|------|------|------|---------|
| `main` | 内测版 | 8083 | 线上运行 |
| `highauto` | 公网版 | 8085 | 线上运行 |

### 本分支相比 main 的主要变化

- 公网部署：独立端口 8085，`deploy-highauto.yml` 工作流
- 独立数据目录 `/www/wwwdata/proposal-helper-paid/`
- `components/LandingPage.tsx` — 去个人化
- `DraftSteps.tsx` — 逐栏打磨动态栏目映射，debug 模式多次打磨
- `lib/format-output.ts` — AI 输出后处理：强制缩进、编号层级、禁短横
- `lib/prompts/format-rules.ts` — 共享格式化规则，注入全部 6 个 prompt builder
- `lib/prompts/polish-section.ts` — 打磨提示词微调
- `public/export-demo.html` — 三线表导出样式预览
- `app/globals.css` — 扩展 Codex 柔和色系

### 待办（highauto 分支）

- [ ] 文献综述等栏目输出格式调整
- [ ] HTML 对比画面优化

---

## 📋 项目概述

一线教师做课题申报时面临两难：**完全没有申报书**，不知道从何写起；**已有草稿**，但找不到专家预审、逐栏打磨。

课题申报小助手针对这两个场景提供两条独立路径：

- **路径一：从想法到框架** — 输入学段、研究领域、初步想法，AI 生成包含选题依据、研究目标、内容方法、创新点、预期成果的完整申报书框架。
- **路径二：草稿诊断与打磨** — 粘贴已有草稿，AI 逐栏目诊断问题、给出修改建议，最后以评审人视角进行模拟预审。

全部 AI 推理由 DeepSeek V4 Pro 驱动，按栏目独立生成，支持一键复制、导出和撤销。

---

## 🎯 功能完成情况

### ✅ 双路径完整流程

| # | 路径 | 步骤数 | 核心能力 | 完成度 |
|---|------|--------|---------|--------|
| 1 | 从想法生成框架 | 5 步 | 学段 → 想法 → 研究背景 → 确认 → 生成框架 | ✅ 完整 |
| 2 | 草稿诊断与打磨 | 4 步 | 粘贴草稿 → 诊断 → 逐栏打磨 → 模拟预审 | ✅ 完整 |

### ✅ 各栏目覆盖

| 栏目 | 生成框架 | 诊断问题 | 逐栏打磨 | 模拟预审 |
|------|:---:|:---:|:---:|:---:|
| 选题依据 | ✅ | ✅ | ✅ | ✅ |
| 研究目标 | ✅ | ✅ | ✅ | ✅ |
| 研究内容 | ✅ | ✅ | ✅ | ✅ |
| 研究方法 | ✅ | ✅ | ✅ | ✅ |
| 创新点 | ✅ | ✅ | ✅ | ✅ |
| 预期成果 | ✅ | ✅ | ✅ | ✅ |
| 研究条件 | ✅ | ✅ | ✅ | ✅ |
| 进度安排 | ✅ | ✅ | ✅ | ✅ |
| 参考文献 | ✅ | ✅ | ✅ | ✅ |

### ✅ 辅助功能

- **分学段预设示例**：幼儿园/小学/初中/高中各一套，新用户可快速体验。
- **左右分栏打磨编辑器**：左侧 AI 建议，右侧可编辑原文，点击建议定位对应段落。
- **用户反馈收集**：每步结束可提交赞美/建议，记录学校和留言。
- **匿名数据采集**：勾选同意后按天写入 JSONL，用于后续分析。
- **管理员仪表板**：密码保护，展示使用统计（含 7 天趋势图）和反馈汇总。
- **IP 限流**：AI API 路由每分钟 5 次 / 每天 50 次，加盐哈希保护隐私。

---

## 📁 项目结构

```
proposal-helper-mvp/
├── README.md
├── CLAUDE.md
├── package.json
├── next.config.ts
├── middleware.ts                    # IP 限流中间件
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── deploy.sh                       # 服务器端部署脚本
├── scripts/
│   └── start-dev.cmd               # 本地开发快速启动
├── public/
│   └── export-demo.html            # 三线表导出样式预览
├── .github/workflows/              # CI/CD 工作流
│   ├── deploy-aliyun.yml
│   ├── deploy-via-scp.yml
│   ├── clear-nginx-cache.yml
│   └── fix-nginx-timeout.yml
├── app/
│   ├── layout.tsx                  # 根布局
│   ├── page.tsx                    # 入口页
│   ├── globals.css                 # Tailwind + 全局样式
│   ├── admin/page.tsx              # 管理员仪表板
│   └── api/                        # API 路由
│       ├── generate-framework/     # 生成申报书框架
│       ├── review-draft/           # 诊断草稿问题
│       ├── polish-section/         # 逐栏打磨
│       ├── expert-review/          # 模拟专家预审
│       ├── feedback/               # 用户反馈提交
│       ├── save-final/             # 保存最终结果
│       ├── health/                 # 健康检查
│       └── admin/                  # 管理员数据接口
├── components/
│   ├── AppShell.tsx                # 顶层路由 + 付费墙
│   ├── LandingPage.tsx             # 入职引导页（去个人化）
│   ├── FrameworkSteps.tsx          # 5 步框架向导
│   ├── DraftSteps.tsx              # 4 步草稿向导（动态栏目映射）
│   ├── PolishEditor.tsx            # 左右分栏打磨编辑器
│   ├── StepNavigation.tsx          # 步骤指示器
│   ├── PaymentModal.tsx            # 付费弹窗与解锁码验证
│   ├── DataCollectionCheckbox.tsx  # 数据采集同意勾选
│   └── FeedbackWidget.tsx          # 用户反馈表单
└── lib/
    ├── ai-client.ts                # DeepSeek V4 Pro 调用封装
    ├── data-collection.ts          # 按天 JSONL 数据采集
    ├── feedback-store.ts           # 反馈存储与统计
    ├── rate-limit.ts               # 内存 IP 限流
    ├── route-helpers.ts            # API 共享工具
    ├── use-persisted-state.ts      # localStorage 持久化 hook
    └── prompts/
        ├── load-prompt.ts          # Prompt 模板加载器
        ├── generate-framework.ts   # 框架生成 Prompt
        ├── review-draft.ts         # 草稿诊断 Prompt
        ├── polish-section.ts       # 栏目打磨 Prompt
        ├── expert-review.ts        # 预审 Prompt
        └── data/                   # Prompt 数据文件 (gitignored)
```

---

## 📄 核心文档

### 1. CLAUDE.md — 开发者操作手册

- 项目架构说明（Next.js 15 + Tailwind + DeepSeek）
- 代码改动规则（文案改组件 / Prompt 改 lib / API 改 route）
- 部署流程（阿里云 ECS + BT Panel + PM2 + Nginx）
- 常见坑记录（Nginx 缓存、502、PM2 重复实例、.next 残留）
- SCP 旁路部署 vs Git 拉取部署的选择

**适合：** 接手维护本项目的开发者。

### 2. Prompt 数据文件 (`lib/prompts/data/`)

- 每个 AI 操作的 system prompt 和 user prompt 模板
- 以 `.txt` 格式存储，通过 `{{variable}}` 占位符填充用户输入
- 已从公开仓库中 gitignore，部署时从私有仓库注入

**适合：** 需要调整 AI 输出质量的维护者。

---

## 🔍 设计决策

### 1. 为什么是双路径而不是单一路径

教师在申报课题时的状态差异很大：有的完全没有头绪，有的已有完整草稿。单一路径要么让前者无从下手，要么让后者觉得多余。双路径各自独立、互不干扰，每种状态下都保持 4~5 步的轻量体验。

### 2. 为什么按栏目而不是一次性生成

- 一次性生成全文容易出现 AI 幻觉蔓延（一个栏目的错误影响其他栏目）。
- 逐栏目生成允许用户针对某个不满意栏目单独重新生成，不用全部推倒。
- 打磨编辑器的左右分栏 + 点击定位功能，正是为逐栏目对照修改设计的。

### 3. Prompt 外置且 gitignored

核心方法论和专家规则属于项目 IP。将所有敏感 Prompt 从组件源码提取到 `lib/prompts/data/` 目录，通过 `.gitignore` 排除。部署时由 GitHub Actions 从私有仓库注入，确保公开仓库不暴露核心内容。

### 4. 数据采集的边界

- 勾选同意才写入，不同意则完全不记录。
- 只采集配对型指标（inputSummary + outputSummary），不记录用户身份。
- IP 加盐哈希后用于限流统计，不存储原始 IP。

---

## 🚀 使用指南

### 新手入门

1. 访问 [proposal.we-teach.cn](https://proposal.we-teach.cn)，浏览入职引导页了解两条路径。
2. 如果没有申报书 → 点击"从想法开始"，选择学段后点击"使用示例"快速体验。
3. 如果已有草稿 → 点击"上传已有文稿"，粘贴后开始诊断。

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/milaotou-tools/proposal-helper.git
cd proposal-helper

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 DEEPSEEK_API_KEY 等

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 环境变量

| 变量 | 必填 | 说明 |
|------|:--:|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 |
| `DEEPSEEK_BASE_URL` | - | API 地址，默认 DeepSeek 官方 |
| `DEEPSEEK_MODEL` | - | 模型名，默认 deepseek-chat |
| `OPENAI_API_KEY` | - | 备选供应商 Key |
| `OPENAI_BASE_URL` | - | 备选供应商地址 |
| `OPENAI_MODEL` | - | 备选模型名 |
| `ADMIN_PASSWORD` | ✅ | 管理员页面密码 |
| `COLLECTION_DIR` | - | 采集数据目录，默认 `/www/wwwdata/proposal-helper/collection/` |
| `FEEDBACK_DIR` | - | 反馈数据目录，默认 `/www/wwwdata/proposal-helper/feedback/` |

### 部署

```bash
# 构建
npm run build

# 启动
npm run start
# PM2: pm2 start npm --name "proposal-helper" -- start
```

生产环境部署在阿里云 ECS，通过 BT Panel Nginx 反向代理，PM2 进程管理。详见 `CLAUDE.md` 部署章节。

---

## 📊 技术选型

| 层级 | 选型 | 原因 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 服务端组件 + API Routes 一体，无需独立后端 |
| 语言 | TypeScript 5.8 | 类型安全，API 边界的输入输出可校验 |
| 样式 | Tailwind CSS 3.4 | 零运行时，设计体系通过 `tailwind.config.ts` 统一 |
| AI | DeepSeek V4 Pro | 中文文本质量最优，性价比高 |
| 部署 | 阿里云 ECS + BT Panel + Nginx + PM2 | 成本可控，HTTPS 和反向代理开箱即用 |
| 数据 | JSONL 文件 | 无需数据库，单文件按天写入，运维零成本 |
| 限流 | 内存 Map + SHA-256 哈希 | 不依赖 Redis，隐私友好 |

---

## ⚠️ 免责声明

**仅供教育科研辅助用途。** 本工具生成的申报书框架、诊断意见和打磨建议均为 AI 自动生成，不代表任何评审专家或教育行政部门的立场。提交申报书前，请教师根据实际情况进行审阅和修改。

**不保证中标结果。** 课题申报的中标与否受评审专家、申报方向、名额分配等多因素影响，本工具仅提供文案层面的辅助。

**数据安全。** 用户输入内容不绑定个人信息，数据采集需用户主动勾选同意。服务器不存储用户身份数据。

---

## 📝 许可证

MIT License.

---

## 🙏 致谢

- 项目灵感来自一线教师群体在课题申报中的实际痛点。
- DeepSeek 提供高质量中文 LLM 推理能力。
- 阿里云提供稳定的部署基础设施。

---

## 📅 更新日志

### 2026-06-11 (`highauto` 分支)

- [x] 独立部署到 8085 端口（`deploy-highauto.yml`）
- [x] 共享格式化规则注入全部 prompt builder（`format-rules.ts`）
- [x] AI 输出前端后处理：强制首行缩进、编号层级、禁短横（`format-output.ts`）
- [x] 修复 expert-review prompt 被 secrets 仓库旧版覆盖的问题
- [x] 修复逐栏打磨"识别到的原文"不显示的问题
- [x] 手机端保存按钮文字缩短为"保存"
- [x] 打磨步骤按钮手机端纵向排列
- [x] 诊断编号改为中文数字（一、二、三、）
- [x] 页面底色改为 `#FAF9F6`，不再露暖黄肤色
- [x] 临时解除频率限制用于调试，已恢复

### 2026-06-09 (`pay` → `highauto` 分支)

- [x] 付费墙：新增 `PaymentModal` 解锁码验证，`AppShell` 集成未解锁拦截
- [x] 去个人化：`LandingPage` 精简，移除个人信息
- [x] 逐栏打磨动态栏目映射，debug 模式支持多次打磨
- [x] 打磨提示词微调：文献综述等栏目格式优化
- [x] UI 色系扩展：Codex 柔和风格
- [x] 新增 `export-demo.html` 三线表导出预览
- [x] 新增 `scripts/start-dev.cmd` 本地启动脚本
- [x] 修复 `X-Accel-Buffering` 头防止 Nginx 响应缓冲
- [x] 修复流式输出首 chunk 前 loading 文字不旋转
- [x] 删除 `/paid` 原型页，付费逻辑整合到主流程

### 2026-06-07

- [x] 提取核心 Prompt 到 gitignored 数据文件，兜底为通用 Prompt
- [x] 新增 `Deploy via SCP (bypass git)` 工作流，解决服务器无法连接 GitHub 的问题
- [x] AI API 路由统一限流（每分钟 5 次 / 每天 50 次）
- [x] 健康检查接口去敏感信息，加限流保护

### 2026-06-06

- [x] 将"无明确想法路线"的使用反馈组件移入申报书框架结果卡片
- [x] 反馈区与"已有想法/草稿路线"结果卡片结构保持一致
- [x] 管理员仪表板完成：使用统计 + 反馈汇总

### 2026-06-05 及更早

- [x] 双路径完整流程上线
- [x] 左右分栏打磨编辑器
- [x] 分学段预设示例
- [x] 模拟专家预审功能
- [x] 用户反馈系统

---

*本文档于 2026 年 6 月 11 日更新。*
