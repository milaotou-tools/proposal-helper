import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "课题申报小助手",
  description: "帮助一线教师（幼儿园、小学、初中、高中）把课题想法整理成申报书框架，并对草稿进行模拟专家预审与逐栏打磨。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
