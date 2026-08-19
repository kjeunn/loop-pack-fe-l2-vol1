// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeQueryClient } from "@/shared/api/queryClient";

import { ProductListResults } from "./ProductListResults";

// 실제 throwOnError 정책은 makeQueryClient에 있으므로 그대로 쓰고, 테스트에선 재시도 지연만 없앤다.
function renderResults() {
  const client = makeQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
  render(
    <NuqsTestingAdapter>
      <QueryClientProvider client={client}>
        <ProductListResults />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
  return client;
}

const successBody = {
  products: [
    {
      id: "p1",
      brand: "브랜드",
      name: "가디건",
      category: "fashion",
      price: 10000,
      originalPrice: null,
      image: "/images/products/p1.jpg",
      freeShipping: false,
      sizes: [],
      rating: 0,
      reviewCount: 0,
      createdAt: "2024-01-01",
    },
  ],
  categories: [],
  totalCount: 1,
  page: 1,
  pageSize: 10,
};

describe("ProductListResults data 우선 — 배경 실패는 목록을 덮지 않는다", () => {
  afterEach(() => vi.restoreAllMocks());

  it("목록을 보여주는 중 배경 재조회가 5xx로 실패해도 목록은 유지되고 배너로만 알린다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(successBody), { status: 200 }));

    const client = renderResults();

    // 첫 조회 성공: 목록이 그려진다.
    expect(await screen.findByText("가디건")).toBeInTheDocument();

    // 배경 재조회를 5xx로 실패시킨다. 이미 데이터가 있어 경계로 던지지 않는다.
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "서버 오류" }), { status: 500 }),
    );
    await client.refetchQueries().catch(() => undefined);

    // 목록은 그대로 있고, 배너(다시 시도)만 뜬다.
    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.getByText("가디건")).toBeInTheDocument();
  });
});

describe("ProductListResults 상태 표시", () => {
  afterEach(() => vi.restoreAllMocks());

  it("첫 조회가 4xx로 실패하면(보여줄 데이터 없음) 결과 영역에 에러 메시지를 인라인으로 보인다", async () => {
    // 4xx는 서버 오류가 아니라 던지지 않는다(경계로 안 감). 데이터가 없으니 인라인 에러.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "요청 조건을 확인해주세요." }), { status: 400 }),
    );

    renderResults();

    expect(await screen.findByText("요청 조건을 확인해주세요.")).toBeInTheDocument();
  });

  it("결과가 없으면 '조건에 맞는 상품이 없습니다.'를 보인다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ products: [], categories: [], totalCount: 0, page: 1, pageSize: 10 }),
        { status: 200 },
      ),
    );

    renderResults();

    expect(await screen.findByText("조건에 맞는 상품이 없습니다.")).toBeInTheDocument();
  });
});
