"use client";

import { useState } from "react";

import { Dialog } from "@/shared/ui/dialog/Dialog";

// Dialog compound 데모. uncontrolled/controlled 두 방식 + 조각 조합·override·버튼 동작을 보여준다.
export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState("없음"); // 버튼 onClick이 실제로 실행됨을 증명

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Uncontrolled (내부 state)</h2>
        <Dialog>
          <Dialog.Trigger className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            열기
          </Dialog.Trigger>
          <Dialog.Overlay />
          {/* max-h + flex-col: 제목·버튼은 고정, 중간 영역만 스크롤 */}
          <Dialog.Panel className="flex max-h-[70vh] flex-col">
            {/* 우상단 X — 그냥 Dialog.Close를 X 모양으로 위치시킨 것 */}
            <Dialog.Close className="absolute top-3 right-3 rounded p-1 text-gray-400 hover:bg-gray-100">
              <svg
                className="size-5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l8 8M14 6l-8 8" />
              </svg>
            </Dialog.Close>
            <Dialog.Title>이용 약관</Dialog.Title>
            {/* 이 영역만 스크롤(overscroll-contain). 배경은 body 잠금이라 안 움직인다 */}
            <div className="mt-3 flex-1 overflow-y-auto overscroll-contain pr-2 text-sm text-gray-600">
              {Array.from({ length: 20 }, (_, i) => (
                <p key={i} className="mb-3">
                  제{i + 1}조 — 긴 약관 내용입니다. 이 안쪽만 스크롤되고 뒤 배경은 스크롤되지
                  않아요.
                </p>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Dialog.Close className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium">
                닫기
              </Dialog.Close>
            </div>
          </Dialog.Panel>
        </Dialog>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">
          Controlled (외부 state · open: {String(open)})
        </h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          외부 버튼으로 열기
        </button>
        <p className="mt-2 text-sm text-gray-500">마지막 동작: {lastAction}</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <Dialog.Overlay />
          {/* cn override: 기본 max-w-md를 max-w-lg가 이긴다 */}
          <Dialog.Panel className="max-w-lg">
            <Dialog.Title>삭제할까요?</Dialog.Title>
            <Dialog.Description>이 작업은 되돌릴 수 없어요.</Dialog.Description>
            {/* onClick으로 각자 동작 실행 후 닫힘. 순서·색·정렬 전부 소비자가 정함 */}
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close
                onClick={() => setLastAction("취소됨")}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium"
              >
                취소
              </Dialog.Close>
              <Dialog.Close
                onClick={() => setLastAction("삭제됨")}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white"
              >
                삭제
              </Dialog.Close>
            </div>
          </Dialog.Panel>
        </Dialog>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">
          Nested (중첩 — 안쪽을 닫아도 배경 잠금 유지 · Esc는 위부터)
        </h2>
        <Dialog>
          <Dialog.Trigger className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            바깥 Dialog 열기
          </Dialog.Trigger>
          <Dialog.Overlay />
          <Dialog.Panel>
            <Dialog.Title>바깥 Dialog</Dialog.Title>
            <Dialog.Description>
              여기서 안쪽 Dialog를 연다. 안쪽을 닫아도 배경 스크롤은 잠긴 채여야 하고, Esc는
              안쪽부터 하나씩 닫힌다.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              {/* 중첩: 바깥 Panel 안에 또 하나의 Dialog. 각자 자기 Context를 가진다 */}
              <Dialog>
                <Dialog.Trigger className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                  안쪽 Dialog 열기
                </Dialog.Trigger>
                <Dialog.Overlay />
                <Dialog.Panel>
                  <Dialog.Title>안쪽 Dialog</Dialog.Title>
                  <Dialog.Description>
                    Esc를 누르면 이것만 닫히고 바깥은 남는다. 닫아도 배경 스크롤은 잠긴 채.
                  </Dialog.Description>
                  <div className="mt-5 flex justify-end">
                    <Dialog.Close className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium">
                      안쪽 닫기
                    </Dialog.Close>
                  </div>
                </Dialog.Panel>
              </Dialog>
              <Dialog.Close className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium">
                바깥 닫기
              </Dialog.Close>
            </div>
          </Dialog.Panel>
        </Dialog>
      </section>
    </div>
  );
}
