import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "课题申报小助手",
  description: "帮助一线教师（幼儿园、小学、初中、高中）把课题想法整理成申报书框架，并对草稿进行模拟专家预审与逐栏打磨。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col text-slate-900 antialiased">
        <header className="shell-band border-b border-white/70">
          <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2.5 sm:px-6 lg:px-8">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-slate-500">
              AI 引擎 · DeepSeek V4 Pro
            </span>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="pb-4 pt-5">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500/75 sm:px-6 lg:px-8">
            课题申报小助手
          </div>
        </footer>
      </body>
    </html>
  );
}
