import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeQueryClient } from "@/shared/api/queryClient";

import { ProductListView } from "./ProductListView";

// 실제 throwOnError 정책은 makeQueryClient에 있으므로 그대로 쓰고, 테스트에선 재시도 지연만 없앤다.
function renderView() {
  const client = makeQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
  return render(
    <NuqsTestingAdapter>
      <QueryClientProvider client={client}>
        <ProductListView />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
}

describe("ProductListView 부분 실패 — 결과 영역만 경계로", () => {
  afterEach(() => vi.restoreAllMocks());

  it("목록 조회가 5xx로 실패해도 헤더·카테고리 필터는 살고 결과 영역만 fallback을 그린다", async () => {
    // 5xx → fetchJson이 ApiError("http", 500)로 던지고, throwOnError 정책이 결과 경계로 전파한다.
    // 껍데기(헤더·필터·페이지네이션)를 보는 관찰자는 throwOnError:false라 던지지 않는다.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "서버 오류" }), { status: 500 }),
    );

    renderView();

    // 결과 영역: 경계 fallback("다시 시도")이 뜬다.
    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeInTheDocument();

    // 껍데기는 살아 있다: 헤더의 상품 링크와 카테고리 select가 그대로 있다.
    expect(screen.getByRole("link", { name: "상품" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /카테고리/ })).toBeInTheDocument();
  });
});
