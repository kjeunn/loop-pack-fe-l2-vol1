import { createContext, useContext } from "react";

import type { DialogContextValue } from "./types";

export const DialogContext = createContext<DialogContextValue | null>(null);

// 조각(Trigger/Content 등)이 <Dialog> 밖에서 쓰이면 명확히 에러를 던져 잘못된 조립을 조기에 잡는다.
export function useDialogContext(): DialogContextValue {
  const context = useContext(DialogContext);
  if (context === null) {
    throw new Error("Dialog 조각은 <Dialog> 안에서만 쓸 수 있습니다.");
  }
  return context;
}
