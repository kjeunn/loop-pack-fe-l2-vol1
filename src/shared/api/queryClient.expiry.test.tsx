// @vitest-environment jsdom
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "@/shared/api/fetcher";
import { makeQueryClient } from "@/shared/api/queryClient";
import { mockLocation } from "@/test/location";
import { server } from "@/test/server";

// 만료 핸들러의 이동은 location.assign이다. 스텁 방식은 mockLocation(공유 헬퍼)에 있다.
let location: ReturnType<typeof mockLocation>;
beforeEach(() => {
  location = mockLocation("/orders");
});
afterEach(() => location.restore());

function renderWithClient(ui: React.ReactNode) {
  return render(<QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>);
}

// 보호 쿼리: meta.auth를 달아야 만료 리다이렉트가 걸린다.
function ProtectedQuery() {
  const query = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchJson("/api/orders"),
    meta: { auth: true },
    retry: false,
  });
  return <span>{query.status}</span>;
}

// 보호 아님: meta 없는 401은 리다이렉트하지 않는다(로그인 401 등).
function UnprotectedMutation() {
  const mutation = useMutation({ mutationFn: () => fetchJson("/api/auth/login") });
  return (
    <button type="button" onClick={() => mutation.mutate()}>
      전송
    </button>
  );
}

describe("세션 만료 리다이렉트(ㄴ)", () => {
  it("보호 쿼리(meta.auth)의 401은 복원 경로를 실어 로그인으로 리다이렉트한다", async () => {
    server.use(
      http.get("*/api/orders", () =>
        HttpResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }),
      ),
    );
    renderWithClient(<ProtectedQuery />);

    await vi.waitFor(() =>
      expect(location.assign).toHaveBeenCalledWith(
        `/login?redirect=${encodeURIComponent("/orders")}`,
      ),
    );
  });

  it("meta.auth가 없는 401은 리다이렉트하지 않는다", async () => {
    server.use(
      http.get("*/api/auth/login", () =>
        HttpResponse.json({ message: "자격 증명 오류" }, { status: 401 }),
      ),
    );
    renderWithClient(<UnprotectedMutation />);
    screen.getByRole("button").click();

    // 에러가 처리될 시간을 준 뒤에도 리다이렉트가 없어야 한다.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(location.assign).not.toHaveBeenCalled();
  });
});
