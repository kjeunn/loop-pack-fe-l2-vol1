import type { ButtonHTMLAttributes, HTMLAttributes, LiHTMLAttributes } from "react";

// React 속성 타입엔 data-* 인덱스 시그니처가 없어, getter 반환에 직접 얹어 준다.
type DataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined };

export interface UseSelectProps<Item> {
  items: Item[];
  // 선택값(controlled). 넘기지 않으면 훅 내부 상태로 uncontrolled 동작.
  selectedItem?: Item | null;
  defaultSelectedItem?: Item | null;
  onSelectedItemChange?: (changes: { selectedItem: Item | null }) => void;
  // Item이 제네릭이라 훅은 옵션의 속 모양을 모른다.
  // 그래서 "검색 텍스트"·"품절 판정"처럼 모양을 알아야 하는 판단은 접근자 prop으로 위임한다.
  // 타입어헤드/표시에 쓸 옵션의 텍스트 형태. 객체 아이템이면 넘기는 게 좋다.
  getItemText?: (item: Item | null) => string;
  // 품절 등 비활성 판정. 기본은 항상 활성.
  isItemDisabled?: (item: Item, index: number) => boolean;
}

export interface GetItemPropsArgs<Item> {
  item: Item;
  index: number;
}

export interface UseSelectReturn<Item> {
  // ── 상태 (JS 분기용) ──
  isOpen: boolean;
  selectedItem: Item | null;
  highlightedIndex: number;

  // ── 명령 ──
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  selectItem: (item: Item) => void;
  setHighlightedIndex: (index: number) => void;
  reset: () => void;

  // ── prop-getter: 마크업에 spread ──
  getLabelProps: () => HTMLAttributes<HTMLElement>;
  getToggleButtonProps: () => ButtonHTMLAttributes<HTMLButtonElement>;
  getMenuProps: () => HTMLAttributes<HTMLUListElement>;
  getItemProps: (args: GetItemPropsArgs<Item>) => LiHTMLAttributes<HTMLLIElement> & DataAttributes;
}
