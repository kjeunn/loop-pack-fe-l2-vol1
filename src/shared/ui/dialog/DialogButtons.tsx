"use client";

import { cn } from "@/shared/lib/cn";
import { useDialogContext } from "@/shared/ui/dialog/DialogContext";
import type { DialogCloseProps, DialogTriggerProps } from "@/shared/ui/dialog/types";

// open 상태를 바꾸는 두 버튼. 소비자 onClick을 먼저 부르고 열기/닫기를 이어붙인다.
// cursor-pointer는 클릭 가능 버튼의 기본값(Tailwind v4 preflight가 안 줌) — 소비자가 override 가능.
export function DialogTrigger({ onClick, className, ...props }: DialogTriggerProps) {
  const { setOpen } = useDialogContext();
  return (
    <button
      type="button"
      className={cn("cursor-pointer", className)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        setOpen(true);
      }}
    />
  );
}

export function DialogClose({ onClick, className, ...props }: DialogCloseProps) {
  const { setOpen } = useDialogContext();
  return (
    <button
      type="button"
      className={cn("cursor-pointer", className)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
    />
  );
}
