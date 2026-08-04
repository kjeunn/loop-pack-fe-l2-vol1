"use client";

import { useQuery } from "@tanstack/react-query";

import { productListQueryOptions } from "@/features/products/api/queries";
import type { ProductListQuery } from "@/features/products/model/query";

// 페이지네이션(전체 개수)을 위한 "껍데기 관찰자".
// 결과 목록은 ProductListResults가 직접 조회하고, 여기서는 같은 query key를 다시 구독해
// totalCount만 읽는다. 같은 캐시를 공유하므로 요청은 한 번만 나간다.
//
// 껍데기(헤더·필터·페이지네이션)는 5xx여도 던지지 않도록 throwOnError를 false로 덮어쓴다.
// 5xx 경계 전파는 결과 영역(ProductListResults + 그 ErrorBoundary)이 전담해,
// 조회가 실패해도 껍데기는 살아남는다.
//
// 같은 데이터를 결과 영역과 다른 전파 정책으로 구독하는 구조라, 그 의도를 이 훅 이름으로 드러낸다.
export function useShellProductList(query: ProductListQuery) {
  return useQuery({
    ...productListQueryOptions(query),
    throwOnError: false,
  });
}
