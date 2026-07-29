import { beforeEach, describe, expect, it } from "vitest";

import { useCommerceStore } from "@/entities/commerce/model/commerceStore";

// 모듈 싱글턴 store라 테스트 간 상태가 새지 않게 초기화한다.
beforeEach(() => {
  useCommerceStore.setState({ cartIds: [], wishlistIds: [] });
  localStorage.clear();
});

describe("장바구니 action", () => {
  it("담으면 id가 들어가고, 빼면 그 상품만 사라진다", () => {
    useCommerceStore.getState().addToCart("p1");
    useCommerceStore.getState().addToCart("p2");
    expect(useCommerceStore.getState().cartIds).toEqual(["p1", "p2"]);

    useCommerceStore.getState().removeFromCart("p1");
    expect(useCommerceStore.getState().cartIds).toEqual(["p2"]);
  });
});

describe("위시리스트 action", () => {
  it("토글로 켜고 끈다", () => {
    useCommerceStore.getState().toggleWishlist("p1");
    expect(useCommerceStore.getState().wishlistIds).toEqual(["p1"]);

    useCommerceStore.getState().toggleWishlist("p1");
    expect(useCommerceStore.getState().wishlistIds).toEqual([]);
  });
});

// 저장값이 손상돼도 안전한 상태로 복원한다(Advanced A 복구 전략).
describe("저장값 복구", () => {
  it("배열이 아니거나 문자열 아닌 항목이 섞이면 그 목록을 비운다", async () => {
    localStorage.setItem(
      "commerce-store",
      JSON.stringify({ state: { cartIds: [123, "p1"], wishlistIds: "깨짐" }, version: 1 }),
    );

    await useCommerceStore.persist.rehydrate();

    expect(useCommerceStore.getState().cartIds).toEqual([]);
    expect(useCommerceStore.getState().wishlistIds).toEqual([]);
  });

  it("형식이 올바른 저장값은 그대로 복원한다", async () => {
    localStorage.setItem(
      "commerce-store",
      JSON.stringify({ state: { cartIds: ["p1", "p3"], wishlistIds: ["p5"] }, version: 1 }),
    );

    await useCommerceStore.persist.rehydrate();

    expect(useCommerceStore.getState().cartIds).toEqual(["p1", "p3"]);
    expect(useCommerceStore.getState().wishlistIds).toEqual(["p5"]);
  });

  it("저장 버전이 현재와 달라도 migrate를 거쳐 버려지지 않고 복원된다", async () => {
    // migrate 함수가 없으면 persist는 버전 불일치 시 저장값을 통째로 버린다.
    // version 0(현재 1)을 넣어 migrate 경로를 태우고, 유효한 값이 살아남는지 확인한다.
    localStorage.setItem(
      "commerce-store",
      JSON.stringify({ state: { cartIds: ["p1"], wishlistIds: ["p2"] }, version: 0 }),
    );

    await useCommerceStore.persist.rehydrate();

    expect(useCommerceStore.getState().cartIds).toEqual(["p1"]);
    expect(useCommerceStore.getState().wishlistIds).toEqual(["p2"]);
  });

  it("버전이 다르고 저장값이 손상됐으면 migrate가 안전한 형태로 되돌린다", async () => {
    localStorage.setItem(
      "commerce-store",
      JSON.stringify({ state: { cartIds: [123, "p1"], wishlistIds: null }, version: 0 }),
    );

    await useCommerceStore.persist.rehydrate();

    // 숫자가 섞인 배열은 통째로 비우고, 배열이 아닌 값도 빈 배열로 복구한다.
    expect(useCommerceStore.getState().cartIds).toEqual([]);
    expect(useCommerceStore.getState().wishlistIds).toEqual([]);
  });
});
