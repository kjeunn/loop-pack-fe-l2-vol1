// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { routerMock as router } from "@/test/navigation";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

// next/navigation은 setup.ts에서 전역 목킹한다. router 호출은 그 목 실체(routerMock)로 검증한다.
beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});

describe("LogoutButton — 실패", () => {
  it("로그아웃이 실패하면 안내를 보이고 다시 누를 수 있다", async () => {
    server.use(http.post("*/api/auth/logout", () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderWithProviders(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    // 상태는 안전(로그인 유지)하지만 실패했다는 걸 알려야 사용자가 재시도할 이유를 안다.
    expect(await screen.findByRole("alert")).toHaveTextContent(/실패/);
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeEnabled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("LogoutButton — 캐시 위생", () => {
  it("로그아웃하면 보호 자원(meta.auth) 캐시는 지우고 공개 캐시는 남긴다", async () => {
    const user = userEvent.setup();
    const { client } = renderWithProviders(<LogoutButton />);
    // 지워지는 기준은 슬라이스가 아니라 meta.auth다(auth가 orders를 알 필요 없음). 공개 캐시는 대조군.
    const protectedKey = ["protected", "u1"] as const;
    await client.fetchQuery({
      queryKey: protectedKey,
      queryFn: async () => ({ secret: 1 }),
      meta: { auth: true },
    });
    client.setQueryData(["products"], { items: [] });

    await user.click(screen.getByRole("button", { name: "로그아웃" }));
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));

    // 다음 사용자가 같은 브라우저를 써도 이전 사용자의 보호 자원이 메모리에 남지 않는다.
    expect(client.getQueryData(protectedKey)).toBeUndefined();
    expect(client.getQueryData(["products"])).toEqual({ items: [] });
  });
});

describe("LogoutButton", () => {
  it("로그아웃하면 홈으로 이동하고 서버 상태를 갱신한다", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(router.refresh).toHaveBeenCalled();
  });
});
