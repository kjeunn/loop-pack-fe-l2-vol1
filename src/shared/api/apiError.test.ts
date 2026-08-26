import { describe, expect, it } from "vitest";

import { ApiError, isServerError } from "@/shared/api/apiError";

// 전파 정책의 뿌리. 5xx·서버 오류만 경계로 던지고 나머지는 인라인으로 가른다.
describe("isServerError", () => {
  it("http 5xx는 서버 오류다", () => {
    expect(isServerError(new ApiError("http", 500, "x"))).toBe(true);
    expect(isServerError(new ApiError("http", 503, "x"))).toBe(true);
  });

  it("http 4xx는 서버 오류가 아니다 (500이 경계)", () => {
    expect(isServerError(new ApiError("http", 499, "x"))).toBe(false);
    expect(isServerError(new ApiError("http", 400, "x"))).toBe(false);
  });

  it("http가 아닌 종류는 상태가 5xx여도 서버 오류가 아니다", () => {
    expect(isServerError(new ApiError("network", 500, "x"))).toBe(false);
    expect(isServerError(new ApiError("business", 503, "x"))).toBe(false);
  });

  it("ApiError가 아니면 서버 오류가 아니다", () => {
    expect(isServerError(new Error("x"))).toBe(false);
    expect(isServerError(null)).toBe(false);
  });
});
