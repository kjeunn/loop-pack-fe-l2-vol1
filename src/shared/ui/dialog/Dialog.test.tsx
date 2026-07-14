import { useState } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "@/shared/ui/dialog/Dialog";

describe("Dialog 계약 — 이중 API", () => {
  it("uncontrolled: 트리거로 열리고 onOpenChange(true)가 호출된다", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog onOpenChange={onOpenChange}>
        <Dialog.Trigger>열기</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Panel>
          <Dialog.Title>제목</Dialog.Title>
        </Dialog.Panel>
      </Dialog>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByText("열기"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("controlled: 부모가 open을 소유하고 Close가 onOpenChange(false)를 통보한다", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Wrapper() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        >
          <Dialog.Overlay />
          <Dialog.Panel>
            <Dialog.Title>제목</Dialog.Title>
            <Dialog.Close>닫기</Dialog.Close>
          </Dialog.Panel>
        </Dialog>
      );
    }

    render(<Wrapper />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByText("닫기"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Dialog 계약 — 닫힘 경로", () => {
  const renderBasic = () =>
    render(
      <Dialog>
        <Dialog.Trigger>열기</Dialog.Trigger>
        <Dialog.Overlay data-testid="overlay" />
        <Dialog.Panel>
          <Dialog.Title>제목</Dialog.Title>
        </Dialog.Panel>
      </Dialog>,
    );

  it("Esc로 닫힌다", async () => {
    const user = userEvent.setup();
    renderBasic();
    await user.click(screen.getByText("열기"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("오버레이(바깥) 클릭으로 닫힌다", async () => {
    const user = userEvent.setup();
    renderBasic();
    await user.click(screen.getByText("열기"));
    await user.click(screen.getByTestId("overlay"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Dialog 계약 — 배경 스크롤 잠금", () => {
  it("열리면 body 스크롤을 잠그고, 닫히면 되돌린다", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <Dialog.Trigger>열기</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Panel>
          <Dialog.Title>제목</Dialog.Title>
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Panel>
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe("");
    await user.click(screen.getByText("열기"));
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByText("닫기"));
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Dialog 계약 — 중첩", () => {
  it("Esc는 맨 위 Dialog만 닫고, 마지막이 닫힐 때만 스크롤이 풀린다", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <Dialog.Trigger>바깥 열기</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Panel>
          <Dialog.Title>바깥</Dialog.Title>
          <Dialog>
            <Dialog.Trigger>안쪽 열기</Dialog.Trigger>
            <Dialog.Overlay />
            <Dialog.Panel>
              <Dialog.Title>안쪽</Dialog.Title>
            </Dialog.Panel>
          </Dialog>
        </Dialog.Panel>
      </Dialog>,
    );

    await user.click(screen.getByText("바깥 열기"));
    await user.click(screen.getByText("안쪽 열기"));
    expect(screen.getByText("안쪽")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Esc 1회 → 안쪽만 닫힘, 바깥은 남고 스크롤은 여전히 잠김
    await user.keyboard("{Escape}");
    expect(screen.queryByText("안쪽")).toBeNull();
    expect(screen.getByText("바깥")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Esc 2회 → 바깥도 닫히고 스크롤 복원
    await user.keyboard("{Escape}");
    expect(screen.queryByText("바깥")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Dialog 계약 — 옵션·확장", () => {
  it("lockScroll=false면 배경 스크롤을 잠그지 않는다(비모달)", async () => {
    const user = userEvent.setup();
    render(
      <Dialog lockScroll={false}>
        <Dialog.Trigger>열기</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Panel>
          <Dialog.Title>제목</Dialog.Title>
        </Dialog.Panel>
      </Dialog>,
    );
    await user.click(screen.getByText("열기"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("Trigger·Close의 소비자 onClick이 실행되고 여닫힘도 동작한다", async () => {
    const user = userEvent.setup();
    const onTriggerClick = vi.fn();
    const onCloseClick = vi.fn();
    render(
      <Dialog>
        <Dialog.Trigger onClick={onTriggerClick}>열기</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Panel>
          <Dialog.Title>제목</Dialog.Title>
          <Dialog.Close onClick={onCloseClick}>닫기</Dialog.Close>
        </Dialog.Panel>
      </Dialog>,
    );
    await user.click(screen.getByText("열기"));
    expect(onTriggerClick).toHaveBeenCalled();
    await user.click(screen.getByText("닫기"));
    expect(onCloseClick).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
