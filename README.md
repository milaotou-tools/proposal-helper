# 课题申报小助手 — AI 驱动的教育科研申报书工具

> 面向一线基础教育教师（幼儿园~高中），将零散想法转化为结构化申报书框架，并对已有草稿进行专家模拟预审与逐栏打磨。

---

## ⚠️ 当前分支：`main`（内测版）

**`highauto` 分支为 8085 公网版，本分支部署到 8083 端口，面向内测用户。**

### 两个分支的定位

| 分支 | 定位 | 端口 | 当前状态 |
|------|------|------|---------|
| `main` | 内测版 | 8083 | 线上运行 |
| `highauto` | 公网版 | 8085 | 线上运行 |

### 本分支特点

- 8083 端口，PM2 进程 `proposal-helper`
- 暖色系页面背景（`#f6f4ef`），保留个人信息
- 6 步流程引导页（含"后续由教师完善"的 4-6 步）
- 逐栏打磨覆盖 9 个核心栏目，非 18 栏全量
- 无格式化后处理、无选题指导、无进度保存/恢复
- 日限额 50 次

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

### ❌ 本分支不包含（与 `highauto` 的差异）

- 选题指导（TopicGuidance）
- 每日配额查询
- 进度保存与恢复（6 位保存码）
- AI 输出格式化后处理（format-output.ts）
- 共享格式化规则（format-rules.ts）
- 逐栏打磨 18 栏全量覆盖（本分支 9 栏）
- 成果建议、个人主页生成
- 本地 IP 不限流（本分支所有 IP 均受限制）

---

## 📁 项目结构

```
proposal-helper-mvp/
├── README.md
├── CLAUDE.md
├── package.json
├── next.config.ts
├── middleware.ts                    # IP 限流中间件（无本地豁免）
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore                       # 排除 node_modules, .next, lib/prompts/data/ 等
├── .github/workflows/              # CI/CD 工作流
│   ├── deploy-aliyun.yml           # Git 拉取部署
│   ├── deploy-via-scp.yml          # SCP 旁路部署
│   ├── deploy-highauto.yml         # 8085 分支部署（main 不使用）
│   ├── fix-8085-nginx.yml          # 8085 Nginx 修复
│   ├── clear-nginx-cache.yml       # 清 Nginx 缓存
│   ├── fix-nginx-timeout.yml       # 修复 Nginx 超时配置
│   ├── view-data.yml               # 查看采集数据
│   └── view-stats.yml              # 查看使用统计
├── app/
│   ├── layout.tsx                  # 根布局
│   ├── page.tsx                    # 入口页（加载 AppShell）
│   ├── globals.css                 # Tailwind + 暖色系全局样式
│   ├── admin/page.tsx              # 管理员仪表板
│   └── api/                        # API 路由
│       ├── generate-framework/     # 生成申报书框架
│       ├── review-draft/           # 诊断草稿问题
│       ├── polish-section/         # 逐栏打磨
│       ├── expert-review/          # 模拟专家预审
│       ├── feedback/               # 用户反馈提交
│       ├── save-final/             # 保存最终结果
│       ├── health/                 # 健康检查
│       └── admin/
│           ├── feedback/           # 反馈数据接口
│           └── stats/              # 使用统计接口
├── components/
│   ├── AppShell.tsx                # 顶层路由（仅三页切换）
│   ├── LandingPage.tsx             # 6 步引导页（含个人信息）
│   ├── FrameworkSteps.tsx          # 5 步框架向导
│   ├── DraftSteps.tsx              # 4 步草稿向导（9 栏打磨）
│   ├── PolishEditor.tsx            # 左右分栏打磨编辑器
│   ├── StepNavigation.tsx          # 步骤指示器
│   ├── DataCollectionCheckbox.tsx  # 数据采集同意勾选
│   ├── FeedbackWidget.tsx          # 用户反馈表单
│   └── ProposalHelperApp.tsx       # 旧版组件（未使用）
└── lib/
    ├── ai-client.ts                # DeepSeek V4 Pro API 调用封装
    ├── data-collection.ts          # 按天 JSONL 数据采集
    ├── feedback-store.ts           # 反馈存储与统计
    ├── rate-limit.ts               # 内存 IP 限流（5/min, 50/day）
    ├── route-helpers.ts            # API 共享工具
    ├── use-persisted-state.ts      # localStorage 持久化 hook
    ├── utils.ts                    # 剪贴板复制、Markdown 剥离、流式请求
    └── prompts/
        ├── load-prompt.ts          # Prompt 模板加载器（含兜底）
        ├── generate-framework.ts   # 框架生成 Prompt
        ├── review-draft.ts         # 草稿诊断 Prompt
        ├── polish-section.ts       # 栏目打磨 Prompt
        ├── expert-review.ts        # 预审 Prompt
        └── data/                   # Prompt 文本模板（gitignored）
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
- TypeScript builder 文件中包含兜底 prompt，在 data 文件缺失时自动降级

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

1. 访问内测地址，浏览 6 步流程引导页了解整体工作流。
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

生产环境部署在阿里云 ECS，通过 BT Panel Nginx 反向代理（8083 → 3005），PM2 进程管理。详见 `CLAUDE.md` 部署章节。

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

### TODO

- [ ] 增加更多学科垂直领域的预设示例
- [ ] 申报书历史记录与版本对比
- [ ] 移动端适配优化

---

*本文档于 2026 年 6 月 11 日更新。*
