// [분리 근거] 필터·검색·페이지 상태를 URL에 반영하는 것은 외부 시스템(브라우저 히스토리) 동기화.
// UI·서버 상태와 관심사가 다르고 effect 하나로 끝나므로 별도 hook으로 뺀다.
import { useEffect } from "react";

import type { CategoryValue, SortBy } from "../types";

interface UrlQueryState {
  category: CategoryValue;
  searchQuery: string;
  page: number;
  sortBy: SortBy;
  minPrice: number | "";
  maxPrice: number | "";
  inStockOnly: boolean;
}

export function useUrlQuerySync({
  category,
  searchQuery,
  page,
  sortBy,
  minPrice,
  maxPrice,
  inStockOnly,
}: UrlQueryState) {
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (searchQuery) params.set("q", searchQuery);
    if (page > 1) params.set("page", String(page));
    if (sortBy !== "latest") params.set("sort", sortBy);
    if (minPrice !== "") params.set("minPrice", String(minPrice));
    if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
    if (inStockOnly) params.set("inStock", "true");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [category, searchQuery, page, sortBy, minPrice, maxPrice, inStockOnly]);
}
