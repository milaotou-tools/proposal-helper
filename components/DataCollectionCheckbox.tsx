"use client";

export function DataCollectionCheckbox({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-[#6B7280]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[#D1D5DB] accent-[#141413]"
      />
      允许匿名收集输入内容用于优化工具
    </label>
  );
}
