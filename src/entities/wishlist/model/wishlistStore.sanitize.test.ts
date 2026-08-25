import { describe, expect, it } from "vitest";

import { sanitize } from "@/entities/wishlist/model/wishlistStore";

// 저장값 복구(zod .catch)는 우리 로직이라 rehydrate(비동기 배선) 없이 순수 함수로 검증한다.
// rehydrate로 돌리면 Stryker에서 변형이 hang→timeout으로 걸려 총점이 흔들린다.
describe("위시리스트 저장값 sanitize", () => {
  it("배열이 아니거나 문자열 아닌 항목이 섞이면 빈 목록으로 복구한다", () => {
    expect(sanitize({ wishlistIds: [123, "p1"] })).toEqual({ wishlistIds: [] });
    expect(sanitize({ wishlistIds: "깨짐" })).toEqual({ wishlistIds: [] });
  });

  it("형식이 올바른 저장값은 그대로 둔다", () => {
    expect(sanitize({ wishlistIds: ["p5"] })).toEqual({ wishlistIds: ["p5"] });
  });

  it("객체 형태가 아니면 기본값으로 복구한다", () => {
    expect(sanitize("깨진 문자열")).toEqual({ wishlistIds: [] });
    expect(sanitize(null)).toEqual({ wishlistIds: [] });
  });
});
