"use client";

import { useState } from "react";
import { PAID_PRICE } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const UNLOCK_CODE = "keti149";

export function PaymentModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"plans" | "payment" | "done">("plans");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  if (!isOpen) return null;

  function handleVerifyCode() {
    if (code.trim() === UNLOCK_CODE) {
      setCodeError("");
      setStep("done");
    } else {
      setCodeError("解锁码不正确，请检查后重试。");
    }
  }

  function handleDone() {
    setStep("plans");
    setCode("");
    setCodeError("");
    onSuccess();
  }

  function handleClose() {
    setStep("plans");
    setCode("");
    setCodeError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      {/* Plans comparison step */}
      {step === "plans" && (
        <div className="relative w-full max-w-2xl rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-[#F3F2EF] hover:text-[#141413]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>

          {/* Title */}
          <p className="text-center text-lg font-extrabold tracking-[-0.01em] text-[#141413]">
            升级套餐
          </p>

          {/* Two cards */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* Free card */}
            <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-extrabold text-[#141413]">免费版</p>
              <p className="mt-1 text-2xl font-extrabold text-[#141413]">免费</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">轻巧使用</p>

              <button
                type="button"
                disabled
                className="mt-3 h-10 w-full rounded-full border border-[#E8E6E1] bg-white text-sm font-bold text-[#9CA3AF]"
              >
                当前套餐
              </button>

              <ul className="mt-5 space-y-3 border-t border-[#E8E6E1] pt-4">
                <li className="flex items-start gap-2.5 text-sm leading-6 text-[#4B5563]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
                    <polyline points="3 8 6.5 11.5 13 5" />
                  </svg>
                  打磨 3 个栏目
                </li>
                <li className="flex items-start gap-2.5 text-sm leading-6 text-[#4B5563]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
                    <polyline points="3 8 6.5 11.5 13 5" />
                  </svg>
                  预审 1 次
                </li>
              </ul>
            </div>

            {/* Upgrade card */}
            <div className="rounded-2xl border border-[#E8E6E1] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)]" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(250,249,246,0.9) 0%, rgba(255,255,255,1) 60%)" }}>
              <p className="text-sm font-extrabold text-[#141413]">升级版</p>
              <p className="mt-1 text-2xl font-extrabold text-[#141413]">¥{PAID_PRICE}</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">解锁全面体验</p>

              <button
                type="button"
                onClick={() => setStep("payment")}
                className="mt-3 h-10 w-full rounded-full bg-[#141413] text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
              >
                升级至Plus
              </button>

              <ul className="mt-5 space-y-3 border-t border-[#E8E6E1] pt-4">
                <li className="flex items-start gap-2.5 text-sm leading-6 text-[#141413]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#141413" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
                    <polyline points="3 8 6.5 11.5 13 5" />
                  </svg>
                  支持多轮打磨迭代
                </li>
                <li className="flex items-start gap-2.5 text-sm leading-6 text-[#141413]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#141413" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
                    <polyline points="3 8 6.5 11.5 13 5" />
                  </svg>
                  打磨、预审不限量
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Payment step */}
      {step === "payment" && (
        <div className="w-full max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
          <p className="text-lg font-extrabold tracking-[-0.01em] text-[#141413]">
            完成付款
          </p>

          <div className="mt-4 rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] p-4 text-center">
            <p className="text-sm text-[#6B7280]">单一价格</p>
            <p className="mt-1 text-3xl font-extrabold text-[#141413]">¥{PAID_PRICE}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">一次付费，永久解锁</p>
          </div>

          {/* QR Code placeholder */}
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-[#E8E6E1] bg-[#FAF9F6] p-5">
            <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-center text-xs leading-5 text-[#9CA3AF]">
              支付宝收款码
              <br />
              （管理员上传后替换）
            </div>
            <p className="mt-3 text-xs leading-5 text-[#6B7280]">
              请使用支付宝扫描二维码付款
            </p>
            <p className="mt-1 text-xs leading-5 text-[#9CA3AF]">
              付款后请联系管理员获取解锁码
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerifyCode();
              }}
              placeholder="请输入解锁码"
              autoComplete="off"
              className="h-11 w-full rounded-md border border-[#E8E6E1] bg-white px-3 text-sm text-[#141413] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#141413]/10"
            />
            {codeError && (
              <p className="text-xs text-[#DC2626]">{codeError}</p>
            )}
            <button
              type="button"
              onClick={handleVerifyCode}
              className="h-11 w-full rounded-md bg-[#141413] text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
            >
              确认解锁
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("plans");
                setCode("");
                setCodeError("");
              }}
              className="h-10 w-full rounded-md border border-[#E8E6E1] bg-white text-sm font-bold text-[#6B7280] transition hover:bg-[#F3F2EF]"
            >
              返回
            </button>
          </div>
        </div>
      )}

      {/* Done step */}
      {step === "done" && (
        <div className="w-full max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#141413]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 13 10 17 19 7" />
            </svg>
          </div>

          <p className="mt-4 text-lg font-extrabold tracking-[-0.01em] text-[#141413]">
            解锁成功！
          </p>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            现在可以打磨全部栏目、多次预审，并在终审后返回继续修改。
          </p>

          <button
            type="button"
            onClick={handleDone}
            className="mt-5 h-11 w-full rounded-md bg-[#141413] text-sm font-extrabold text-white transition hover:bg-[#2A2A28]"
          >
            开始使用
          </button>
        </div>
      )}
    </div>
  );
}
