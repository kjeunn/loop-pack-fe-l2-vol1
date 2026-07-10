import type { ComponentPropsWithoutRef, ReactNode } from "react";

// 조각들이 Context로 공유하는 값. 닫힘은 open===false, 열고 닫기는 setOpen 하나로 통일한다.
export interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  lockScroll: boolean;
}

// Root. open prop 유무로 controlled/uncontrolled를 판별한다(이중 API의 핵심).
// 열기·닫기 신호는 onOpenChange(open) 하나로 받는다(별도 onClose 없음).
export interface DialogProps {
  children: ReactNode;
  open?: boolean; // controlled: 부모가 상태 소유
  defaultOpen?: boolean; // uncontrolled 초기값(생략 시 false)
  onOpenChange?: (open: boolean) => void;
  lockScroll?: boolean; // 열린 동안 배경 스크롤을 잠글지. false면 비모달(배경 스크롤 유지). 기본 true.
}

// 각 조각은 해당 엘리먼트의 네이티브 props를 그대로 받는다(className·onClick 등 pass-through).
export type DialogTriggerProps = ComponentPropsWithoutRef<"button">;
export type DialogOverlayProps = ComponentPropsWithoutRef<"div">;
export type DialogPanelProps = ComponentPropsWithoutRef<"div">;
export type DialogTitleProps = ComponentPropsWithoutRef<"h2">;
export type DialogDescriptionProps = ComponentPropsWithoutRef<"p">;
export type DialogCloseProps = ComponentPropsWithoutRef<"button">;
