"use client";

import { useState, useRef, useCallback } from "react";

type Props = {
  section: string;
  originalText: string;
  onUpdate: (text: string) => void;
  resultText: string;
  isLoading: boolean;
  onStartPolish: () => void;
};

function extractSearchPhrase(paragraph: string): string {
  // Try Chinese quotes first
  const quoteMatch = paragraph.match(/[“”]([^“”]{4,30})[“”]/);
  if (quoteMatch) return quoteMatch[1];
  // " " quotes
  const dblQuote = paragraph.match(/"([^"]{4,30})"/);
  if (dblQuote) return dblQuote[1];
  // Take the longest Chinese sentence
  const sentences = paragraph.split(/[。；，\n]/);
  let longest = "";
  for (const s of sentences) {
    const cleaned = s.replace(/[-\*\d\.\s、：:]/g, "").trim();
    if (cleaned.length > longest.length) longest = cleaned;
  }
  return longest.slice(0, 30);
}

export function PolishEditor({ section, originalText, onUpdate, resultText, isLoading, onStartPolish }: Props) {
  const [highlighting, setHighlighting] = useState(false);
  const [highlightText, setHighlightText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleParagraphClick = useCallback((paragraph: string) => {
    const phrase = extractSearchPhrase(paragraph);
    if (!phrase || phrase.length < 2) return;

    const ta = textareaRef.current;
    if (!ta) return;

    const idx = ta.value.indexOf(phrase);
    if (idx === -1) return;

    ta.focus();
    ta.setSelectionRange(idx, idx + phrase.length);

    // Scroll the selected text into view
    const lineHeight = parseInt(getComputedStyle(ta).lineHeight) || 24;
    const linesBefore = ta.value.slice(0, idx).split("\n").length;
    ta.scrollTop = Math.max(0, (linesBefore - 2) * lineHeight);

    setHighlightText(phrase);
    setHighlighting(true);
    setTimeout(() => setHighlighting(false), 2000);
  }, []);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-0">
      {/* 左侧：AI 打磨建议 */}
      <div className="flex-1 rounded-md border border-[#E8E6E1] bg-white p-4 md:rounded-r-none md:border-r-0">
        <h3 className="mb-3 text-sm font-bold text-[#141413]">打磨建议：{section}</h3>

        {!resultText && !isLoading && (
          <div className="py-12 text-center text-sm text-[#9CA3AF]">
            选择栏目后点击"开始打磨"查看 AI 建议
          </div>
        )}

        {isLoading && (
          <div className="py-12 text-center text-sm text-[#6B7280]">
            AI 正在打磨中，请稍候...
          </div>
        )}

        {resultText && !isLoading && (
          <div className="space-y-2">
            {stripMarkdown(resultText).split("\n\n").filter(Boolean).map((block, i) => (
              <div
                key={i}
                onClick={() => handleParagraphClick(block)}
                className="cursor-pointer rounded-md border border-[#E8E6E1] bg-[#FAF9F6] p-3 text-sm leading-7 text-[#141413] transition hover:border-[#D1D5DB] hover:bg-[#F3F2EF]"
              >
                {block}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：原文编辑器 */}
      <div className="flex-1 rounded-md border border-[#E8E6E1] bg-white p-4 md:rounded-l-none">
        <h3 className="mb-3 text-sm font-bold text-[#141413]">原文编辑：{section}</h3>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={originalText}
            onChange={(e) => onUpdate(e.target.value)}
            className={`w-full resize-y rounded-md border border-[#E8E6E1] bg-white px-3 py-3 text-sm leading-8 text-[#141413] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#141413]/10 transition-colors ${
              highlighting ? "ring-2 ring-[#F59E0B]/30" : ""
            }`}
            rows={16}
            placeholder="该栏目暂无原文内容"
          />
          {highlighting && highlightText && (
            <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-[#FEF3E2] px-2 py-0.5 text-[11px] font-bold text-[#D97706]">
              已定位匹配文字
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
}
