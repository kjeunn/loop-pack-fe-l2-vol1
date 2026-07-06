// [분리 근거] 상품 목록 쿼리 상태(필터·검색·정렬·페이지)를 한 곳에서 소유한다.
// 이 값들은 "아무거나 바뀌면 첫 페이지로"라는 불변식을 공유하고, 같은 소비자(서버 fetch)가
// 함께 읽으므로 하나의 hook으로 묶는다. viewMode(표시 토글)는 쿼리와 무관해 여기 두지 않는다.
//
// URL이 단일 소스다. useState로 별도 상태를 두지 않고 useSearchParams에서 직접 읽어,
// 뒤로가기·앞으로가기(popstate)로 URL이 바뀌면 화면도 따라 바뀐다. 새로고침·공유·북마크도 자동 유지된다.
import { useSearchParams } from "react-router-dom";

import { CATEGORIES, SORT_OPTIONS } from "../constants";
import type { CategoryValue, SortBy } from "../types";

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);
const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

function parsePrice(raw: string | null): number | "" {
  if (!raw) return "";
  const value = Number(raw);
  return Number.isNaN(value) ? "" : value;
}

// 기본값이면 param을 지워 URL을 깨끗하게 유지한다(?category=all 같은 노이즈 방지).
function setOrDelete(params: URLSearchParams, key: string, value: string, isDefault: boolean) {
  if (isDefault) params.delete(key);
  else params.set(key, value);
}

interface UpdateOptions {
  // 타입 입력(검색·가격)은 매 글자마다 히스토리를 쌓지 않도록 현재 항목을 교체한다.
  replace?: boolean;
  // 페이지 자체를 옮길 때만 false. 그 외 필터 변경은 항상 첫 페이지로 되돌린다.
  resetPage?: boolean;
}

export function useProductQuery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get("category") as CategoryValue | null;
  const sortParam = searchParams.get("sort") as SortBy | null;
  const pageParam = Number(searchParams.get("page"));

  // 유효하지 않은 값은 기본값으로 떨어뜨려 읽는다(URL을 그대로 신뢰하지 않는다).
  const category: CategoryValue =
    categoryParam && CATEGORY_VALUES.includes(categoryParam) ? categoryParam : "all";
  const sortBy: SortBy = sortParam && SORT_VALUES.includes(sortParam) ? sortParam : "latest";
  const minPrice = parsePrice(searchParams.get("minPrice"));
  const maxPrice = parsePrice(searchParams.get("maxPrice"));
  const searchQuery = searchParams.get("q") ?? "";
  const inStockOnly = searchParams.get("inStock") === "true";
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  // 필터·검색·정렬이 바뀌면 현재 페이지에 결과가 없을 수 있으므로 항상 첫 페이지로 되돌린다(resetPage).
  // setSearchParams에 함수형 업데이트를 넘겨 직전 URL 위에서 갱신한다.
  const updateParams = (mutate: (params: URLSearchParams) => void, options: UpdateOptions = {}) => {
    const { resetPage = true, replace = false } = options;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        if (resetPage) next.delete("page");
        return next;
      },
      { replace },
    );
  };

  const onCategoryChange = (next: CategoryValue) =>
    updateParams((params) => setOrDelete(params, "category", next, next === "all"));
  const onSortChange = (next: SortBy) =>
    updateParams((params) => setOrDelete(params, "sort", next, next === "latest"));
  const onInStockOnlyChange = (next: boolean) =>
    updateParams((params) => setOrDelete(params, "inStock", "true", !next));

  const onMinPriceChange = (next: number | "") =>
    updateParams((params) => setOrDelete(params, "minPrice", String(next), next === ""), {
      replace: true,
    });
  const onMaxPriceChange = (next: number | "") =>
    updateParams((params) => setOrDelete(params, "maxPrice", String(next), next === ""), {
      replace: true,
    });
  const onSearchChange = (next: string) =>
    updateParams((params) => setOrDelete(params, "q", next, next === ""), { replace: true });

  const onPageChange = (next: number) =>
    updateParams((params) => setOrDelete(params, "page", String(next), next <= 1), {
      resetPage: false,
    });

  const onResetFilters = () => setSearchParams({});

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
