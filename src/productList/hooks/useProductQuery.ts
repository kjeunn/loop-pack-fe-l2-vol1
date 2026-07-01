// [분리 근거] 상품 목록 쿼리 상태(필터·검색·정렬·페이지)를 한 곳에서 소유한다.
// 이 값들은 "아무거나 바뀌면 첫 페이지로"라는 불변식을 공유하고, 같은 소비자(서버 fetch·URL 동기화)가
// 함께 읽으므로 하나의 hook으로 묶는다. viewMode(표시 토글)는 쿼리와 무관해 여기 두지 않는다.
import { useState } from "react";

import type { CategoryValue, SortBy } from "../types";

export function useProductQuery() {
  const [category, setCategory] = useState<CategoryValue>("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

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
