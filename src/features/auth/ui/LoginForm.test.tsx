// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCommonProperties, setAnalyticsUser } from "@/analytics/session";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { mockLocation } from "@/test/location";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock("@/analytics/schema", () => ({ trackEvent }));

// 복원은 hard navigation(location.assign)이라 router가 아니라 location을 감시한다.
let location: ReturnType<typeof mockLocation>;
beforeEach(() => {
  location = mockLocation("/login");
  trackEvent.mockClear();
});
afterEach(() => location.restore());

describe("LoginForm", () => {
  it("로그인 성공하면 복원 경로로 전체 페이지 이동한다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect="/orders" />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "looper1234");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await vi.waitFor(() => expect(location.assign).toHaveBeenCalledWith("/orders"));
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
    expect(location.assign).not.toHaveBeenCalled();
  });
});

describe("LoginForm 계측", () => {
  it("보호 경로에서 왔으면 login_start의 from에 그 경로를 싣는다", () => {
    renderWithProviders(<LoginForm redirect="/order-form" />);

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("login_start", { from: "/order-form" });
  });

  it("직접 진입이면 login_start의 from은 direct다", () => {
    renderWithProviders(<LoginForm redirect={null} />);

    expect(trackEvent).toHaveBeenCalledExactlyOnceWith("login_start", { from: "direct" });
  });

  it("로그인에 성공하면 응답의 user.id로 먼저 식별한 뒤 login_success를 from과 함께 찍는다", async () => {
    setAnalyticsUser(null);
    // getCommonProperties의 device 판별이 matchMedia를 쓰는데 jsdom엔 없다.
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
    // 찍는 순간의 공통 프로퍼티 userId를 잡는다 — 식별이 track보다 먼저인지가 요점이다.
    const userIdAtTrack: Array<string | undefined> = [];
    trackEvent.mockImplementation((name: string) => {
      if (name === "login_success") {
        userIdAtTrack.push(getCommonProperties().userId as string | undefined);
      }
    });
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirect="/orders" />);

    await user.type(screen.getByLabelText("이메일"), "looper1@loopers.dev");
    await user.type(screen.getByLabelText("비밀번호"), "looper1234");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await vi.waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("login_success", { from: "/orders" }),
    );
    expect(userIdAtTrack).toEqual(["u1"]);
    setAnalyticsUser(null);
    vi.unstubAllGlobals();
  });

  it("자격 증명이 틀리면 login_fail을 사유와 함께 찍고 login_success는 찍지 않는다", async () => {
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

    await vi.waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith("login_fail", {
        reason: "이메일 또는 비밀번호를 확인해주세요.",
      }),
    );
    expect(trackEvent).not.toHaveBeenCalledWith("login_success", expect.anything());
  });
});
