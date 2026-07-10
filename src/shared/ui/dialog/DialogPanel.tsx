"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/cn";

import { useDialogContext } from "./DialogContext";
import type { DialogPanelProps } from "./types";

// 모달 박스(패널). Portal로 그리고, 열렸을 때만 렌더하며 Esc 닫기·배경 스크롤 잠금을 담당한다.
export function DialogPanel({ className, ...props }: DialogPanelProps) {
  const { open, setOpen, lockScroll } = useDialogContext();

  // 배경 스크롤 잠금 — open이고 lockScroll일 때만(lockScroll=false면 비모달이라 배경 유지).
  // Esc effect와 분리한 이유: Esc는 setOpen 의존이라 재실행되는데, 여기 묶이면 재실행 시
  // prevOverflow가 "hidden"으로 오염돼 스크롤이 안 풀린다. 그래서 open·lockScroll만 의존하게 둔다.
  useEffect(() => {
    if (!open || !lockScroll) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, lockScroll]);

  // Esc로 닫기 — document 키다운 구독(외부 시스템 동기화).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      className={cn(
        "fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl",
        className,
      )}
      {...props}
    />,
    document.body,
  );
}
