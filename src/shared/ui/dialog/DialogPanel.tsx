"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/cn";
import { useMounted } from "@/shared/lib/useMounted";
import { useDialogContext } from "@/shared/ui/dialog/DialogContext";
import { lockScroll as lockBodyScroll, pushEscClose } from "@/shared/ui/dialog/layer";
import type { DialogPanelProps } from "@/shared/ui/dialog/types";

// 모달 박스(패널). Portal로 그린다.
// 배경 스크롤·Esc는 인스턴스가 아니라 layer(전역)가 refcount·stack으로 관리한다.
// 중첩 Dialog에서 마지막이 닫힐 때만 스크롤이 풀리고, Esc는 맨 위 Dialog 하나만 닫힌다.
export function DialogPanel({ className, ...props }: DialogPanelProps) {
  const { open, setOpen, lockScroll } = useDialogContext();
  // 서버엔 document가 없다. 마운트 후에만 Portal을 그려 open=true 첫 렌더에서도 안전하게 한다.
  const mounted = useMounted();

  // 배경 스크롤 잠금 — open이고 lockScroll일 때만. 중첩은 layer가 refcount로 처리한다.
  // Esc effect와 나눈 이유: Esc는 setOpen 의존이라 재실행되는데,
  // 여기 묶이면 재실행 시 잠금이 다시 걸려 refcount가 어긋난다.
  // 그래서 open·lockScroll만 의존하게 둔다.
  useEffect(() => {
    if (!open || !lockScroll) return;
    return lockBodyScroll(document);
  }, [open, lockScroll]);

  // Esc 닫기 — layer stack에 close를 올린다.
  // 맨 위 하나만 닫히게 하는 판단은 layer가 한다.
  useEffect(() => {
    if (!open) return;
    return pushEscClose(document, () => setOpen(false));
  }, [open, setOpen]);

  if (!mounted || !open) return null;

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
