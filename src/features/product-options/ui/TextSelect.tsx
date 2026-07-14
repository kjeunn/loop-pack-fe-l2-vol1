"use client";

import type { TextOption } from "@/features/product-options/model/types";
import { useSelect } from "@/shared/lib/select/useSelect";

// select3 — 텍스트/가격 옵션. 같은 useSelect에 <li> 안쪽 생김새만 다르게 심는다.
// 품절은 stock 수량에서 파생한다(isItemDisabled). 옵션 상태는 훅이 실어 보낸 data-*로 스타일링.
interface TextSelectProps {
  label: string;
  options: TextOption[];
  value: TextOption | null;
  onChange: (option: TextOption) => void;
}

export function TextSelect({ label, options, value, onChange }: TextSelectProps) {
  const select = useSelect<TextOption>({
    items: options,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange(selectedItem);
    },
    getItemText: (option) => option?.title ?? "",
    isItemDisabled: (option) => option.stock <= 0,
    getItemKey: (option) => option.id,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-gray-400">
      {/* select3는 헤더에 회색 배경을 둬 리스트와 구분한다(이 변형만의 디자인). */}
      <button
        {...select.getToggleButtonProps()}
        className="flex w-full cursor-pointer items-center justify-between gap-2 bg-gray-50 px-5 py-4 text-left text-base font-bold text-gray-900 focus:outline-none aria-expanded:border-b aria-expanded:border-gray-400"
      >
        <span {...select.getLabelProps()} className="truncate">
          {value ? value.title : label}
        </span>
        <svg
          data-open={select.isOpen || undefined}
          className="size-4 shrink-0 text-gray-400 transition-transform data-[open]:rotate-180"
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
          className="max-h-80 divide-y divide-gray-100 overflow-y-auto [scrollbar-color:#d1d5db_transparent] [scrollbar-width:thin]"
          {...select.getMenuProps()}
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              {...select.getItemProps({ item: option, index })}
              className="group flex cursor-pointer items-center justify-between gap-3 px-5 py-4 data-[disabled]:cursor-default data-[disabled]:opacity-40 data-[highlighted]:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="truncate text-[15px] text-gray-900 group-data-[selected]:font-semibold group-data-[selected]:text-blue-600">
                  {option.title}
                </div>
                <div className="mt-1">
                  <strong className="text-lg font-extrabold text-gray-900">
                    {option.price.toLocaleString()}원
                  </strong>
                  <span className="ml-1.5 text-[13px] text-gray-400">
                    (1개당 {option.unitPrice.toLocaleString()}원)
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {option.freeShipping && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    무료배송
                  </span>
                )}
                <svg
                  className="hidden size-5 text-blue-600 group-data-[selected]:block"
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
