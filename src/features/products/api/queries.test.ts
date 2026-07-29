import { afterEach, describe, expect, it, vi } from "vitest";

import { productListQueryOptions } from "@/features/products/api/queries";

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
});
