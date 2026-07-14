"use client";

import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/cn";
import { useMounted } from "@/shared/lib/useMounted";
import { useDialogContext } from "@/shared/ui/dialog/DialogContext";
import type { DialogOverlayProps } from "@/shared/ui/dialog/types";

// 백드롭. 바깥(오버레이) 클릭이면 닫는다. Panel은 별도 Portal이라 여기로 이벤트가 안 올라온다.
export function DialogOverlay({ onClick, className, ...props }: DialogOverlayProps) {
  const { open, setOpen } = useDialogContext();
  // Panel과 같은 이유로 마운트 후에만 Portal을 그린다(SSR엔 document 없음, open=true 첫 렌더도 안전).
  const mounted = useMounted();
  if (!mounted || !open) return null;

  // Overlay·Panel을 같은 z(z-50)로 두고, 쌓임 순서는 Portal DOM 순서에 맡긴다.
  // 그래야 중첩 시 나중에 열린 Dialog의 Overlay가 먼저 열린 Dialog의 Panel 위에 온다.
  // z를 다르게 주면(overlay 40 < panel 50) 안쪽 Overlay가 바깥 Panel 밑에 깔린다.
  return createPortal(
    <div
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    />,
    document.body,
  );
}
