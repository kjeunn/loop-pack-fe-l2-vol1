// Dialog (Compound) — 4주차 2단계. compound 공개 API.
//
// 요구사항 (자세한 건 docs/assignments/week-04.md):
//   - compound: Dialog / Trigger / Overlay / Panel / Title / Description / Close
//   - controlled(open·onOpenChange) + uncontrolled 이중 API (open prop 유무로 판별)
//   - Panel/Overlay는 Portal로 렌더
//   - Esc / 오버레이 클릭으로 닫고, 열린 동안 배경 스크롤 잠금
//   - (이번 주 범위 밖) 포커스 트랩·ARIA는 다루지 않는다
//
// Object.assign으로 조각을 Root에 붙여 Dialog.Trigger 등으로 쓴다.
import { DialogClose, DialogTrigger } from "./DialogButtons";
import { DialogOverlay } from "./DialogOverlay";
import { DialogPanel } from "./DialogPanel";
import { DialogRoot } from "./DialogRoot";
import { DialogDescription, DialogTitle } from "./DialogText";

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Overlay: DialogOverlay,
  Panel: DialogPanel,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});
