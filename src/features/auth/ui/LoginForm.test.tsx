// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/ui/LoginForm";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

// next/navigation의 useRouter를 목킹한다. hoisted로 만들어야 위로 끌어올려지는 vi.mock 팩토리에서 참조된다.
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});

describe("LoginForm", () => {
  it("로그인 성공하면 복원 경로로 이동하고 서버 상태를 갱신한다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect="/orders" />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "looper1234");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/orders"));
    expect(router.refresh).toHaveBeenCalled();
  });

  it("자격 증명이 틀리면(401) 에러를 화면에 보여주고 이동하지 않는다", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ message: "이메일 또는 비밀번호를 확인해주세요." }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect={null} />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "wrong");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "이메일 또는 비밀번호를 확인해주세요.",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});
