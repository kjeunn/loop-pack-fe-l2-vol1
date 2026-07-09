"use client";

import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

import { useDialogContext } from "./DialogContext";
import type { DialogOverlayProps } from "./types";

// 백드롭. 바깥(오버레이) 클릭이면 닫는다. Content는 별도 Portal이라 여기로 이벤트가 안 올라온다.
export function DialogOverlay({ onClick, className, ...props }: DialogOverlayProps) {
  const { open, setOpen } = useDialogContext();
  // 서버엔 document가 없어 Portal을 안 그린다(닫힘 기본이라 hydration도 일치).
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-40 bg-black/50", className)}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    />,
    document.body,
  );
}
