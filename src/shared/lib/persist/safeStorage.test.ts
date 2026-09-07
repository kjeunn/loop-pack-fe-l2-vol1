// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { createSafeStorage } from "@/shared/lib/persist/safeStorage";

const originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");

function blockLocalStorage() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      throw new DOMException("blocked", "SecurityError");
    },
  });
}

afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(window, "localStorage", originalLocalStorage);
  }
  localStorage.clear();
});

// persist가 이 storage에 기대는 계약은 하나다 — 어떤 상황에서도 throw하지 않는다.
// throw하면 persist가 복원을 끝내지 못하거나 API를 만들지 않아 화면이 멈춘다.
describe("createSafeStorage", () => {
  it("정상 JSON은 그대로 돌려준다", () => {
    localStorage.setItem("k", JSON.stringify({ state: { ids: ["p1"] }, version: 1 }));
    expect(createSafeStorage<{ ids: string[] }>().getItem("k")).toEqual({
      state: { ids: ["p1"] },
      version: 1,
    });
  });

  it("값이 없으면 null", () => {
    expect(createSafeStorage().getItem("k")).toBeNull();
  });

  it("JSON이 아니면 throw 대신 null", () => {
    localStorage.setItem("k", "{oops");
    expect(() => createSafeStorage().getItem("k")).not.toThrow();
    expect(createSafeStorage().getItem("k")).toBeNull();
  });

  it("객체가 아닌 JSON(null·숫자)도 null — persist가 .version을 읽다 다시 throw하지 않게", () => {
    localStorage.setItem("k", "null");
    expect(createSafeStorage().getItem("k")).toBeNull();
    localStorage.setItem("k", "123");
    expect(createSafeStorage().getItem("k")).toBeNull();
  });

  it("localStorage 접근이 막히면 읽기는 null, 쓰기·삭제는 조용히 넘어간다", () => {
    blockLocalStorage();
    const storage = createSafeStorage<{ ids: string[] }>();
    expect(storage.getItem("k")).toBeNull();
    expect(() => storage.setItem("k", { state: { ids: [] }, version: 1 })).not.toThrow();
    expect(() => storage.removeItem("k")).not.toThrow();
  });
});
