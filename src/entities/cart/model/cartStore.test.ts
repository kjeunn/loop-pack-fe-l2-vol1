import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";

// 모듈 싱글턴 store라 테스트 간 상태가 새지 않게 초기화한다.
beforeEach(() => {
  useCartStore.setState({ cartIds: [] });
});

describe("장바구니 개수 파생", () => {
  it("담으면 id가 들어가고, 빼면 그 상품만 사라진다", () => {
    useCartStore.getState().addToCart("p1");
    useCartStore.getState().addToCart("p2");
    expect(useCartStore.getState().cartIds).toEqual(["p1", "p2"]);

    useCartStore.getState().removeFromCart("p1");
    expect(useCartStore.getState().cartIds).toEqual(["p2"]);
  });

  it("같은 상품을 두 번 담아도 개수는 1로 유지된다", () => {
    useCartStore.getState().addToCart("p1");
    useCartStore.getState().addToCart("p1");
    expect(useCartStore.getState().cartIds).toEqual(["p1"]);
    expect(useCartStore.getState().cartIds.length).toBe(1);
  });

  it("빈 장바구니에서 빼도 개수가 0 밑으로 내려가지 않는다", () => {
    useCartStore.getState().removeFromCart("p1");
    expect(useCartStore.getState().cartIds.length).toBe(0);
  });

  it("없는 항목을 빼면 목록이 그대로다", () => {
    useCartStore.getState().addToCart("p1");
    useCartStore.getState().removeFromCart("nope");
    expect(useCartStore.getState().cartIds).toEqual(["p1"]);
  });

  it("clearCart로 비우면 개수가 0이 된다", () => {
    useCartStore.getState().addToCart("p1");
    useCartStore.getState().addToCart("p2");
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().cartIds).toEqual([]);
  });
});
