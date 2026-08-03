import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

// 서버 컴포넌트를 client 컨텍스트(vitest)에서 부르므로 server-only 가드를 비운다.
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import ProductList from "./page";

// 서버 응답으로 계산: totalCount 20 / pageSize 10 → totalPages 2.
function mockList(page: number) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({ products: [], categories: [], totalCount: 20, page, pageSize: 10 }),
      { status: 200 },
    ),
  );
}

describe("상품 목록 서버 page — page 범위 초과 시 redirect", () => {
  afterEach(() => {
    vi.mocked(redirect).mockClear();
    vi.restoreAllMocks();
  });

  it("page가 마지막을 넘으면 1페이지 캐노니컬 URL로 redirect한다", async () => {
    mockList(99);
    await ProductList({ searchParams: Promise.resolve({ page: "99" }) });
    // page 1은 기본값이라 serializer가 생략 → 순수 경로.
    expect(redirect).toHaveBeenCalledWith("/products");
  });

  it("page가 범위 안이면 redirect하지 않는다", async () => {
    mockList(1);
    await ProductList({ searchParams: Promise.resolve({ page: "1" }) });
    expect(redirect).not.toHaveBeenCalled();
  });
});
