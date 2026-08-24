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
- 当前只处理本地仓库 `C:\Users\admin\Desktop\proposal-helper-mvp`。
- 不修改用户明确要求保留的 8083 线上版本。
- 视觉方向：浅色、柔和、通透、干净、轻微渐变和轻微光晕感。

## 2026-08-24 生产维护例外
- 达达明确授权修复 8083 线上版本的 504；该单次生产故障修复覆盖此前“不修改 8083”的旧限制。
- 入口仍为 8083 → 3005。AI 流式接口需要 Nginx 的连接、读取和发送超时均为 180 秒。
- 维护工作流必须匹配含 `proxy_pass http://127.0.0.1:3005` 的真实代理配置，不能仅按 8083 端口匹配站点外壳配置。

## 已知结构
- `components/AppShell.tsx`：页面入口路由
- `components/LandingPage.tsx`：起始选择页
- `components/FrameworkSteps.tsx`：从想法生成框架
- `components/DraftSteps.tsx`：草稿诊断、打磨、预审
- `components/FeedbackWidget.tsx`：反馈组件
- `components/DataCollectionCheckbox.tsx`：匿名收集开关
- `app/globals.css`：全局背景、色板和基础样式

