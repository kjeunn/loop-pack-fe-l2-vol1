// [분리 근거] 상품 목록 쿼리 상태(필터·검색·정렬·페이지)를 한 곳에서 소유한다.
// 이 값들은 "아무거나 바뀌면 첫 페이지로"라는 불변식을 공유하고, 같은 소비자(서버 fetch·URL 동기화)가
// 함께 읽으므로 하나의 hook으로 묶는다. viewMode(표시 토글)는 쿼리와 무관해 여기 두지 않는다.
import { useState } from "react";

import { CATEGORIES, SORT_OPTIONS } from "../constants";
import type { CategoryValue, SortBy } from "../types";

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);
const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

function parsePrice(raw: string | null): number | "" {
  if (!raw) return "";
  const value = Number(raw);
  return Number.isNaN(value) ? "" : value;
}

// URL 쿼리에서 초기 필터 상태를 복원한다(새로고침·공유·북마크로 열어도 조건 유지).
// 없거나 유효하지 않은 값은 기본값으로 떨어진다.
function readInitialQuery() {
  const params = new URLSearchParams(window.location.search);

  const categoryParam = params.get("category") as CategoryValue | null;
  const sortParam = params.get("sort") as SortBy | null;
  const pageParam = Number(params.get("page"));

  return {
    category: categoryParam && CATEGORY_VALUES.includes(categoryParam) ? categoryParam : "all",
    minPrice: parsePrice(params.get("minPrice")),
    maxPrice: parsePrice(params.get("maxPrice")),
    sortBy: sortParam && SORT_VALUES.includes(sortParam) ? sortParam : "latest",
    searchQuery: params.get("q") ?? "",
    inStockOnly: params.get("inStock") === "true",
    page: Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1,
  };
}

export function useProductQuery() {
  // 초기값은 URL에서 한 번 복원(readInitialQuery). 이후 변경은 아래 상태가 소유한다.
  const [initialQuery] = useState(readInitialQuery);
  const [category, setCategory] = useState<CategoryValue>(initialQuery.category);
  const [minPrice, setMinPrice] = useState<number | "">(initialQuery.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | "">(initialQuery.maxPrice);
  const [sortBy, setSortBy] = useState<SortBy>(initialQuery.sortBy);
  const [searchQuery, setSearchQuery] = useState(initialQuery.searchQuery);
  const [inStockOnly, setInStockOnly] = useState(initialQuery.inStockOnly);
  const [page, setPage] = useState(initialQuery.page);

  // page 상태를 필터·검색과 같은 hook에 두는 이유:
  // "필터가 바뀌면 첫 페이지로"라는 불변식을 공유하고, 같은 소비자(서버 fetch·URL 동기화)가 함께 읽는다.
  // 별도 usePagination으로 쪼개면 필터 변경 시 그 hook의 setPage를 호출해야 해 hook 간 결합이 생긴다.
  // (페이지 번호 UI는 별도 컴포넌트로 빼되, 사용처가 하나뿐이라 전역 공통 컴포넌트로 승격하지는 않는다.)

  // 필터·검색·정렬이 바뀌면 현재 페이지에 결과가 없을 수 있으므로 항상 첫 페이지로 되돌린다.
  // setter를 "값 설정 + 첫 페이지로"로 감싸 반복되는 리셋 규칙을 한 곳에 모은다.
  const withPageReset =
    <T>(setValue: (value: T) => void) =>
    (value: T) => {
      setValue(value);
      setPage(1);
    };

  const onCategoryChange = withPageReset(setCategory);
  const onMinPriceChange = withPageReset(setMinPrice);
  const onMaxPriceChange = withPageReset(setMaxPrice);
  const onSortChange = withPageReset(setSortBy);
  const onSearchChange = withPageReset(setSearchQuery);
  const onInStockOnlyChange = withPageReset(setInStockOnly);
  const onPageChange = (next: number) => setPage(next);

  const onResetFilters = () => {
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("latest");
    setSearchQuery("");
    setInStockOnly(false);
    setPage(1);
  };

  return {
    category,
    minPrice,
    maxPrice,
    sortBy,
    searchQuery,
    inStockOnly,
    page,
    onCategoryChange,
    onMinPriceChange,
    onMaxPriceChange,
    onSortChange,
    onSearchChange,
    onInStockOnlyChange,
    onPageChange,
    onResetFilters,
  };
}
