// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useSelect } from "@/shared/lib/select/useSelect";

interface Opt {
  id: string;
  label: string;
  stock: number;
}

const options: Opt[] = [
  { id: "a", label: "Apple", stock: 1 },
  { id: "b", label: "Banana", stock: 0 }, // 품절
  { id: "c", label: "Cherry", stock: 3 },
];

// 훅만 두면 키보드 이벤트를 줄 DOM이 없어, 최소 마크업에 prop-getter를 붙여 사용자 관점으로 테스트한다.
// 옆의 "바깥" 버튼은 outside-click 검증용.
function Harness({ value, onChange }: { value?: Opt | null; onChange?: (option: Opt) => void }) {
  const select = useSelect<Opt>({
    items: options,
    selectedItem: value, // undefined면 uncontrolled, 넘기면 controlled
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange?.(selectedItem);
    },
    getItemText: (option) => option?.label ?? "",
    isItemDisabled: (option) => option.stock <= 0,
    getItemKey: (option) => option.id,
  });

  return (
    <div>
      <button {...select.getToggleButtonProps()}>toggle</button>
      {select.isOpen && (
        <ul {...select.getMenuProps()}>
          {options.map((option, index) => (
            <li key={option.id} {...select.getItemProps({ item: option, index })}>
              {option.label}
            </li>
          ))}
        </ul>
      )}
      <button>바깥</button>
    </div>
  );
}

const openMenu = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByText("toggle"));

describe("Select 계약 — 열고 닫기", () => {
  it("닫힌 채 시작하고, 트리거를 누르면 listbox가 열린다", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const toggle = screen.getByText("toggle");
    expect(toggle).toHaveAttribute("aria-haspopup", "listbox");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).toBeNull();

    await openMenu(user);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("Esc로 닫힌다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openMenu(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("바깥을 클릭하면 닫힌다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openMenu(user);
    await user.click(screen.getByText("바깥"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("Select 계약 — 키보드 이동", () => {
  it("화살표 이동에서 품절 옵션을 건너뛴다", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openMenu(user); // 첫 활성(Apple) 하이라이트
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("data-highlighted");

    await user.keyboard("{ArrowDown}"); // 품절 Banana 건너뛰고 Cherry
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("data-highlighted");
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-disabled", "true");
  });

  // 타입어헤드는 영문·숫자만 동작한다(한글은 IME 조합이라 제외 — useSelect 주석 참고).
  it("타입어헤드: 영문/숫자를 치면 해당 옵션으로 점프한다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openMenu(user);
    await user.keyboard("c"); // Cherry
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("data-highlighted");
  });
});

describe("Select 계약 — 선택", () => {
  it("Enter로 하이라이트된 옵션을 선택하고 닫는다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await openMenu(user); // Apple 하이라이트
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(options[0]);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("선택한 옵션은 aria-selected로 표시된다", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openMenu(user);
    await user.click(screen.getByRole("option", { name: "Cherry" }));
    await openMenu(user); // 다시 열기
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "false");
  });

  it("품절 옵션은 클릭해도 선택되지 않는다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await openMenu(user);
    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Select 계약 — controlled", () => {
  it("getItemKey: 참조가 달라도 같은 키면 선택으로 표시된다", async () => {
    const user = userEvent.setup();
    // options 배열의 원소와 다른 객체(참조)지만 같은 id — 참조 비교였다면 실패했을 케이스.
    const value: Opt = { id: "a", label: "Apple", stock: 1 };
    render(<Harness value={value} />);

    await openMenu(user);
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "true");
  });

  it("부모가 value를 안 바꾸면 선택해도 표시가 그대로다(부모 소유)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness value={null} onChange={onChange} />);

    await openMenu(user);
    await user.click(screen.getByRole("option", { name: "Cherry" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "c" }));

    // value(null)를 안 올렸으니 다시 열어도 아무것도 선택되지 않는다.
    await openMenu(user);
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
