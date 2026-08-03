import { beforeEach, describe, expect, it } from "vitest";

import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";

beforeEach(() => {
  useWishlistStore.setState({ wishlistIds: [] });
  localStorage.clear();
});

describe("위시리스트 action", () => {
  it("토글로 켜고 끈다", () => {
    useWishlistStore.getState().toggleWishlist("p1");
    expect(useWishlistStore.getState().wishlistIds).toEqual(["p1"]);

    useWishlistStore.getState().toggleWishlist("p1");
    expect(useWishlistStore.getState().wishlistIds).toEqual([]);
  });
});

describe("저장값 복구", () => {
  it("배열이 아니거나 문자열 아닌 항목이 섞이면 그 목록을 비운다", async () => {
    localStorage.setItem(
      "wishlist",
      JSON.stringify({ state: { wishlistIds: "깨짐" }, version: 1 }),
    );

    await useWishlistStore.persist.rehydrate();

    expect(useWishlistStore.getState().wishlistIds).toEqual([]);
  });

  it("형식이 올바른 저장값은 그대로 복원한다", async () => {
    localStorage.setItem(
      "wishlist",
      JSON.stringify({ state: { wishlistIds: ["p5"] }, version: 1 }),
    );

    await useWishlistStore.persist.rehydrate();

    expect(useWishlistStore.getState().wishlistIds).toEqual(["p5"]);
  });

  it("저장 버전이 달라도 migrate를 거쳐 버려지지 않고 복원된다", async () => {
    localStorage.setItem(
      "wishlist",
      JSON.stringify({ state: { wishlistIds: ["p2"] }, version: 0 }),
    );

    await useWishlistStore.persist.rehydrate();

    expect(useWishlistStore.getState().wishlistIds).toEqual(["p2"]);
  });
});
