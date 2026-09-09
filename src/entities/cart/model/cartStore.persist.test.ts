// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

// persist의 실패 경로 — 스토리지 접근 불가·저장값이 JSON이 아님 — 는 라이브러리 기본 storage가
// 처리하지 못해 우리가 막아야 하는 지점이다. sanitize(모양 복구)로는 안 잡히므로 여기서만
// 실제 rehydrate를 돌려 확인한다. persist 초기화가 스텁된 localStorage를 보도록 모듈을 매번 새로 읽는다.
async function loadFreshCartStore() {
  vi.resetModules();
  const { useCartStore } = await import("@/entities/cart/model/cartStore");
  return useCartStore;
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");

afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(window, "localStorage", originalLocalStorage);
  }
  localStorage.clear();
});

describe("장바구니 persist — 실패 경로", () => {
  it("localStorage 접근이 막혀도(SecurityError) 복원이 끝나고 빈 장바구니로 동작한다", async () => {
    // Safari '모든 쿠키 차단'·사이트별 저장소 차단에서는 window.localStorage 접근 자체가 throw한다.
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });

    const store = await loadFreshCartStore();
    await store.persist.rehydrate();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState().cartIds).toEqual([]);
    // 저장은 못 해도 메모리 안에서는 담긴다.
    store.getState().addToCart("p1");
    expect(store.getState().cartIds).toEqual(["p1"]);
  });

  it("저장값이 JSON으로 파싱되지 않으면 빈 장바구니로 복원을 끝낸다", async () => {
    // 쿼터 초과로 중간까지 써진 값, 확장 프로그램 간섭, 옛 버전의 비JSON 저장 등.
    localStorage.setItem("cart", "{oops");

    const store = await loadFreshCartStore();
    await store.persist.rehydrate();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(store.getState().cartIds).toEqual([]);
  });
});
