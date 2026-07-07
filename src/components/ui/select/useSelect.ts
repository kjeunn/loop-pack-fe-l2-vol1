// useSelect — Headless Select 로직 (Downshift `useSelect` 모델)
//
// "동작"만 노출하고 "생김새"는 사용처가 심는다. 로직은 prop-getter로만 나간다.
// - selectedItem은 옵션 "객체 전체" — 가격·배송 계산에 그대로 쓰인다.
// - 옵션 상태(selected/highlighted/disabled)는 props에 data-*/aria-*로 실어 보낸다
//   (Radix·React Aria 방식): CSS로 바로 스타일링, spread해도 안전, JS 분기는 top-level 상태로.
// - 품절(isItemDisabled)은 키보드 이동에서 건너뛰고 선택도 막는다.
// - id는 useId로 인스턴스마다 자동 생성 → 한 화면에 여러 개 떠도 안 겹치고 SSR-안전.

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useId, useRef, useState } from "react";

import type { UseSelectProps, UseSelectReturn } from "./types";

const TYPEAHEAD_RESET_MS = 400;

export function useSelect<Item>({
  items,
  selectedItem: selectedItemProp,
  defaultSelectedItem = null,
  onSelectedItemChange,
  getItemText = (item) => (item === null ? "" : String(item)),
  isItemDisabled,
}: UseSelectProps<Item>): UseSelectReturn<Item> {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const toggleId = `${baseId}-toggle`;
  const menuId = `${baseId}-menu`;
  const itemId = (index: number) => `${baseId}-item-${index}`;

  // selectedItem은 controlled/uncontrolled 둘 다 지원(prop 유무로 판별).
  const isControlled = selectedItemProp !== undefined;
  const [selectedItemState, setSelectedItemState] = useState<Item | null>(defaultSelectedItem);
  const selectedItem = isControlled ? (selectedItemProp as Item | null) : selectedItemState;

  // isOpen·highlightedIndex는 select만 읽는 뷰 상태라 항상 내부 소유.
  const [isOpen, setIsOpen] = useState(false);
  // highlightedIndex = "지금 활성인 옵션" 하나. 키보드 이동과 마우스 오버가 같은 값으로 수렴한다.
  // (그래서 이름이 hover가 아니라 highlighted — 입력 수단이 아니라 상태를 가리킨다.
  //  hover 룩은 사용처가 [data-highlighted]로 주면 키보드·마우스가 한 소스로 통일된다.)
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timer: null,
  });

  const isDisabled = (index: number) =>
    index >= 0 && index < items.length ? (isItemDisabled?.(items[index], index) ?? false) : true;

  const firstEnabledIndex = (dir: 1 | -1 = 1): number => {
    if (dir === 1) return items.findIndex((_, i) => !isDisabled(i));
    for (let i = items.length - 1; i >= 0; i--) if (!isDisabled(i)) return i;
    return -1;
  };

  // 방향(dir)으로 다음 활성 인덱스를 찾는다. 끝에 닿으면 wrap 없이 현재 위치를 유지한다.
  const nextEnabledIndex = (from: number, dir: 1 | -1): number => {
    let i = from;
    for (;;) {
      i += dir;
      if (i < 0 || i >= items.length) return from >= 0 ? from : firstEnabledIndex(dir);
      if (!isDisabled(i)) return i;
    }
  };

  const setSelectedItem = (item: Item | null) => {
    if (!isControlled) setSelectedItemState(item);
    onSelectedItemChange?.({ selectedItem: item });
  };

  const selectItem = (item: Item) => setSelectedItem(item);

  const openMenu = () => {
    setIsOpen(true);
    // 열 때 선택 항목을 하이라이트(참조 비교). 없거나 품절이면 첫 활성 항목으로.
    const selected = selectedItem === null ? -1 : items.indexOf(selectedItem);
    setHighlightedIndex(selected >= 0 && !isDisabled(selected) ? selected : firstEnabledIndex());
  };

  const closeMenu = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const toggleMenu = () => (isOpen ? closeMenu() : openMenu());

  const reset = () => {
    setSelectedItem(null);
    closeMenu();
  };

  // 타입어헤드: 입력 문자를 모아 접두사 일치 항목으로 점프. 열려 있으면 하이라이트, 닫혀 있으면 바로 선택.
  const onTypeahead = (key: string) => {
    const state = typeahead.current;
    if (state.timer) clearTimeout(state.timer);
    state.buffer += key.toLowerCase();
    state.timer = setTimeout(() => {
      state.buffer = "";
      state.timer = null;
    }, TYPEAHEAD_RESET_MS);

    const match = items.findIndex(
      (item, i) => !isDisabled(i) && getItemText(item).toLowerCase().startsWith(state.buffer),
    );
    if (match < 0) return;
    if (isOpen) setHighlightedIndex(match);
    else selectItem(items[match]);
  };

  const onToggleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) openMenu();
        else setHighlightedIndex(nextEnabledIndex(highlightedIndex, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(firstEnabledIndex(-1));
        } else {
          setHighlightedIndex(nextEnabledIndex(highlightedIndex, -1));
        }
        break;
      case "Enter":
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0 && !isDisabled(highlightedIndex)) {
          selectItem(items[highlightedIndex]);
          closeMenu();
        }
        break;
      case " ":
        // Space는 타입어헤드 문자가 아니라 열기/선택 명령으로 쓴다.
        event.preventDefault();
        if (!isOpen) openMenu();
        else if (highlightedIndex >= 0 && !isDisabled(highlightedIndex)) {
          selectItem(items[highlightedIndex]);
          closeMenu();
        }
        break;
      case "Escape":
        if (isOpen) closeMenu();
        break;
      case "Home":
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(firstEnabledIndex(1));
        }
        break;
      case "End":
        if (isOpen) {
          event.preventDefault();
          setHighlightedIndex(firstEnabledIndex(-1));
        }
        break;
      default:
        if (event.key.length === 1) onTypeahead(event.key);
    }
  };

  return {
    isOpen,
    selectedItem,
    highlightedIndex,

    openMenu,
    closeMenu,
    toggleMenu,
    selectItem,
    setHighlightedIndex,
    reset,

    getLabelProps: () => ({ id: labelId }),

    getToggleButtonProps: () => ({
      id: toggleId,
      type: "button",
      "aria-haspopup": "listbox",
      "aria-expanded": isOpen,
      "aria-controls": menuId,
      "aria-labelledby": `${labelId} ${toggleId}`,
      // 포커스는 버튼에 머문다(포커스 이동 관리 회피). 하이라이트는 activedescendant로 AT에 전달.
      "aria-activedescendant":
        isOpen && highlightedIndex >= 0 ? itemId(highlightedIndex) : undefined,
      onClick: toggleMenu,
      onKeyDown: onToggleKeyDown,
    }),

    getMenuProps: () => ({
      id: menuId,
      role: "listbox",
      "aria-labelledby": labelId,
    }),

    getItemProps: ({ item, index }) => {
      const disabled = isDisabled(index);
      // selected는 참조 비교라, items를 매 렌더 새로 만들면 참조가 어긋나 선택 표시가 깨진다.
      // → items를 안정 참조로 두거나, 필요하면 key 기반 비교로 바꾼다.
      const selected = selectedItem === item;
      const highlighted = highlightedIndex === index;
      return {
        id: itemId(index),
        role: "option",
        "aria-selected": selected,
        "aria-disabled": disabled || undefined,
        // 상태를 data-*로 실어 보낸다 → CSS(li[data-highlighted]…)로 바로 스타일링, spread해도 안전.
        "data-selected": selected || undefined,
        "data-highlighted": highlighted || undefined,
        "data-disabled": disabled || undefined,
        onClick: disabled
          ? undefined
          : () => {
              selectItem(item);
              closeMenu();
            },
        // onMouseEnter가 아니라 onMouseMove: 키보드로 옮긴 하이라이트가 멈춰 있는 마우스에 즉시 덮이지 않게.
        onMouseMove: disabled
          ? undefined
          : () => {
              if (highlightedIndex !== index) setHighlightedIndex(index);
            },
      };
    },
  };
}
