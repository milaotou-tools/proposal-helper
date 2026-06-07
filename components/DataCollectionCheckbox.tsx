"use client";

export function DataCollectionCheckbox({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-sky-500"
      />
      允许匿名收集输入内容用于优化工具
    </label>
  );
}
