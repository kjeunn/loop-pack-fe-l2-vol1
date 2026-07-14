"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  size,
  useFloating,
} from "@floating-ui/react";

import type { SizeOption } from "@/features/product-options/model/types";
import { useSelect } from "@/shared/lib/select/useSelect";

// SizeSelect와 같은 useSelect 로직을 쓰되, 메뉴를 인라인이 아니라 @floating-ui 팝오버로 띄운다.
// useSelect가 ref가 아니라 id 기반이라, 메뉴를 FloatingPortal로 빼도
// 바깥클릭·스크롤 추적·activedescendant가 그대로 동작한다(훅은 손대지 않는다).
interface FloatingSelectProps {
  label: string;
  options: SizeOption[];
  value: SizeOption | null;
  onChange: (option: SizeOption) => void;
}

export function FloatingSelect({ label, options, value, onChange }: FloatingSelectProps) {
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

  // 위치 계산은 이번 배움 밖이라 floating-ui에 맡긴다.
  // offset(간격)·flip(공간 없으면 위로)·shift(뷰포트 안으로)·size(너비를 버튼에 맞추고 높이 제한).
  const { refs, floatingStyles } = useFloating({
    open: select.isOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip(),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${Math.min(availableHeight, 320)}px`,
          });
        },
      }),
    ],
  });
  // refs.setX를 JSX에서 바로 쓰면 react-hooks/refs가 "렌더 중 ref 접근"으로 오탐한다.
  // 콜백 ref 셋터를 식별자로 꺼내 JSX엔 멤버 접근이 없게 한다.
  const { setReference, setFloating } = refs;

  return (
    <div>
      <button
        ref={setReference}
        {...select.getToggleButtonProps()}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-300 bg-white px-5 py-4 text-left text-base font-medium text-gray-500 focus:border-gray-400 focus:outline-none"
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
        <FloatingPortal>
          <ul
            ref={setFloating}
            style={floatingStyles}
            {...select.getMenuProps()}
            className="z-50 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-lg [scrollbar-color:#d1d5db_transparent] [scrollbar-width:thin]"
          >
            {options.map((option, index) => (
              <li
                key={option.id}
                {...select.getItemProps({ item: option, index })}
                className="group flex cursor-pointer items-center justify-between px-5 py-4 data-[disabled]:cursor-default data-[highlighted]:bg-gray-50"
              >
                <div>
                  <div className="text-lg font-medium text-gray-900 group-data-[disabled]:text-gray-300 group-data-[selected]:font-semibold group-data-[selected]:text-blue-600">
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
        </FloatingPortal>
      )}
    </div>
  );
}
