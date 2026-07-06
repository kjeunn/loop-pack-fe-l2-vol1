// [분리 근거] 필터 UI와 API 쿼리가 함께 읽는 설정값(카테고리·정렬·페이지 크기).
// 컴포넌트 안에 들고 있으면 다른 레이어가 못 읽으므로, 한 곳에서만 바뀌도록 상수로 분리.
import type { CategoryValue, SortBy } from "./types";

export const CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "electronics", label: "전자제품" },
  { value: "fashion", label: "패션" },
  { value: "home", label: "홈" },
  { value: "beauty", label: "뷰티" },
];

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
];

export const PAGE_SIZE = 12;
