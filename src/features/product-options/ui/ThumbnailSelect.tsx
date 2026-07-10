"use client";

import Image from "next/image";

import type { ThumbnailOption } from "@/features/product-options/model/types";
import { useSelect } from "@/shared/lib/select/useSelect";

// select2 — 썸네일 옵션. 같은 useSelect에 <li> 안쪽 생김새만 다르게 심는다.
// 품절은 stock 수량에서 파생한다(isItemDisabled). 옵션 상태는 훅이 실어 보낸 data-*로 스타일링.
interface ThumbnailSelectProps {
  label: string;
  options: ThumbnailOption[];
  value: ThumbnailOption | null;
  onChange: (option: ThumbnailOption) => void;
}

export function ThumbnailSelect({ label, options, value, onChange }: ThumbnailSelectProps) {
  const select = useSelect<ThumbnailOption>({
    items: options,
    selectedItem: value,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange(selectedItem);
    },
    getItemText: (option) => option?.title ?? "",
    isItemDisabled: (option) => option.stock <= 0,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-gray-400">
      <button
        {...select.getToggleButtonProps()}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-5 py-4 text-left text-base font-medium text-gray-500 focus:outline-none aria-expanded:border-b aria-expanded:border-gray-400"
      >
        {/* 제목이 길어 트리거엔 선택한 제목만 표시(라벨 접두사 없이). */}
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
              className="group flex cursor-pointer items-center gap-3 px-5 py-4 data-[disabled]:cursor-default data-[disabled]:opacity-40 data-[highlighted]:bg-gray-50"
            >
              <Image
                src={option.image}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="shrink-0 rounded-md border border-gray-200 bg-gray-50 p-2"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] text-gray-900 group-data-[selected]:font-semibold group-data-[selected]:text-blue-600">
                  {option.title}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {option.discountRate > 0 && (
                    <span className="text-sm font-semibold text-red-500">
                      {option.discountRate}%
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900">
                    {option.price.toLocaleString()}원
                  </span>
                  {option.sameDayDelivery && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                      오늘드림
                    </span>
                  )}
                </div>
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
