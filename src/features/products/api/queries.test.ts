import { afterEach, describe, expect, it, vi } from "vitest";

import { productListQueryOptions } from "@/features/products/api/queries";
import { loadProductListSearchParams } from "@/features/products/model/searchParams";

afterEach(() => {
  vi.unstubAllGlobals();
});

// URL에서 읽은 조회 조건이 query key와 API 요청 양쪽에 같은 값으로 반영되는지 본다.
describe("productListQueryOptions", () => {
  it("조건이 query key에 그대로 담긴다", () => {
    const options = productListQueryOptions({
      q: "니트",
      category: "fashion",
      sort: "price-asc",
      page: 2,
      pageSize: 15,
    });

    expect(options.queryKey).toEqual([
      "products",
      { q: "니트", category: "fashion", sort: "price-asc", page: 2, pageSize: 15 },
    ]);
  });

  it("생략한 조건은 기본값으로 채워져, 명시했을 때와 같은 key가 된다", () => {
    const omitted = productListQueryOptions({ category: "home" });
    const explicit = productListQueryOptions({
      q: "",
      category: "home",
      sort: "latest",
      page: 1,
      pageSize: 10,
    });

    expect(omitted.queryKey).toEqual(explicit.queryKey);
  });

  it("API 요청 URL이 query key와 같은 조건을 담는다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const options = productListQueryOptions({ category: "fashion", sort: "price-asc", page: 2 });
    await options.queryFn!({ queryKey: options.queryKey } as never);

    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain("category=fashion");
    expect(requestedUrl).toContain("sort=price-asc");
    expect(requestedUrl).toContain("page=2");
  });

  // generateMetadata와 page는 둘 다 loadProductListSearchParams로 조건을 읽어
  // productListQueryOptions에 넘긴다. 이 공유 경로가 만드는 GET URL을 고정해,
  // 한쪽 필터만 늘어 두 경로가 조용히 갈라지는 걸 막는다.
  it("metadata·본문이 공유하는 파서→팩토리 경로가 하나의 GET URL로 고정된다", async () => {
    const query = await loadProductListSearchParams({ q: "니트", category: "fashion" });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const options = productListQueryOptions(query);
    await options.queryFn!({ queryKey: options.queryKey } as never);

    // 클라 환경(jsdom)에선 상대 URL이라 base를 붙여 파싱한다.
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    expect(decodeURIComponent(requestedUrl.search)).toBe(
      "?q=니트&category=fashion&sort=latest&page=1&pageSize=10",
    );
  });
});
