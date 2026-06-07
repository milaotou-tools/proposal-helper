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

## 已知结构
- `components/AppShell.tsx`：页面入口路由
- `components/LandingPage.tsx`：起始选择页
- `components/FrameworkSteps.tsx`：从想法生成框架
- `components/DraftSteps.tsx`：草稿诊断、打磨、预审
- `components/FeedbackWidget.tsx`：反馈组件
- `components/DataCollectionCheckbox.tsx`：匿名收集开关
- `app/globals.css`：全局背景、色板和基础样式

