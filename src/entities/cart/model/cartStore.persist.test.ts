// @vitest-environment jsdom
// persist 저장값 복구(migrate·merge·sanitize)를 검증하므로 localStorage가 필요하다.
import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "@/entities/cart/model/cartStore";

beforeEach(() => {
  useCartStore.setState({ cartIds: [] });
  localStorage.clear();
});

// 저장값이 손상돼도 안전한 상태로 복원한다(zod .catch 복구 전략).
describe("장바구니 저장값 복구", () => {
  it("배열이 아니거나 문자열 아닌 항목이 섞이면 그 목록을 비운다", async () => {
    localStorage.setItem("cart", JSON.stringify({ state: { cartIds: [123, "p1"] }, version: 1 }));

    await useCartStore.persist.rehydrate();

    expect(useCartStore.getState().cartIds).toEqual([]);
  });

  it("형식이 올바른 저장값은 그대로 복원한다", async () => {
    localStorage.setItem("cart", JSON.stringify({ state: { cartIds: ["p1", "p3"] }, version: 1 }));

    await useCartStore.persist.rehydrate();

    expect(useCartStore.getState().cartIds).toEqual(["p1", "p3"]);
  });

  it("저장 버전이 달라도 migrate를 거쳐 버려지지 않고 복원된다", async () => {
    localStorage.setItem("cart", JSON.stringify({ state: { cartIds: ["p1"] }, version: 0 }));

    await useCartStore.persist.rehydrate();

    expect(useCartStore.getState().cartIds).toEqual(["p1"]);
  });
});
