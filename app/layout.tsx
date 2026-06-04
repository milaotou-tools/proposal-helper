import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "课题申报小助手",
  description: "帮助小学教师把课题想法整理成申报书框架，并对草稿进行模拟专家预审与逐栏打磨。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
