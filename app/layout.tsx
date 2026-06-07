import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "课题申报小助手",
  description: "帮助一线教师（幼儿园、小学、初中、高中）把课题想法整理成申报书框架，并对草稿进行模拟专家预审与逐栏打磨。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col text-slate-900">
        <header className="shell-band border-b py-2.5 text-center text-[11px] text-slate-500/80">
          AI 引擎 · DeepSeek V4 Pro
        </header>
        <div className="flex-1">{children}</div>
        <footer className="py-4 text-center text-xs text-slate-500/75">
          课题申报小助手 · 由 娄仲达 开发
        </footer>
      </body>
    </html>
  );
}
