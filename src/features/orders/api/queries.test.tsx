// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateOrder } from "@/features/orders/api/mutations";
import { useOrders } from "@/features/orders/api/queries";
import { makeQueryClient } from "@/shared/api/queryClient";
import { mockLocation } from "@/test/location";
import { server } from "@/test/server";
import { looperUser, withSession } from "@/test/session";

// 만료 리다이렉트의 유일한 스위치는 각 옵션의 meta.auth다. queryClient 테스트는 자기 쿼리를 새로 정의해
// 스위치를 달고 보므로, 실제 ordersQueryOptions·useCreateOrder에서 meta가 빠져도 초록이다.
// 여기서는 실제 옵션을 그대로 써서 "지우면 빨개지는" 배선 테스트로 둔다.
let location: ReturnType<typeof mockLocation>;
beforeEach(() => {
  location = mockLocation("/orders");
});
afterEach(() => location.restore());

function renderLoggedIn(ui: React.ReactNode) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } });
  return render(
    <QueryClientProvider client={client}>{withSession(looperUser(1), ui)}</QueryClientProvider>,
  );
}

function OrdersProbe() {
  const orders = useOrders();
  return <span>{orders.status}</span>;
}

function CreateOrderProbe() {
  const createOrder = useCreateOrder();
  return (
    <button
      type="button"
      onClick={() => createOrder.mutate({ items: [{ productId: "p1", quantity: 1 }] })}
    >
      주문
    </button>
  );
}

describe("주문 API의 만료 배선(meta.auth)", () => {
  it("주문 내역 조회가 401이면 복원 경로와 만료 사유를 실어 로그인으로 보낸다", async () => {
    server.use(http.get("*/api/orders", () => HttpResponse.json({}, { status: 401 })));
    renderLoggedIn(<OrdersProbe />);

    await vi.waitFor(() =>
      expect(location.assign).toHaveBeenCalledWith("/login?redirect=%2Forders&reason=expired"),
    );
  });

  it("주문 생성이 401이면(주문 중 만료) 같은 방식으로 로그인으로 보낸다", async () => {
    server.use(http.post("*/api/orders", () => HttpResponse.json({}, { status: 401 })));
    renderLoggedIn(<CreateOrderProbe />);

    await userEvent.click(screen.getByRole("button", { name: "주문" }));

    await vi.waitFor(() =>
      expect(location.assign).toHaveBeenCalledWith("/login?redirect=%2Forders&reason=expired"),
    );
  });
});
