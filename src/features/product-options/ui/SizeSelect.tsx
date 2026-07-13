"use client";

import type { SizeOption } from "@/features/product-options/model/types";
import { useSelect } from "@/shared/lib/select/useSelect";

// select1 — 사이즈 옵션. 같은 useSelect에 <li> 안쪽 생김새만 다르게 심는다.
// 품절은 stock 수량에서 파생한다(isItemDisabled). 옵션 상태는 훅이 실어 보낸 data-*로 스타일링.
interface SizeSelectProps {
  label: string;
  options: SizeOption[];
  value: SizeOption | null;
  onChange: (option: SizeOption) => void;
}

export function SizeSelect({ label, options, value, onChange }: SizeSelectProps) {
  const select = useSelect<SizeOption>({
    items: options,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange(selectedItem);
    },
    getItemText: (option) => (option ? String(option.size) : ""),
    isItemDisabled: (option) => option.stock <= 0,
    getItemKey: (option) => option.id,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-gray-400">
      <button
        {...select.getToggleButtonProps()}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left text-base font-medium text-gray-500 focus:outline-none aria-expanded:border-b aria-expanded:border-gray-400"
      >
        <span {...select.getLabelProps()} className="flex items-center gap-2">
          {label}
          {value && <span className="font-semibold text-gray-900">{value.size}</span>}
        </span>
        <svg
          data-open={select.isOpen || undefined}
          className="size-4 text-gray-400 transition-transform data-[open]:rotate-180"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {select.isOpen && (
        <ul
          className="max-h-72 divide-y divide-gray-100 overflow-y-auto [scrollbar-color:#d1d5db_transparent] [scrollbar-width:thin]"
          {...select.getMenuProps()}
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              {...select.getItemProps({ item: option, index })}
              className="group flex cursor-pointer items-center justify-between px-5 py-4 data-[disabled]:cursor-default data-[highlighted]:bg-gray-50"
            >
              <div>
                <div className="text-lg font-medium text-gray-900 group-data-[selected]:font-semibold group-data-[selected]:text-blue-600 group-data-[disabled]:text-gray-300">
                  {option.size}
                </div>
                {option.stock > 0 && option.deliveryText && (
                  <div className="mt-1 text-sm font-medium text-blue-600">
                    🚚 {option.deliveryText}
                  </div>
                )}
                {option.stock <= 0 && <div className="mt-1 text-sm text-gray-400">품절</div>}
              </div>
              <svg
                className="hidden size-5 shrink-0 text-blue-600 group-data-[selected]:block"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 10l4 4 6-8" />
              </svg>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
