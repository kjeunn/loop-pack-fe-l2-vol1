import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { DEFAULT_PAGE_SIZE } from "@/features/products/model/pagination";
import { fetchJson } from "@/shared/api/fetcher";
import type { ProductListQuery, ProductListResponse } from "@/types/commerce";

// 목록은 조건(q·category·sort·page)마다 다른 캐시 엔트리가 된다.
// 방금 보던 조건으로 되돌아오는 경우만 재요청을 아끼면 되므로 staleTime은 짧게 둔다.
// gcTime은 기본값(5분)을 그대로 쓴다. 줄이면 뒤로 가기로 이전 조건에 돌아왔을 때
// 캐시가 이미 비워져 스켈레톤부터 다시 뜨는데, 아끼는 메모리는 상품 30개 규모라 없다.
const PRODUCTS_STALE_TIME = 1000 * 60;

// 부분 조건을 완전한 요청값으로 채운다. query key와 요청 파라미터가 같은 값을 쓰도록
// 이 정규화 결과 하나로 둘 다 만든다(서버 프리패치 시 key 일치가 캐시 재사용의 조건).
function normalize(query: ProductListQuery): Required<ProductListQuery> {
  return {
    q: query.q ?? "",
    category: query.category ?? "all",
    // 기본 정렬(latest)도 API에 명시한다. sort 생략은 4주차 호환 동작이라 화면에선 쓰지 않는다.
    sort: query.sort ?? "latest",
    page: query.page ?? 1,
    pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
  };
}

function toSearchParams(query: Required<ProductListQuery>): string {
  return new URLSearchParams({
    q: query.q,
    category: query.category,
    sort: query.sort,
    page: String(query.page),
    pageSize: String(query.pageSize),
  }).toString();
}

export function productListQueryOptions(query: ProductListQuery) {
  const normalized = normalize(query);

  return queryOptions({
    queryKey: ["products", normalized] as const,
    queryFn: () => fetchJson<ProductListResponse>(`/api/products?${toSearchParams(normalized)}`),
    staleTime: PRODUCTS_STALE_TIME,
    // 페이지·필터를 바꿀 때 스켈레톤으로 깜빡이지 않고 이전 목록을 유지한다.
    placeholderData: keepPreviousData,
  });
}
