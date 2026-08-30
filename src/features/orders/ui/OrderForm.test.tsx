// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";
import { OrderForm } from "@/features/orders/ui/OrderForm";
import { renderWithProviders } from "@/test/renderWithProviders";
import { server } from "@/test/server";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(async () => {
  router.push.mockClear();
  // 하이드레이션을 끝내 "복원 중" 분기를 지나게 하고, cart를 원하는 상태로 세운다.
  await useCartStore.persist.rehydrate();
  useCartStore.setState({ cartIds: [] });
});

describe("OrderForm", () => {
  it("담은 상품이 없으면 안내를 보인다", () => {
    renderWithProviders(<OrderForm />);
    expect(screen.getByText("담은 상품이 없습니다.")).toBeInTheDocument();
  });

  it("주문하면 담은 상품을 수량 1로 보내고, 성공 뒤 장바구니를 비우고 주문내역으로 이동한다", async () => {
    let requestBody: unknown;
    server.use(
      http.post("*/api/orders", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(
          { order: { id: "o1", createdAt: "2026-01-01T00:00:00.000Z", items: [] } },
          { status: 201 },
        );
      }),
    );
    useCartStore.setState({ cartIds: ["p1", "p2"] });
    const user = userEvent.setup();
    renderWithProviders(<OrderForm />);

    await user.click(screen.getByRole("button", { name: "주문하기" }));

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith("/orders"));
    expect(requestBody).toEqual({
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 1 },
      ],
    });
    // 성공 뒤 장바구니가 비워진다.
    expect(useCartStore.getState().cartIds).toEqual([]);
  });
});
