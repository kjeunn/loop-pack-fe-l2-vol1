import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/api/apiError";
import { makeQueryClient } from "@/shared/api/queryClient";

// 재시도·에러 전파는 우리가 쓴 결정이므로 순수하게 확인한다.
// 규칙 함수를 QueryClient 기본 옵션에서 꺼내 직접 호출한다 — RQ가 그 규칙을 적용하는 것은 믿는다.
const { retry, throwOnError } = makeQueryClient().getDefaultOptions().queries!;
const shouldRetry = retry as (failureCount: number, error: unknown) => boolean;
const shouldThrow = throwOnError as (
  error: unknown,
  query: { state: { data: unknown } },
) => boolean;

const networkError = new ApiError("network", null, "네트워크");
const httpError = (status: number) => new ApiError("http", status, "http");

describe("재시도 규칙", () => {
  it("네트워크 실패는 한 번만 재시도한다", () => {
    expect(shouldRetry(0, networkError)).toBe(true);
    expect(shouldRetry(1, networkError)).toBe(false);
  });

  it("네트워크가 아닌 실패(4xx·5xx)는 재시도하지 않는다", () => {
    expect(shouldRetry(0, httpError(400))).toBe(false);
    expect(shouldRetry(0, httpError(500))).toBe(false);
  });

  it("ApiError가 아닌 오류는 재시도하지 않는다", () => {
    expect(shouldRetry(0, new Error("plain"))).toBe(false);
  });
});

describe("에러 전파 규칙", () => {
  it("5xx이고 보여줄 데이터가 없으면 경계로 던진다", () => {
    expect(shouldThrow(httpError(500), { state: { data: undefined } })).toBe(true);
  });

  it("5xx라도 이미 데이터가 있으면 던지지 않고 인라인으로 둔다", () => {
    expect(shouldThrow(httpError(500), { state: { data: { products: [] } } })).toBe(false);
  });

  it("4xx와 네트워크 실패는 경계로 던지지 않는다", () => {
    expect(shouldThrow(httpError(400), { state: { data: undefined } })).toBe(false);
    expect(shouldThrow(networkError, { state: { data: undefined } })).toBe(false);
  });

  it("500 경계 바로 아래(499)와 ApiError가 아닌 오류는 던지지 않는다", () => {
    expect(shouldThrow(httpError(499), { state: { data: undefined } })).toBe(false);
    expect(shouldThrow(new Error("plain"), { state: { data: undefined } })).toBe(false);
  });
});
