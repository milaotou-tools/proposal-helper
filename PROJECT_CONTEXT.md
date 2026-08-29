# proposal-helper-mvp

## 项目定位
- Next.js 15 App Router 项目，面向课题申报辅助场景。
- 入口页面通过 `app/page.tsx` 进入 `components/AppShell.tsx`。
- 当前主流程包括两个入口：从想法生成申报框架，以及对草稿进行诊断/打磨/预审。

## 技术栈
- Next.js + React + TypeScript
- Tailwind CSS
- 本地开发命令：`npm run dev`
- 构建命令：`npm run build`

## 当前约束
- **唯一正式本机工作目录：** `D:\AIProjects\01-active\proposal-helper`，Git 分支必须为 `highauto`。
- 桌面上的 `proposal-helper` 和 `proposal-helper-mvp` 仅为历史草稿，不是正式更新来源，保留但不再使用。
- 不修改用户明确要求保留的 8083 内测版本。
- 视觉方向：浅色、柔和、通透、干净、轻微渐变和轻微光晕感。

## 版本管理
- `highauto` 是唯一正式生产线；更新前运行 `git pull origin highauto`。
- `main` 为停用的内测遗留线，不得部署到正式域名。
- `mvp2-stable-style` 是停用的 2026-06-05 旧快照；各版本状态详见根目录 `VERSION_STATUS.md`。

## 已验证的部署映射（2026-08-29）
| 项目 | 8085（当前正式公网版） | 8083（保留内测稳定版） |
|---|---|---|
| 用途 | 当前对外使用、继续开发和发布的版本 | 仅作稳定对照，不再更新 |
| 访问入口 | `https://proposal.we-teach.cn`（已实际验证） | `http://116.62.220.255:8083` |
| 公网 → 本机 | `8085` → `3007` | `8083` → `3005` |
| PM2 进程 | `proposal-helper-paid`（名称为历史遗留） | `proposal-helper` |
| Git 分支 | `highauto` | `main` |
| 数据目录 | `/www/wwwdata/proposal-helper-paid/` | `/www/wwwdata/proposal-helper/` |
| 唯一发布流程 | `.github/workflows/deploy-highauto.yml` | 旧版 `deploy-via-scp.yml` / `deploy-aliyun.yml`，当前禁止触发 |

- 修改 `highauto` 后，只能发布到 8085；**严禁**使用会重启、替换或修改 8083→3005 的工作流。
- 8085 的 Nginx `proxy_read_timeout` 为 330 秒，与本项目 5 分钟 AI 请求上限配套；8083 的原有配置不作为本次维护对象。

## 已知结构
- `components/AppShell.tsx`：页面入口路由
- `components/LandingPage.tsx`：起始选择页
- `components/FrameworkSteps.tsx`：从想法生成框架
- `components/DraftSteps.tsx`：草稿诊断、打磨、预审
- `components/FeedbackWidget.tsx`：反馈组件
- `components/DataCollectionCheckbox.tsx`：匿名收集开关
- `app/globals.css`：全局背景、色板和基础样式

