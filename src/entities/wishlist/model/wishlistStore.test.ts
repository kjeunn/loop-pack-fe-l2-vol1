import { beforeEach, describe, expect, it } from "vitest";

import { useWishlistStore } from "@/entities/wishlist/model/wishlistStore";

// 모듈 싱글턴 store라 테스트 간 상태가 새지 않게 초기화한다.
beforeEach(() => {
  useWishlistStore.setState({ wishlistIds: [] });
});

describe("위시리스트 개수 파생", () => {
  it("토글로 켜면 들어가고, 다시 토글하면 빠진다", () => {
    useWishlistStore.getState().toggleWishlist("p1");
    expect(useWishlistStore.getState().wishlistIds).toEqual(["p1"]);

    useWishlistStore.getState().toggleWishlist("p1");
    expect(useWishlistStore.getState().wishlistIds).toEqual([]);
  });

  it("서로 다른 상품을 토글하면 개수가 누적된다", () => {
    useWishlistStore.getState().toggleWishlist("p1");
    useWishlistStore.getState().toggleWishlist("p2");
    expect(useWishlistStore.getState().wishlistIds.length).toBe(2);
  });

  it("같은 상품을 두 번 토글하면 개수가 0으로 돌아온다", () => {
    useWishlistStore.getState().toggleWishlist("p1");
    useWishlistStore.getState().toggleWishlist("p1");
    expect(useWishlistStore.getState().wishlistIds.length).toBe(0);
  });

  it("두 상품을 찜한 뒤 하나만 다시 누르면 그 상품만 빠지고 다른 상품은 남는다", () => {
    useWishlistStore.getState().toggleWishlist("p1");
    useWishlistStore.getState().toggleWishlist("p2");
    useWishlistStore.getState().toggleWishlist("p1"); // p1만 다시 눌러 해제
    expect(useWishlistStore.getState().wishlistIds).toEqual(["p2"]);
  });
});
