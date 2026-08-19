// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeQueryClient } from "@/shared/api/queryClient";

import { ProductListView } from "./ProductListView";

// 실제 throwOnError 정책은 makeQueryClient에 있으므로 그대로 쓰고, 테스트에선 재시도 지연만 없앤다.
function renderView(searchParams?: Record<string, string>) {
  const client = makeQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
  return render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <QueryClientProvider client={client}>
        <ProductListView />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
}

describe("ProductListView 부분 실패 — 결과 영역만 경계로", () => {
  afterEach(() => vi.restoreAllMocks());

  it("목록 조회가 5xx로 실패하면 결과+페이지네이션은 fallback으로 바뀌고 필터는 살아남는다", async () => {
    // 5xx → fetchJson이 ApiError("http", 500)로 던지고, throwOnError 정책이 결과 경계로 전파한다.
    // 필터를 보는 관찰자는 throwOnError:false라 던지지 않는다.
    // (헤더는 (commerce) layout이 렌더하므로 ProductListView 단독 렌더엔 없다 — 헤더 생존은 layout의 책임.)
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "서버 오류" }), { status: 500 }),
    );

    renderView();

    // 결과 영역: 경계 fallback("다시 시도")이 뜬다.
    expect(await screen.findByRole("button", { name: "다시 시도" })).toBeInTheDocument();

    // 필터는 살아 있다: 카테고리 select가 그대로 있다(조건을 바꿔 재시도 가능).
    expect(screen.getByRole("combobox", { name: /카테고리/ })).toBeInTheDocument();

    // 페이지네이션은 결과와 함께 fallback으로 바뀌어 사라진다.
    expect(screen.queryByRole("navigation", { name: "페이지 이동" })).not.toBeInTheDocument();
  });
});

describe("ProductListView 필터 초기화 (Advanced B-1)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("초기화를 누르면 필터가 기본값으로 돌아간다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ products: [], categories: [], totalCount: 0, page: 1, pageSize: 10 }),
        { status: 200 },
      ),
    );

    renderView({ category: "fashion" });

    const categorySelect = screen.getByRole("combobox", { name: /카테고리/ });
    expect(categorySelect).toHaveValue("fashion");

    fireEvent.click(screen.getByRole("button", { name: "초기화" }));

    // URL에서 조건이 제거되면 제어 select가 기본값("all")으로 돌아간다.
    await waitFor(() => expect(categorySelect).toHaveValue("all"));
  });
});
