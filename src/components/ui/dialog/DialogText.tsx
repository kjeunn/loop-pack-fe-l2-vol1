// 의미 요소(제목·설명). 훅이 없어 상태와 무관한 순수 표현이라 여기 묶는다.
import { cn } from "@/lib/cn";

import type { DialogDescriptionProps, DialogTitleProps } from "./types";

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn("text-lg font-bold text-gray-900", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn("mt-1 text-sm text-gray-500", className)} {...props} />;
}
