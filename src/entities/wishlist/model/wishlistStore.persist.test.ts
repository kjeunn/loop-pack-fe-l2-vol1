// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

// cartStore.persist.test와 같은 실패 경로를 wishlist에도 고정한다.
// storage 배선은 store마다 한 줄이라, 한쪽만 검증하면 다른 쪽 배선이 빠져도 초록이 유지된다.
async function loadFreshWishlistStore() {
  vi.resetModules();
  const { useWishlistStore } = await import("@/entities/wishlist/model/wishlistStore");
  return useWishlistStore;
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");

afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(window, "localStorage", originalLocalStorage);
  }
  localStorage.clear();
});

describe("위시리스트 persist — 실패 경로", () => {
  it("localStorage 접근이 막혀도 복원이 끝나고 빈 목록으로 동작한다", async () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });

    const store = await loadFreshWishlistStore();
    await store.persist.rehydrate();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState().wishlistIds).toEqual([]);
  });

  it("저장값이 JSON으로 파싱되지 않으면 빈 목록으로 복원을 끝낸다", async () => {
    localStorage.setItem("wishlist", "{oops");

    const store = await loadFreshWishlistStore();
    await store.persist.rehydrate();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState().wishlistIds).toEqual([]);
  });
});
