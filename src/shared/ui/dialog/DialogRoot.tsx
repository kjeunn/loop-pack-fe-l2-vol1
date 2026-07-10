"use client";

import { useCallback, useMemo, useState } from "react";

import { DialogContext } from "@/shared/ui/dialog/DialogContext";
import type { DialogContextValue, DialogProps } from "@/shared/ui/dialog/types";

// Root — 이중 API. open prop이 오면 controlled(부모 소유), 없으면 내부 state(uncontrolled).
// 닫힘 신호까지 onOpenChange 하나로 통일한다.
export function DialogRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  lockScroll = true,
}: DialogProps) {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      // uncontrolled일 때만 내부 state를 갱신하고, 어느 쪽이든 부모에 알린다.
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo<DialogContextValue>(
    () => ({ open: isOpen, setOpen, lockScroll }),
    [isOpen, setOpen, lockScroll],
  );

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
}
