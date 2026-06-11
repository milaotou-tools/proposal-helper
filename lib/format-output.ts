/**
 * Post-process AI output to enforce formatting rules.
 * Called before displaying any AI-generated text.
 */
export function formatOutput(text: string): string {
  let result = text;

  // ── 1. Replace 第一/第二/第三 numbering ──
  result = result.replace(
    /第([一二三四五六七八九十])[、，,]\s*/g,
    (_, num: string) => {
      const map: Record<string, string> = {
        一: "1", 二: "2", 三: "3", 四: "4", 五: "5",
        六: "6", 七: "7", 八: "8", 九: "9", 十: "10",
      };
      return (map[num] || num) + ". ";
    }
  );

  // ── 2. Replace 首先/其次/再次/最后 串联句式 ──
  result = result.replace(/首先[，,、]\s*/g, "1. ");
  result = result.replace(/其次[，,、]\s*/g, "2. ");
  result = result.replace(/再次[，,、]\s*/g, "3. ");
  result = result.replace(/最后[，,、]\s*/g, (_match, offset: number) => {
    // Count preceding numbered items to pick correct number
    const before = result.slice(0, offset);
    const matches = before.match(/\d+\.\s/g);
    return (matches ? matches.length + 1 : 4) + ". ";
  });

  // ── 3. Replace 其一/其二/其三 ──
  result = result.replace(/其一[，,、]\s*/g, "1. ");
  result = result.replace(/其二[，,、]\s*/g, "2. ");
  result = result.replace(/其三[，,、]\s*/g, "3. ");

  // ── 4. Replace dash/asterisk list markers with sequential numbers ──
  const lines = result.split("\n");
  let dashSeq = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)[-*]\s+(.+)$/);
    if (m) {
      dashSeq++;
      lines[i] = m[1] + dashSeq + ". " + m[2];
    } else if (/^\s*$/.test(lines[i])) {
      dashSeq = 0;
    } else if (!/^\s*\d+[\.、)\s]/.test(lines[i])) {
      dashSeq = 0;
    }
  }
  result = lines.join("\n");

  // ── 5. Add 　　 indentation to prose paragraphs ──
  const lines2 = result.split("\n");
  for (let i = 0; i < lines2.length; i++) {
    const t = lines2[i];
    if (/^\s*$/.test(t)) continue;
    // Already has full-width indent
    if (/^\s*[　]{2}/.test(t)) continue;
    // Headings: **xxx**, ## xxx, ### xxx
    if (/^\s*\*{1,2}.*\*{1,2}\s*$/.test(t)) continue;
    if (/^\s*#{1,3}\s/.test(t)) continue;
    // Numbered items: 一、 1. (1) ①
    if (/^\s*[一二三四五六七八九十][、，]/.test(t)) continue;
    if (/^\s*\d+[\.、)]\s/.test(t)) continue;
    if (/^\s*[①②③④⑤⑥⑦⑧⑨⑩]/.test(t)) continue;
    if (/^\s*\([一二三四五六七八九十\d]+\)/.test(t)) continue;
    // Lines that are already structured
    if (/^\s*[-—]/.test(t)) continue;
    // Prose paragraph — add indent
    const lead = t.match(/^(\s*)/)?.[1] || "";
    lines2[i] = lead + "　　" + t.trimStart();
  }
  result = lines2.join("\n");

  // ── 6. Strip AI filler phrases ──
  result = result.replace(/^综上所述[，,、。]?\s*/gm, "");
  result = result.replace(/^值得注意的是[，,、。]?\s*/gm, "");
  result = result.replace(/^需要指出的是[，,、。]?\s*/gm, "");
  result = result.replace(/^不难看出[，,、。]?\s*/gm, "");

  return result;
}
